from typing import Any
from pydantic import BaseModel


class EpochResult(BaseModel):
    epoch: int
    evasion_rate: float
    detection_rate: float
    false_positive_rate: float
    auc: float
    new_samples: int


class RetrainEvent(BaseModel):
    epoch: int
    trigger: str  # "evasion_spike", "scheduled", "manual"
    samples_added: int
    auc_before: float
    auc_after: float


class CoEvolutionEvent(BaseModel):
    event_type: str  # "payload_generated", "evasion", "detection", "retrain", "epoch_complete"
    epoch: int
    data: dict[str, Any] = {}
