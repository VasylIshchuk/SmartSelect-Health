import concurrent.futures
from .tools import TOOLS


def execute_tool(name, arguments, timeout=3):
    if name not in TOOLS:
        return {"error": "tool_not_allowed"}
    schema = TOOLS[name]["args_schema"]
    try:
        validated = schema(**arguments)
    except Exception as e:
        return {"error": "validation_error", "details": str(e)}

    impl = TOOLS[name]["implementation"]
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(lambda: impl(**validated.dict()))
        try:
            result = future.result(timeout=timeout)
            return {"ok": True, "result": result}
        except concurrent.futures.TimeoutError:
            return {"error": "timeout"}
        except Exception as e:
            return {"error": "tool_failed", "details": str(e)}
