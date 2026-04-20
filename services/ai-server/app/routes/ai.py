from fastapi import APIRouter
from app.core.settings import settings
from app.models.inference import run_math, run_chat, run_summary
from app.schemas.ai import PromptRequest, SummarizeRequest, AIResponse, SummaryResponse


router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/health")
async def ai_health() -> dict[str, str]:
    return {"status": "ok", "service": "campus-lab-ai"}


@router.post("/math", response_model=AIResponse)
async def math_endpoint(payload: PromptRequest) -> AIResponse:
    answer = await run_math(payload.prompt)
    return AIResponse(model=settings.math_model, answer=answer)


@router.post("/chat", response_model=AIResponse)
async def chat_endpoint(payload: PromptRequest) -> AIResponse:
    answer = await run_chat(payload.prompt)
    return AIResponse(model=settings.chat_model, answer=answer)


@router.post("/summarize", response_model=SummaryResponse)
async def summarize_endpoint(payload: SummarizeRequest) -> SummaryResponse:
    summary = await run_summary(payload.text)
    return SummaryResponse(model=settings.summary_model, summary=summary)
