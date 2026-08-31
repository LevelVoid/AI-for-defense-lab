"""Surface 01: Protocol & Rail (ISO 8583, ISO 20022, Sockets)"""
from fastapi import APIRouter

from app.schemas.attack import VectorInfo, GenerateRequest, GenerateResponse, DetectRequest, DetectResult, Surface
from app.services import red_team, blue_team

router = APIRouter(prefix="/protocol", tags=["Surface 01: Protocol & Rail"])

VECTORS: list[VectorInfo] = [
    VectorInfo(id="v01", name="ISO 20022 Indirect Prompt Injection", target="<RmtInf><Ustrd>", surface=Surface.protocol, description="Inject adversarial NLP instructions into ISO 20022 payment message fields to manipulate downstream LLM-based compliance checks."),
    VectorInfo(id="v02", name="ISO 8583 RL Socket Fuzzing", target="DE 4, DE 22", surface=Surface.protocol, description="Use RL-guided fuzzing to craft malformed ISO 8583 authorization requests that bypass gateway validation logic."),
    VectorInfo(id="v03", name="ISO 8583 Ghost Logging", target="MTI 0100 Socket Layer", surface=Surface.protocol, description="Suppress transaction log entries at the socket layer, creating ghost transactions invisible to fraud monitoring."),
    VectorInfo(id="v04", name="Cross-Merchant IDOR Void", target="MTI 0400 / DE 37 RRN", surface=Surface.protocol, description="Exploit insecure direct object references in void/reversal flows to cancel transactions across merchant boundaries."),
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
