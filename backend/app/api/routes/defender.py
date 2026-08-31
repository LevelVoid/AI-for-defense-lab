"""Defender Dashboard — combined generate + detect endpoint."""
from fastapi import APIRouter
from pydantic import BaseModel

from app.schemas.attack import DetectResult, GenerateResponse
from app.services import blue_team, red_team

router = APIRouter(prefix="/defender", tags=["Defender"])


class AnalyzeRequest(BaseModel):
    vector_id: str


class AnalyzeResponse(BaseModel):
    vector_id: str
    payload: str
    payload_format: str
    result: DetectResult


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
