
from .errors import ToolError, ToolTimeout, EmptyModelOutput
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .guardrails import guard_input,scrub_output, is_greeting
from .app_logging import logger
from .llm_runner import run_with_retry_chat
from langdetect import detect
from .errors import (
    SecurityBlocked,
    ValidationError,
)
app = FastAPI(title="Groq Hosted Model API")



class AskRequest(BaseModel):
    symptoms: str
    k: int = 3
    mode: str = "api"
    use_functions: bool = False

@app.get("/")
def root():
    return ({"message": "This is my llm_text"})

@app.post("/ask")
def ask(request: AskRequest):
    start_time = datetime.now()

    try:
        safe_input = guard_input(request.symptoms)

        try:
            lang = detect(safe_input)
        except Exception:
            lang = "unknown"

        use_functions = lang == "en"

        if is_greeting(safe_input):
            result = run_with_retry_chat(
                safe_input,
                use_functions=False,
                mode="greeting",
                api_mode=request.mode,
            )
            return {
                "message": result["text"].strip(),
                "latency_s": result["latency_s"]
            }

        result = run_with_retry_chat(
            safe_input,
            use_functions=use_functions,
            mode="medical",
            api_mode=request.mode,
        )

        try:
            illnesses = scrub_output(result["text"])
            if len(illnesses) == 3:
                return {
                    "illnesses": illnesses,
                    "latency_s": result["latency_s"]
                }
            else:
                return {
                    "message": "Nie mogę znaleźć dokładnie 3 chorób. Spróbuj jeszcze raz.",
                    "latency_s": result["latency_s"]
                }
        except ValueError:
            return {
                "message": "Nie mogę znaleźć chorób na podstawie podanych objawów. Spróbuj jeszcze raz.",
                "latency_s": result["latency_s"]
            }

    except SecurityBlocked as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.detail)
    except ToolTimeout as e:
        raise HTTPException(status_code=504, detail=e.detail)
    except ToolError as e:
        raise HTTPException(status_code=502, detail=e.detail)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
