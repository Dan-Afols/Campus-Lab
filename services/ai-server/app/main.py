from fastapi import FastAPI
from app.routes.ai import router as ai_router


app = FastAPI(title="Campus Lab AI Server", version="0.1.0")
app.include_router(ai_router)
