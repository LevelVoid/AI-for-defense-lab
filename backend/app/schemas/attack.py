from enum import Enum
from typing import Any
from pydantic import BaseModel


class Surface(str, Enum):
    protocol = "protocol"
    endpoint = "endpoint"
    human = "human"
    post_purchase = "post_purchase"


class VectorInfo(BaseModel):
    id: str
    name: str
    target: str
    surface: Surface
    description: str


class GenerateRequest(BaseModel):
    vector_id: str
    params: dict[str, Any] = {}


class GenerateResponse(BaseModel):
    vector_id: str
    surface: Surface
    payload: str
    payload_format: str  # "iso8583_hex", "iso20022_xml", "json", "text"
    metadata: dict[str, Any] = {}


class DetectRequest(BaseModel):
    vector_id: str
    payload: str
    payload_format: str = "json"


class DetectResult(BaseModel):
    vector_id: str
    is_fraud: bool
    confidence: float
    model_used: str
    shap_values: dict[str, float] = {}
    latency_ms: float
    explanation: str
