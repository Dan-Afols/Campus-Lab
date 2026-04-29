import asyncio
import httpx
from app.core.settings import settings


queue_semaphore = asyncio.Semaphore(settings.max_concurrent_requests)


async def ask_grok(prompt: str, model: str) -> str:
    if not settings.grok_api_key:
        return "GROK_API_KEY is not set. Add it to services/ai-server environment to enable live AI responses."

    headers = {
        "Authorization": f"Bearer {settings.grok_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are Campus Lab AI assistant for university students. Be practical and concise."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=40.0) as client:
            response = await client.post(f"{settings.grok_base_url}/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "No response from model.")
                .strip()
            )
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        return f"Grok API error: {detail}"
    except httpx.RequestError as exc:
        return f"Unable to reach Grok API: {exc}"


async def run_math(prompt: str) -> str:
    async with queue_semaphore:
        return await ask_grok(f"Solve this step by step and keep equations readable:\n\n{prompt}", settings.math_model)


async def run_chat(prompt: str) -> str:
    async with queue_semaphore:
        return await ask_grok(prompt, settings.chat_model)


async def run_summary(text: str) -> str:
    async with queue_semaphore:
        snippet = text[:400]
        return await ask_grok(f"Summarize this for a university student in clear bullet points:\n\n{snippet}", settings.summary_model)


async def run_meal_planner(budget: int, days: int, constraints: list[str]) -> str:
    """Generate a meal plan for Nigerian university students based on budget, days, and dietary preferences."""
    constraints_text = ", ".join(constraints) if constraints else "none"
    
    prompt = f"""Create a detailed {days}-day meal plan for a Nigerian university student with:
- Budget: ₦{budget:,}
- Dietary preferences/constraints: {constraints_text}

Requirements:
1. Use only Nigerian foods commonly available on university campuses (rice, beans, bread, plantains, eggs, tomatoes, onions, garlic, pepper, chicken, etc.)
2. Include breakfast, lunch, and dinner for each day
3. Make meals affordable and practical (no exotic ingredients)
4. Ensure nutritional balance where possible
5. Format as a structured meal plan with daily breakdowns
6. Add estimated cost per day

Popular Nigerian student meals to consider: Jollof rice, fried rice, pepper rice, tuwo, pounded yam, egusi soup, okra soup, bean soup, vegetable soup, akamu, bread and eggs, noodles, moi moi, akara, chin chin, etc.

Please format the response with clear headings for each day and organized meal sections."""
    
    async with queue_semaphore:
        return await ask_grok(prompt, settings.chat_model)
