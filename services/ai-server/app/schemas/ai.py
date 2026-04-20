from pydantic import BaseModel, Field


class PromptRequest(BaseModel):
    prompt: str = Field(min_length=1)


class SummarizeRequest(BaseModel):
    text: str = Field(min_length=1)


class AIResponse(BaseModel):
    model: str
    answer: str


class SummaryResponse(BaseModel):
    model: str
    summary: str
