"""Blue-team defender service stubs — returns detection results per vector."""
import time
import random

from app.schemas.attack import DetectResult

# Which model handles which vector
_VECTOR_MODEL = {
    "v01": "DeBERTa-v3-base",
    "v02": "XGBoost-tabular",
    "v03": "XGBoost-tabular",
    "v04": "XGBoost-tabular",
    "v05": "XGBoost-tabular",
    "v06": "XGBoost-tabular",
    "v07": "PyTorch-CNN",
    "v08": "DeBERTa-v3-base",
    "v09": "DeBERTa-v3-base",
    "v10": "DeBERTa-v3-base",
    "v11": "GraphSAGE",
    "v12": "DeBERTa-v3-base",
    "v13": "PyTorch-CNN",
    "v14": "XGBoost-tabular",
    "v15": "GraphSAGE",
    "v16": "GraphSAGE",
}

_VECTOR_SHAP: dict[str, dict[str, float]] = {
    "v01": {"rmtinf_injection_score": 0.72, "unusual_amount": 0.18, "sender_risk": 0.10},
    "v02": {"de4_anomaly": 0.61, "de22_deviation": 0.25, "velocity": 0.14},
    "v03": {"mti_ghost_pattern": 0.55, "log_gap_seconds": 0.30, "terminal_id_risk": 0.15},
    "v04": {"rrn_reuse_score": 0.68, "merchant_id_mismatch": 0.22, "void_timing": 0.10},
    "v05": {"canvas_fp_entropy": 0.58, "ip_geomatch": 0.27, "ua_spoofing": 0.15},
    "v06": {"keystroke_variance": 0.51, "mouse_jitter": 0.32, "pressure_outlier": 0.17},
    "v07": {"liveness_score": 0.81, "frame_metadata": 0.12, "model_artifact": 0.07},
    "v08": {"prompt_injection_score": 0.76, "dom_anomaly": 0.16, "payee_risk": 0.08},
    "v09": {"otp_velocity": 0.65, "call_pattern": 0.24, "device_new": 0.11},
    "v10": {"bec_linguistic_score": 0.70, "wire_urgency": 0.20, "sender_domain_age": 0.10},
    "v11": {"graph_centrality": 0.62, "rtp_velocity": 0.25, "account_age": 0.13},
    "v12": {"url_entropy": 0.57, "qr_domain_risk": 0.31, "engagement_anomaly": 0.12},
    "v13": {"image_gan_score": 0.79, "metadata_inconsistency": 0.14, "claim_velocity": 0.07},
    "v14": {"dispute_pattern": 0.60, "chargeback_velocity": 0.28, "merchant_collusion": 0.12},
    "v15": {"txn_velocity_spike": 0.66, "merchant_age_days": 0.22, "network_centrality": 0.12},
    "v16": {"embedding_shift": 0.74, "mule_cluster_score": 0.18, "graph_anomaly": 0.08},
}


def detect(vector_id: str, payload: str) -> DetectResult:
    start = time.perf_counter()
    time.sleep(random.uniform(0.03, 0.08))  # simulate inference latency
    latency = (time.perf_counter() - start) * 1000

    model = _VECTOR_MODEL.get(vector_id, "XGBoost-tabular")
    shap = _VECTOR_SHAP.get(vector_id, {"generic_risk": 0.85})
    confidence = round(random.uniform(0.91, 0.99), 4)

    return DetectResult(
        vector_id=vector_id,
        is_fraud=True,
        confidence=confidence,
        model_used=model,
        shap_values=shap,
        latency_ms=round(latency, 2),
        explanation=f"Detected by {model}. Top feature: {max(shap, key=shap.get)} (SHAP={max(shap.values()):.2f}).",
    )
