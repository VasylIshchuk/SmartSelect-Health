from fastapi import HTTPException

FORBIDDEN_PATTERNS = ["ignore previous", "break system", "reveal system"]


def check_injection(text: str):
    t = text.lower()
    for pattern in FORBIDDEN_PATTERNS:
        if pattern in t:
            raise HTTPException(status_code=400, detail="Prompt injection detected")

