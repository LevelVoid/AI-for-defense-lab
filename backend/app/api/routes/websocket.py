"""WebSocket hub + co-evolution simulation endpoint."""
import asyncio
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.ws_manager import manager
from app.schemas.attack import GenerateRequest
from app.schemas.coevolution import CoEvolutionEvent, EpochResult
from app.services import red_team, blue_team

router = APIRouter(tags=["WebSocket"])


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

            elif action == "run_epoch":
                epoch = data.get("epoch", 1)
                await _simulate_epoch(client_id, epoch)

    except WebSocketDisconnect:
        manager.disconnect(client_id)


async def _simulate_epoch(client_id: str, epoch: int):
    """Simulate one co-evolution epoch: generate → evade → retrain → improve."""
    evasion_rate = max(0.0, 0.45 - (epoch - 1) * 0.07 + random.uniform(-0.03, 0.03))
    detection_rate = min(1.0, 0.55 + (epoch - 1) * 0.07 + random.uniform(-0.02, 0.02))
    fpr = max(0.0005, 0.002 - (epoch - 1) * 0.0002 + random.uniform(-0.0001, 0.0001))
    auc = min(0.999, 0.94 + (epoch - 1) * 0.008 + random.uniform(-0.002, 0.002))

    for step in ["generating", "evading", "detecting", "retraining"]:
        await asyncio.sleep(0.4)
        await manager.send(client_id, CoEvolutionEvent(
            event_type=step,
            epoch=epoch,
            data={"evasion_rate": round(evasion_rate, 4)},
        ).model_dump())

    result = EpochResult(
        epoch=epoch,
        evasion_rate=round(evasion_rate, 4),
        detection_rate=round(detection_rate, 4),
        false_positive_rate=round(fpr, 5),
        auc=round(auc, 4),
        new_samples=random.randint(120, 400),
    )
    await manager.send(client_id, {
        "event": "epoch_complete",
        **result.model_dump(),
    })
