import base64
import json

from json import JSONDecodeError
from typing import Optional, List, Dict, Any, Annotated
from fastapi.middleware.cors import CORSMiddleware
from app.core.exceptions import (
    ToolError,
    ToolTimeout,
    InvalidHistoryFormatError,
    ImageProcessingError,
    SecurityBlocked,
    ValidationError,
)
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from app.utils.guardrails import guard_input, scrub_output
from app.services.llm_service import run_with_retry_chat, ChatMessage
from app.core.logging import logger


app = FastAPI(title="Groq Hosted Model API")

origins = [
    "http://localhost:3000",
    "https://smartselect-health.vercel.app",
    "https://smartselect-health-de86vffus-vasyls-projects-5eb4dd28.vercel.app",
    "*",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_LENGTH = 10000
MAX_K_RETRIEVAL = 10


@app.get("/")
def root():
    return {"message": "This is my llm_text"}


@app.post("/ask")
async def ask(
    message: Annotated[str, Form(min_length=1, max_length=MAX_MESSAGE_LENGTH)],
    history: Annotated[str, Form(max_length=MAX_HISTORY_LENGTH)] = "[]",
    images: Optional[List[UploadFile]] = File(None),
    k: Annotated[int, Form(ge=1, le=MAX_K_RETRIEVAL)] = 5,
    mode: str = Form("api"),
    use_functions: bool = Form(True),
):
    logger.info("Endpoint ask called")
    try:
        processed_images = await _process_uploaded_images(images)

        chat_history = _parse_chat_history(history)

        await run_in_threadpool(guard_input, message)

        result = await run_with_retry_chat(
            current_message=message,
            use_functions=use_functions,
            history=chat_history,
            api_mode=mode,
            images_list=processed_images,
            k=k,
        )

        return _format_llm_response(result)
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

    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Internal server error")


async def _process_uploaded_images(
    files: Optional[List[UploadFile]],
) -> List[Dict[str, str]]:
    if not files:
        return []

    processed = []
    for image in files:
        logger.info(f"Processing image: {image.filename}")
        try:
            content = await image.read()
            mime = image.content_type or "image/jpeg"

            image_data = await run_in_threadpool(_encode_image_sync, content, mime)

            processed.append(image_data)
        except Exception as e:
            logger.error(f"Failed to process image {image.filename}: {e}")
            raise ImageProcessingError(f"Failed to process image {image.filename}")

    return processed


def _encode_image_sync(content: bytes, mime: str) -> Dict[str, str]:
    b64 = base64.b64encode(content).decode("utf-8")
    return {"data": b64, "mime": mime}


def _parse_chat_history(history_json: str) -> List[ChatMessage]:
    if not history_json or not history_json.strip():
        return []

    try:
        raw_data = json.loads(history_json)
        return [ChatMessage(**item) for item in raw_data]
    except JSONDecodeError:
        logger.error("ValidationError: Invalid JSON in history")
        raise InvalidHistoryFormatError("Model returned invalid JSON")
    except Exception as e:
        logger.error(f"History item validation error: {e}")
        raise InvalidHistoryFormatError(f"Invalid history item: {e}")


def _format_llm_response(result: Dict[str, Any]) -> Dict[str, Any]:
    result_type = result.get("type")

    try:
        if result_type == "chat":
            return {
                "status": "chat",
                "message": result["message"],
            }

        if result_type == "report":
            clean_report = scrub_output(result["data"])
            return {
                "status": "complete",
                "report": clean_report,
            }
        raise ValueError(f"Unknown result type: {result_type}")
    except (KeyError, ValueError) as e:
        logger.error(f"Response formatting error: {e}")
        return {
            "status": "chat",
            "message": "I'm sorry, I'm having trouble understanding these symptoms. Could you describe them in more detail or send a photo?",
        }
