from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TargetPlatform(StrEnum):
    general = "general"
    xiaohongshu = "xiaohongshu"
    douyin = "douyin"
    wechat = "wechat"
    campus = "campus"
    ecommerce = "ecommerce"


class Objective(StrEnum):
    interest = "interest"
    trust = "trust"
    conversion = "conversion"
    clarity = "clarity"
    engagement = "engagement"


class Intensity(StrEnum):
    safe = "safe"
    balanced = "balanced"
    bold = "bold"


class TrialRequest(StrictModel):
    original_text: str = Field(min_length=20, max_length=3000)
    target_platform: TargetPlatform
    audience: str | None = Field(default=None, max_length=160)
    objective: Objective
    intensity: Intensity


class CaseSummary(StrictModel):
    content_type: str
    main_intent: str
    target_reader: str


class ProsecutionCharge(StrictModel):
    charge: str
    evidence: str
    severity: int = Field(ge=1, le=5)


class DefensePoint(StrictModel):
    strength: str
    reason: str


JuryRole = Literal["普通用户", "平台运营", "AI味检测官", "挑剔用户", "品牌/组织方"]


class JuryFeedback(StrictModel):
    role: JuryRole
    reaction: str
    suggestion: str


class Verdict(StrictModel):
    main_problem: str
    rewrite_strategy: str


class RewrittenCopy(StrictModel):
    title: str
    body: str
    cta: str


class ScoreSet(StrictModel):
    clarity: int = Field(ge=1, le=10)
    appeal: int = Field(ge=1, le=10)
    authenticity: int = Field(ge=1, le=10)
    platform_fit: int = Field(ge=1, le=10)
    risk_control: int = Field(ge=1, le=10)


class ReviewScoreComparison(StrictModel):
    original: ScoreSet
    revised: ScoreSet


class TrialResponse(StrictModel):
    case_summary: CaseSummary
    prosecution: list[ProsecutionCharge]
    defense: list[DefensePoint]
    jury: list[JuryFeedback] = Field(min_length=5, max_length=5)
    verdict: Verdict
    rewritten_copy: RewrittenCopy
    review_scores: ReviewScoreComparison


class HealthResponse(StrictModel):
    status: Literal["ok"]
    service: Literal["copycourt-app"]


class ErrorDetail(StrictModel):
    code: str
    message: str


class ErrorResponse(StrictModel):
    error: ErrorDetail
