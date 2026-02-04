import concurrent.futures
import asyncio

from typing import Type, Dict, Any
from pydantic import BaseModel, ValidationError
from app.core.logging import logger
from app.domain.models import ResponseArgs


async def execute_tool(name: str, arguments: dict, timeout: int = 3):
    if name not in TOOLS:
        return {"error": "tool_not_allowed"}

    tool = TOOLS[name]

    try:
        validated = tool["args_schema"](**arguments)
    except Exception as e:
        return {"error": "validation_error", "details": str(e)}

    impl = tool["implementation"]

    with concurrent.futures.ThreadPoolExecutor() as executor:
        executor.submit(lambda: impl(**validated.dict()))
        try:
            result = await asyncio.to_thread(impl, **validated.dict())
            return {"ok": True, "result": result}
        except concurrent.futures.TimeoutError:
            return {"error": "timeout"}
        except Exception as e:
            return {"error": "tool_failed", "details": str(e)}


def provide_response_implementation(**kwargs) -> Dict[str, Any]:
    try:
        response_obj = ResponseArgs(**kwargs)

        if response_obj.action == "final_report" and not response_obj.report_data:
            logger.error(
                "[ERROR] Action is 'final_report' but 'report_data' is missing."
            )
            raise ValidationError(
                "Action is 'final_report' but 'report_data' is missing."
            )

        if response_obj.action == "message" and not response_obj.message_to_patient:
            logger.error(
                "[ERROR] Action is 'message' but 'message_to_patient' is missing."
            )
            raise ValidationError(
                "Action is 'message' but 'message_to_patient' is missing."
            )

        return response_obj.model_dump(exclude_none=True)
    except Exception as e:
        logger.error(
            f"[ERROR] Response Validation Failed (provide_response_implementation): {str(e)}"
        )
        return {
            "error": f"Response Validation Failed (provide_response_implementation): {str(e)}"
        }


def generate_openai_tool_definition(
    tool_class: Type[BaseModel], name: str, description: str
):
    schema = tool_class.model_json_schema()

    parameters = {
        "type": "object",
        "properties": schema.get("properties", {}),
        "required": schema.get("required", []),
    }

    if "$defs" in schema:
        parameters["$defs"] = schema["$defs"]

    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": parameters,
        },
    }


TOOLS = {
    "provide_response": {
        "tool_definition": generate_openai_tool_definition(
            ResponseArgs,
            name="provide_response",
            description="ALWAYS use this tool to communicate the final answer or ask questions to the user.",
        ),
        "args_schema": ResponseArgs,
        "implementation": provide_response_implementation,
    },
}
