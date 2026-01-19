
from .errors import ToolError, ToolTimeout
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .guardrails import guard_input,scrub_output
from .llm_runner import run_with_retry_chat
from .errors import (
    SecurityBlocked,
    ValidationError,
)
from .app_logging import logger
app = FastAPI(title="Groq Hosted Model API")



class AskRequest(BaseModel):
    symptoms: list[str]
    k: int = 3
    mode: str = "api"
    use_functions: bool = False

@app.get("/")
def root():
    return ({"message": "This is my llm_text"})

@app.post("/ask")
def ask(request: AskRequest):
    logger.info("Endpoint ask called")
    try:
        safe_input = guard_input(request.symptoms)

        result = run_with_retry_chat(
            safe_input,
            use_functions=request.use_functions,
            api_mode=request.mode,
        )
        try:
            output = scrub_output(result["text"])
            return {
                "illnesses": output,
                "latency_s": result["latency_s"]
            }

        except ValueError:
            logger.error("ValueError")

            return {
                "message": "Sorry, can't find any illnesses with those symptoms. Please, try again.",
                "latency_s": result["latency_s"]
            }

    except SecurityBlocked as e:
        logger.error("HTTPException")

        raise HTTPException(status_code=400, detail=e.detail)
    except ValidationError as e:
        logger.error("ValidationError")

        raise HTTPException(status_code=422, detail=e.detail)
    except ToolTimeout as e:
        logger.error("ToolTimeout")

        raise HTTPException(status_code=504, detail=e.detail)
    except ToolError as e:
        logger.error("ToolError")

        raise HTTPException(status_code=502, detail=e.detail)
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(e)

        raise HTTPException(status_code=500, detail="Internal server error")
