"""Defender Dashboard — single and batch generate + detect endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel

from app.schemas.attack import DetectResult
from app.services import blue_team, red_team

router = APIRouter(prefix="/defender", tags=["Defender"])

_ALL_VECTORS = [f"v{i:02d}" for i in range(1, 17)]


class AnalyzeRequest(BaseModel):
    vector_id: str


class AnalyzeResponse(BaseModel):
    vector_id: str
    payload: str
    payload_format: str
    result: DetectResult


class BatchAnalyzeResponse(BaseModel):
    total: int
    detected: int
    evasion_rate: float
    avg_confidence: float
    avg_latency_ms: float
    aggregate_shap: dict[str, float]
    results: list[dict]


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    gen = red_team.generate_payload(req.vector_id, {})
    result = blue_team.detect(req.vector_id, gen.payload)
    return AnalyzeResponse(
        vector_id=req.vector_id,
        payload=gen.payload,
        payload_format=gen.payload_format,
        result=result,
    )


@router.post("/analyze_batch", response_model=BatchAnalyzeResponse)
def analyze_batch() -> BatchAnalyzeResponse:
    results = []
    all_shap: dict[str, float] = {}

    for vid in _ALL_VECTORS:
        gen = red_team.generate_payload(vid, {})
        det = blue_team.detect(vid, gen.payload)
        results.append({
            "vector_id": vid,
            "payload_format": gen.payload_format,
            "is_fraud": det.is_fraud,
            "confidence": det.confidence,
            "model_used": det.model_used,
            "shap_values": det.shap_values,
            "latency_ms": det.latency_ms,
            "explanation": det.explanation,
        })
        for feat, val in det.shap_values.items():
            all_shap[feat] = round(all_shap.get(feat, 0.0) + val, 4)

    detected = sum(1 for r in results if r["is_fraud"])
    avg_conf = sum(r["confidence"] for r in results) / len(results)
    avg_lat = sum(r["latency_ms"] for r in results) / len(results)

    return BatchAnalyzeResponse(
        total=len(results),
        detected=detected,
        evasion_rate=round((len(results) - detected) / len(results), 4),
        avg_confidence=round(avg_conf, 4),
        avg_latency_ms=round(avg_lat, 2),
        aggregate_shap=all_shap,
        results=results,
    )
