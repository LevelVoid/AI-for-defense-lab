"""Surface 04: Post-Purchase & Dispute (Refund Abuse, Bust-Outs)"""
from fastapi import APIRouter

from app.schemas.attack import VectorInfo, GenerateRequest, GenerateResponse, DetectRequest, DetectResult, Surface
from app.services import red_team, blue_team

router = APIRouter(prefix="/post-purchase", tags=["Surface 04: Post-Purchase & Dispute"])

VECTORS: list[VectorInfo] = [
    VectorInfo(id="v13", name="Photorealistic Damage Gen", target="Merchant Refund Portal", surface=Surface.post_purchase, description="Generate photorealistic product damage images using fine-tuned diffusion models to support fraudulent refund claims."),
    VectorInfo(id="v14", name="Autonomous Dispute Arbitrage", target="Acquirer Dispute System", surface=Surface.post_purchase, description="AI agent autonomously files, escalates, and withdraws chargebacks to exploit timing windows in acquirer dispute workflows."),
    VectorInfo(id="v15", name="Synthetic Merchant Bust-Out", target="Acquirer Accounts", surface=Surface.post_purchase, description="CTGAN-generated merchant transaction histories establish credibility before a coordinated bust-out event."),
    VectorInfo(id="v16", name="GNN Graph Mule Poisoning", target="Network Graph Embeddings", surface=Surface.post_purchase, description="Adversarially modify money mule account graph topology to poison GraphSAGE embeddings and evade network-based detection."),
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
