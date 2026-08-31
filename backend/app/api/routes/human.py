"""Surface 03: Human & Social (Vishing, BEC, Swarms)"""
from fastapi import APIRouter

from app.schemas.attack import VectorInfo, GenerateRequest, GenerateResponse, DetectRequest, DetectResult, Surface
from app.services import red_team, blue_team

router = APIRouter(prefix="/human", tags=["Surface 03: Human & Social"])

VECTORS: list[VectorInfo] = [
    VectorInfo(id="v09", name="Real-Time Vishing / OTP Bot", target="SMS OTP / 3DS", surface=Surface.human, description="Autonomous voice agent conducts real-time social engineering calls to harvest OTPs and bypass 3DS authentication."),
    VectorInfo(id="v10", name="Autonomous Corporate BEC", target="ISO 20022 Invoices", surface=Surface.human, description="LLM-generated business email compromise attacks targeting CFO/AP workflows with spoofed ISO 20022 wire instructions."),
    VectorInfo(id="v11", name="APP Romance/Investment Swarm", target="Real-Time Payments", surface=Surface.human, description="Coordinated swarm of AI personas executing authorized push payment fraud across multiple real-time payment rails simultaneously."),
    VectorInfo(id="v12", name="Social Support Quishing", target="Public Threads", surface=Surface.human, description="Deploy AI-generated phishing QR codes through fake customer support accounts on public social platforms."),
]


@router.get("/vectors", response_model=list[VectorInfo])
def list_vectors():
    return VECTORS


@router.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    return red_team.generate_payload(req.vector_id, req.params)


@router.post("/detect", response_model=DetectResult)
def detect(req: DetectRequest):
    return blue_team.detect(req.vector_id, req.payload)
