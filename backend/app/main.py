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


tags_metadata = [
    {
        "name": "Diagnosis",
        "description": "Core endpoints for AI medical analysis and RAG.",
    },
    {
        "name": "Health",
        "description": "System status checks.",
    },
]

app = FastAPI(
    title="SmartSelect Health Backend",
    description="""
    SmartSelect Health API allows for preliminary medical diagnosis. 🏥

    Key Features
        * RAG: Retrieves context from the MedlinePlus knowledge base.
        * Vision: Analyzes patient-uploaded images for visual symptoms.
        * Hybrid Engine: Switches between Groq (Cloud) and Local LLMs.
    """,
    openapi_tags=tags_metadata,
)


origins = [
    "http://localhost:3000",
    "https://smartselect-health.vercel.app",
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


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "SmartSelect Health API is running!",
        "status": "online",
        "docs_url": "/docs"
    }

@app.post(
    "/ask",
    summary="Submit patient symptoms",
    tags=["Diagnosis"],
    response_description="Returns a chat response or a final medical report.",
)
async def ask(
    message: Annotated[
        str,
        Form(
            min_length=1,
            max_length=MAX_MESSAGE_LENGTH,
            description="The user's current symptom description.",
        ),
    ],
    history: Annotated[
        str,
        Form(
            max_length=MAX_HISTORY_LENGTH,
            description="Previous chat history as a JSON string (list of messages).",
        ),
    ] = "[]",
    images: Optional[List[UploadFile]] = File(
        None,
        description="Optional list of image files (e.g., photos of visible symptoms) for visual analysis.",
    ),
    k: Annotated[
        int,
        Form(
            ge=1,
            le=MAX_K_RETRIEVAL,
            description="Number of medical documents to retrieve from the RAG Knowledge Base.",
        ),
    ] = 5,
    mode: str = Form(
        "api",
        description="Inference mode: 'api' (Groq Cloud - High Perf) or 'local' (Offline - Fallback).",
    ),
    use_functions: bool = Form(
        True,
        description="Enable/Disable tool use (Function Calling). If False, model will just chat.",
    ),
):
    """
    **Main interaction endpoint.**

    This endpoint processes text and images to generate a medical response.

    - **Logic**: It first checks the RAG index, then uses the LLM to decide whether to ask a follow-up question or provide a final report.
    - **Security**: Inputs are scanned for injection attacks.
    """

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
