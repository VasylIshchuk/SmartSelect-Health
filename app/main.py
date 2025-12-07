import os
import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .guardrails import check_injection
from openai import OpenAI

load_dotenv()

# --- CONFIG ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL")
MODEL_NAME = os.getenv("MODEL_NAME")

client = OpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)

app = FastAPI(title="Groq Hosted Model API")


# --- REQUEST SCHEMA ---
class AskRequest(BaseModel):
    symptoms: str
    k: int = 3
    mode: str = "api"  # "api" | "local"
    use_functions: bool = False


# --- CHAT FUNCTION ---
def chat_once(prompt: str,
              system: str = "You are a medical assistant, get 3 possible illnesses based on symptoms, pattern: illness,illness,illness"):
    t0 = time.time()
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        max_tokens=512,
        temperature=0.7
    )
    dt = time.time() - t0
    choice = response.choices[0]
    return {
        "text": choice.message.content,
        "finish_reason": choice.finish_reason,
        "latency_s": round(dt, 3),
        "usage": getattr(response, "usage", None) and response.usage.model_dump()
    }


# --- ENDPOINTS ---
@app.get("/")
def root():
    return {"message": "Groq Hosted Model API is running"}


@app.post("/ask")
def ask(request: AskRequest):
    # Guardrails
    check_injection(request.symptoms)

    # Mode validation
    if request.mode not in ["api", "local"]:
        raise HTTPException(status_code=400, detail="Invalid mode, choose 'api' or 'local'")

    # Call model (here only API)
    result = chat_once(request.symptoms)
    return {
        "response": result.get("text"),
        "latency_s": result.get("latency_s")
    }
