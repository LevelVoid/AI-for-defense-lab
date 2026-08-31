"""Surface 02: Endpoint & Auth (Gateways, 3DS ACS, Biometrics)"""
from fastapi import APIRouter

from app.schemas.attack import VectorInfo, GenerateRequest, GenerateResponse, DetectRequest, DetectResult, Surface
from app.services import red_team, blue_team

router = APIRouter(prefix="/endpoint", tags=["Surface 02: Endpoint & Auth"])

VECTORS: list[VectorInfo] = [
    VectorInfo(id="v05", name="Synthetic Device Telemetry", target="Canvas/WebGL/IP", surface=Surface.endpoint, description="Generate adversarial but statistically authentic browser fingerprints to bypass device-based fraud scoring."),
    VectorInfo(id="v06", name="Behavioral Micro-Mimicry", target="Biometric Cadence", surface=Surface.endpoint, description="Train a generative model on keystroke and mouse dynamics to produce human-indistinguishable synthetic biometric sessions."),
    VectorInfo(id="v07", name="Deepfake Camera Injection", target="Mobile OS Camera API", surface=Surface.endpoint, description="Inject photorealistic deepfake video frames into the mobile camera API to defeat liveness detection in 3DS flows."),
    VectorInfo(id="v08", name="AP2 Agent DOM Hijack", target="Shopping Agent Prompt", surface=Surface.endpoint, description="Craft hidden DOM instructions that hijack AI shopping agent actions to add payees or modify transaction amounts."),
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
