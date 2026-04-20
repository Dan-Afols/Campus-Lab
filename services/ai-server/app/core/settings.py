import os
from pydantic import BaseModel
from dotenv import load_dotenv


load_dotenv()


class Settings(BaseModel):
    max_concurrent_requests: int = int(os.getenv("AI_MAX_CONCURRENT_REQUESTS", "5"))
    math_model: str = os.getenv("AI_MATH_MODEL", "grok-2-latest")
    chat_model: str = os.getenv("AI_CHAT_MODEL", "grok-2-latest")
    summary_model: str = os.getenv("AI_SUMMARY_MODEL", "grok-2-latest")
    grok_api_key: str = os.getenv("GROK_API_KEY", "")
    grok_base_url: str = os.getenv("GROK_BASE_URL", "https://api.x.ai/v1")


settings = Settings()
