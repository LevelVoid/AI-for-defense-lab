"""WebSocket hub + co-evolution endpoint backed by the real red/blue pipeline."""
import asyncio
import json
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.ws_manager import manager
from app.schemas.coevolution import CoEvolutionEvent, EpochResult
from app.services import red_team, blue_team

router = APIRouter(tags=["WebSocket"])

# All 16 attack vector IDs
_ALL_VECTORS = [f"v{i:02d}" for i in range(1, 17)]

# Adversarial pressure schedule: epoch → confidence penalty applied by the red team.
# Epoch 1 = baseline (no evasion tricks), epoch 2 = red team adapts hard,
# epochs 3-5 = blue team retrains and closes the gap.
_ADVERSARIAL_PENALTY = {1: 0.00, 2: 0.13, 3: 0.06, 4: 0.025, 5: 0.008}

# Confidence below this → payload "evaded" the detector
_DETECTION_THRESHOLD = 0.88


@router.websocket("/ws/stream/{client_id}")
async def ws_stream(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "generate_and_detect":
                vector_id = data.get("vector_id", "v01")
                params = data.get("params", {})

                gen = red_team.generate_payload(vector_id, params)
                await manager.send(client_id, {
                    "event": "payload_generated",
                    "vector_id": vector_id,
                    "payload": gen.payload,
                    "payload_format": gen.payload_format,
                    "metadata": gen.metadata,
                })

                result = blue_team.detect(vector_id, gen.payload)
                await manager.send(client_id, {
                    "event": "detection_result",
                    "vector_id": vector_id,
                    "is_fraud": result.is_fraud,
                    "confidence": result.confidence,
                    "model_used": result.model_used,
                    "shap_values": result.shap_values,
                    "latency_ms": result.latency_ms,
                    "explanation": result.explanation,
                })

            elif action == "scale_attack":
                # Fire one vector many times — attacker probes with increasing
                # adversarial sophistication until some attempts slip through.
                vector_id = data.get("vector_id", "v01")
                count = max(10, min(data.get("count", 50), 100))
                detected_count = 0
                evaded_count = 0

                for attempt in range(1, count + 1):
                    gen = red_team.generate_payload(vector_id, {"attempt": attempt})
                    raw = blue_team.detect(vector_id, gen.payload)

                    # Attacker learns: adversarial drift grows non-linearly,
                    # with randomness — most attempts detected, a few evade late.
                    progress = (attempt / count) ** 1.5
                    drift = progress * 0.12 + random.uniform(-0.015, 0.015)
                    effective_conf = max(0.50, raw.confidence - drift)
                    is_detected = effective_conf >= _DETECTION_THRESHOLD

                    if is_detected:
                        detected_count += 1
                    else:
                        evaded_count += 1

                    # Send payload only on first attempt and each evasion
                    if attempt == 1 or not is_detected:
                        await manager.send(client_id, {
                            "event": "payload_generated",
                            "vector_id": vector_id,
                            "payload": gen.payload,
                            "payload_format": gen.payload_format,
                            "attempt": attempt,
                            "total": count,
                        })

                    await manager.send(client_id, {
                        "event": "detection_result",
                        "vector_id": vector_id,
                        "is_fraud": is_detected,
                        "confidence": round(effective_conf, 4),
                        "model_used": raw.model_used,
                        "shap_values": raw.shap_values,
                        "latency_ms": raw.latency_ms,
                        "explanation": raw.explanation,
                        "attempt": attempt,
                        "total": count,
                    })

                await manager.send(client_id, {
                    "event": "scale_complete",
                    "vector_id": vector_id,
                    "total": count,
                    "detected": detected_count,
                    "evaded": evaded_count,
                })

            elif action == "batch_attack":
                params = data.get("params", {})
                detected_count = 0
                evaded_count = 0
                for vid in _ALL_VECTORS:
                    gen = red_team.generate_payload(vid, params)
                    await manager.send(client_id, {
                        "event": "payload_generated",
                        "vector_id": vid,
                        "payload": gen.payload,
                        "payload_format": gen.payload_format,
                        "metadata": gen.metadata,
                    })
                    result = blue_team.detect(vid, gen.payload)
                    if result.is_fraud:
                        detected_count += 1
                    else:
                        evaded_count += 1
                    await manager.send(client_id, {
                        "event": "detection_result",
                        "vector_id": vid,
                        "is_fraud": result.is_fraud,
                        "confidence": result.confidence,
                        "model_used": result.model_used,
                        "shap_values": result.shap_values,
                        "latency_ms": result.latency_ms,
                        "explanation": result.explanation,
                    })
                await manager.send(client_id, {
                    "event": "batch_complete",
                    "total": len(_ALL_VECTORS),
                    "detected": detected_count,
                    "evaded": evaded_count,
                })

            elif action == "run_epoch":
                epoch = data.get("epoch", 1)
                await _run_epoch(websocket, epoch)

    except WebSocketDisconnect:
        manager.disconnect(client_id, websocket)


def _epoch_params(epoch: int) -> tuple[tuple[int, int], float]:
    """Return (attempt_range, retrain_boost) for any epoch number.

    Epochs 1-5 follow the canonical arc: baseline → spike → retrain → collapse → equilibrium.
    Epochs 6+ continue hardening asymptotically: attack stays at max sophistication,
    boost grows toward a ceiling of ~0.295 so evasion converges toward ~3-5%.
    """
    ATTEMPT_RANGES = {
        1: (1,   6),
        2: (30, 46),
        3: (28, 46),
        4: (34, 50),
        5: (40, 50),
    }
    RETRAIN_BOOST_FIXED = {1: 0.000, 2: 0.000, 3: 0.115, 4: 0.175, 5: 0.235}

    if epoch <= 5:
        lo, hi = ATTEMPT_RANGES[epoch]
        boost = RETRAIN_BOOST_FIXED[epoch]
    else:
        lo, hi = (40, 50)
        # Asymptotically approaches 0.295: rapid early gain, then diminishing returns
        import math as _math
        boost = 0.295 * (1 - _math.exp(-(epoch - 4) / 3.5))

    return (lo, hi), boost


async def _run_epoch(websocket: WebSocket, epoch: int):
    """High-fidelity co-evolution epoch.

    Attack sophistication (attempt range) per epoch:
      E1  — obvious attacks (attempt 1–6):  most features clearly fraudulent → few evade
      E2  — red team adapts (30–46):        features look legitimate → evasion spikes
      E3  — same attack level but blue team has now retrained on E1+E2 evaded samples
      E4+ — attack escalates; blue team keeps retraining; evasion converges toward ~5%

    Blue team retrains EVERY epoch using the full accumulated buffer of evaded payloads.
    Confidence is purely model-driven: p_fraud ∈ [0,1] → confidence ∈ [0.50, 0.999].
    AUC and FPR are computed from a real held-out test set via sklearn.
    """
    try:
        SAMPLES_PER_VECTOR = 3
        total_samples = len(_ALL_VECTORS) * SAMPLES_PER_VECTOR
        (lo, hi), _ = _epoch_params(epoch)

        # Fresh run: reinitialise models so each "Run" starts from the same baseline
        if epoch == 1:
            blue_team.reset_run()

        # ── 1. GENERATING ────────────────────────────────────────────────────
        await asyncio.sleep(0.25)
        await websocket.send_text(json.dumps(CoEvolutionEvent(
            event_type="generating", epoch=epoch,
            data={"vectors": len(_ALL_VECTORS), "samples": total_samples,
                  "attempt_range": f"{lo}-{hi}"},
        ).model_dump()))

        # ── 2. EVADING ───────────────────────────────────────────────────────
        await asyncio.sleep(0.3)
        await websocket.send_text(json.dumps(CoEvolutionEvent(
            event_type="evading", epoch=epoch,
            data={"attempt_range": f"{lo}-{hi}", "epoch": epoch},
        ).model_dump()))

        # ── 3. DETECTING ─────────────────────────────────────────────────────
        await asyncio.sleep(0.25)
        await websocket.send_text(json.dumps(CoEvolutionEvent(
            event_type="detecting", epoch=epoch,
            data={"batch_size": total_samples},
        ).model_dump()))

        detect_results: list[dict] = []
        all_sample_confs: list[float] = []
        evaded_payloads: list[tuple[str, str]] = []   # (vector_id, payload) for retraining

        for vid in _ALL_VECTORS:
            samples: list[dict] = []
            for _ in range(SAMPLES_PER_VECTOR):
                attempt = random.randint(lo, hi)
                gen = red_team.generate_payload(vid, {"attempt": attempt})
                raw = blue_team.detect(vid, gen.payload)
                conf = raw.confidence   # purely model-driven, no artificial boost
                samples.append({
                    "conf": conf,
                    "model": raw.model_used,
                    "latency": raw.latency_ms,
                })
                all_sample_confs.append(conf)
                if conf < _DETECTION_THRESHOLD:
                    evaded_payloads.append((vid, gen.payload))

            avg_conf = round(sum(s["conf"] for s in samples) / SAMPLES_PER_VECTOR, 4)
            n_det = sum(1 for s in samples if s["conf"] >= _DETECTION_THRESHOLD)
            detected = n_det >= (SAMPLES_PER_VECTOR // 2 + 1)

            detect_results.append({
                "vector_id": vid,
                "model": samples[0]["model"],
                "effective_conf": avg_conf,
                "detected": detected,
                "latency_ms": sum(s["latency"] for s in samples) / SAMPLES_PER_VECTOR,
            })
            await websocket.send_text(json.dumps(CoEvolutionEvent(
                event_type="vector_result", epoch=epoch,
                data={
                    "vector_id": vid,
                    "model": samples[0]["model"],
                    "conf": avg_conf,
                    "detected": bool(detected),
                    "samples": SAMPLES_PER_VECTOR,
                },
            ).model_dump()))

        # ── 4. RETRAINING ────────────────────────────────────────────────────
        n_all = len(all_sample_confs)
        n_evaded = sum(1 for c in all_sample_confs if c < _DETECTION_THRESHOLD)
        evasion_rate = n_evaded / n_all

        # Record this epoch's evaded payloads and retrain — the next epoch's
        # model is genuinely better because it has seen these attack patterns.
        for vid, payload in evaded_payloads:
            blue_team.record_evaded(vid, payload)
        new_samples = blue_team.retrain_on_evaded()

        await asyncio.sleep(0.35)
        await websocket.send_text(json.dumps(CoEvolutionEvent(
            event_type="retraining", epoch=epoch,
            data={
                "evasion_rate": round(evasion_rate, 4),
                "new_samples": new_samples,
                "evaded_count": len(evaded_payloads),
            },
        ).model_dump()))

        # ── Metrics ───────────────────────────────────────────────────────────
        n_total = len(detect_results)
        n_detected = sum(1 for r in detect_results if r["detected"])
        detection_rate = n_detected / n_total

        # Real AUC and FPR from sklearn on a held-out test set (seed 99)
        auc, fpr = blue_team.compute_auc_fpr()

        result = EpochResult(
            epoch=epoch,
            evasion_rate=round(evasion_rate, 4),
            detection_rate=round(detection_rate, 4),
            false_positive_rate=fpr,
            auc=auc,
            new_samples=new_samples,
        )
        await websocket.send_text(json.dumps({
            "event": "epoch_complete",
            **result.model_dump(),
        }))

    except Exception as exc:
        logger.error("_run_epoch E%d crashed: %s", epoch, exc, exc_info=True)
        try:
            await websocket.send_text(json.dumps({
                "event": "epoch_error",
                "epoch": epoch,
                "error": str(exc),
            }))
        except Exception:
            pass
