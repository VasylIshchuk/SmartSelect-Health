import os
import json
import asyncio
from json_repair import repair_json

from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from groq import Groq
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from json import JSONDecodeError
from app.core.exceptions import ToolError, ValidationError, EmptyModelOutput
from app.domain.prompts import LOCAL_MEDICAL_PROMPT, API_MEDICAL_PROMPT
from app.utils.tools import TOOLS, execute_tool
from .rag_service import get_rag_service
from app.core.logging import logger
from app.core.config import settings
from app.domain.models import ChatMessage


MAX_CONTEXT_TOKENS = 2000
CHARS_PER_TOKEN = 4
MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN


load_dotenv()


_groq_client = None
_local_generator = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        _groq_client = Groq(api_key=api_key)
        logger.info("[INFO] INITIALIZED GROQ CLIENT")
    return _groq_client


def _get_local_generator():
    global _local_generator
    if _local_generator is None:
        logger.info(f"[INFO] Loading local model {settings.LOCAL_MODEL_NAME}...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(settings.LOCAL_MODEL_NAME)
            model = AutoModelForCausalLM.from_pretrained(settings.LOCAL_MODEL_NAME)
            _local_generator = pipeline(
                "text-generation", model=model, tokenizer=tokenizer, device=-1
            )
            logger.info("[INFO] Local model loaded.")
        except Exception as e:
            logger.error(f"[ERROR] Failed to load local model: {e}")
            raise e
    return _local_generator


async def run_with_retry_chat(current_message: str, **kwargs):
    last_exception = None
    for i in range(2):
        try:
            logger.warning(f"[WARN] CALLED run_with_retry_chat {i + 1} time")
            return await chat_once(current_message, **kwargs)
        except EmptyModelOutput as e:
            logger.error("EmptyModelOutput detected")
            last_exception = e
            await asyncio.sleep(0.2)

    if last_exception:
        raise last_exception


async def chat_once(
    current_message,
    history: List[ChatMessage],
    images_list: List[Dict[str, str]] = None,
    use_functions=True,
    api_mode="api",
    k: int = 5,
):
    rag_text = _get_rag_context(current_message, k)

    if api_mode == "local":
        return _run_local_mode(current_message, rag_text)

    logger.info("[INFO] CALLED API MODE")
    client = _get_groq_client()

    messages = _build_api_messages(history, current_message, rag_text, images_list)

    MAX_TURNS = 3
    current_turn = 0

    while current_turn < MAX_TURNS:
        current_turn += 1

        tools_payload = _build_tools_payload(use_functions)
        tool_choice_strategy = None
        if tools_payload:
            has_response_tool = any(
                tool["function"]["name"] == "provide_response" for tool in tools_payload
            )

            if has_response_tool:
                tool_choice_strategy = {
                    "type": "function",
                    "function": {"name": "provide_response"},
                }
            else:
                tool_choice_strategy = "auto"

        try:
            response = client.chat.completions.create(
                model=settings.MODEL_NAME,
                messages=messages,
                tools=tools_payload,
                tool_choice=tool_choice_strategy,
                timeout=30,
                temperature=0.3,
            )
        except Exception as e:
            logger.error(f"[ERROR] API Error: {e}")
            raise ToolError(f"Provider Error: {e}")

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        if not tool_calls:
            logger.warning("[WARN] Model didn't use tool, falling back to text content")
            return {
                "type": "chat",
                "message": response_message.content
                or "I couldn't generate a structured response.",
            }

        logger.info(f"[INFO] MODEL REQUESTED {len(tool_calls)} TOOL(S)")

        messages.append(response_message.model_dump())

        for tool_call in tool_calls:
            execution_result = await _execute_tool_call(tool_call, messages)

            if execution_result.get("is_final"):
                return _handle_special_tool_response(
                    "provide_response",
                    execution_result["args"],
                )


def _get_rag_context(message: str, k: int) -> str:
    if not message:
        return ""

    logger.info("[INFO] CALLED RAG QUERY")

    try:
        rag_service = get_rag_service()
        context_docs = rag_service.query(message, k=k * 2)
    except Exception as e:
        logger.error(f"[EROOR] RAG Error (continuing without context): {e}")
        return ""

    rag_text_parts = []
    current_char_count = 0

    for doc in context_docs:
        formatted_chunk = (
            f"--- DOCUMENT ID: {doc['original_id']} ---\n"
            f"SOURCE: {doc['source']}\n"
            f"CONTENT:\n{doc['text']}\n"
        )

        chunk_len = len(formatted_chunk)

        if current_char_count + chunk_len > MAX_CONTEXT_CHARS:
            logger.warning(
                f"[WARN] Context limit reached! Stopping at {len(rag_text_parts)} docs "
                f"({current_char_count} chars). Ignored remaining candidates."
            )
            break

        rag_text_parts.append(formatted_chunk)
        current_char_count += chunk_len

    return "\n\n".join(rag_text_parts)


def _run_local_mode(current_message: str, rag_text: str) -> Dict[str, Any]:
    logger.info("CALLED LOCAL MODE")

    generator = _get_local_generator()
    tokenizer = generator.tokenizer

    full_prompt = LOCAL_MEDICAL_PROMPT.format(
        rag_text=rag_text, current_message=current_message
    )

    try:
        out = generator(
            full_prompt,
            max_new_tokens=120,
            temperature=0.3,
            pad_token_id=tokenizer.eos_token_id,
            return_full_text=False,
            do_sample=True,
        )

        text = out[0]["generated_text"].strip()
    except Exception as e:
        logger.error(f"[ERROR] Local Model Error: {e}")
        text = "I apologize, I am unable to process this request locally."

    if not text:
        logger.error("[ERROR] EmptyModelOutput")
        raise EmptyModelOutput("EmptyModelOutput detected")

    return {
        "type": "chat",
        "message": text,
    }


def _build_api_messages(
    history: List[ChatMessage],
    current_message: str,
    rag_text: str,
    images_list: List[Dict[str, str]],
) -> List[Dict[str, Any]]:
    messages = [{"role": "system", "content": API_MEDICAL_PROMPT}]

    for msg in history:
        messages.append({"role": msg.role, "content": str(msg.content)})

    text_payload = (
        f"RAG Context:\n{rag_text}\n\nPatient Description:\n{current_message}"
    )

    if images_list:
        logger.info("ATTACHING IMAGES TO LLM REQUEST")

        user_content = [{"type": "text", "text": text_payload}]
        for img in images_list:
            user_content.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{img['mime']};base64,{img['data']}",
                        "detail": "auto",
                    },
                }
            )

        messages.append({"role": "user", "content": user_content})
    else:
        messages.append({"role": "user", "content": text_payload})

    return messages


def _build_tools_payload(use_functions: bool) -> Optional[List[dict]]:
    active_tools = []
    for name, tool_config in TOOLS.items():
        if name == "provide_response":
            active_tools.append(tool_config["tool_definition"])
        elif use_functions:
            active_tools.append(tool_config["tool_definition"])

    return active_tools if active_tools else None


async def _execute_tool_call(
    tool_call, messages: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    fn_name = tool_call.function.name
    fn_args_json = tool_call.function.arguments
    call_id = tool_call.id

    logger.info(f"[INFO] EXECUTING TOOL: {fn_name}")

    try:
        args = repair_json(fn_args_json, return_objects=True)
    except JSONDecodeError:
        logger.error(f"[ERROR] ValidationError: Invalid JSON args for {fn_name}")
        raise ValidationError("Function call arguments must be valid JSON")

    if fn_name == "provide_response":
        return {"is_final": True, "args": args}

    tool_result = await execute_tool(fn_name, args)

    if "error" in tool_result:
        logger.error(f"[ERROR] ToolError in {fn_name}")
        raise ToolError(tool_result["error"])

    messages.append(
        {
            "role": "tool",
            "tool_call_id": call_id,
            "name": fn_name,
            "content": json.dumps(tool_result),
        }
    )

    logger.info("TOOL EXECUTED. FEEDING RESULT BACK TO LLM...")
    return {"is_final": False}


def _handle_special_tool_response(fn_name: str, args: dict) -> Optional[Dict[str, Any]]:
    if fn_name != "provide_response":
        return None

    if args.get("action") == "message":
        return {
            "type": "chat",
            "message": args.get("message_to_patient"),
        }
    elif args.get("action") == "final_report":
        return {
            "type": "report",
            "data": args.get("report_data"),
        }
    return None
