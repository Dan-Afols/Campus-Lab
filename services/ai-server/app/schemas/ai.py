from pydantic import BaseModel, Field


class PromptRequest(BaseModel):
    prompt: str = Field(min_length=1)


class SummarizeRequest(BaseModel):
    text: str = Field(min_length=1)


class MealPlannerRequest(BaseModel):
    budget: int = Field(gt=0, le=100000)
    days: int = Field(ge=1, le=30, default=7)
    constraints: list[str] = Field(default_factory=list)


class AIResponse(BaseModel):
    model: str
    answer: str


class SummaryResponse(BaseModel):
    model: str
    summary: str


class MealPlanResponse(BaseModel):
    model: str
    meal_plan: str
