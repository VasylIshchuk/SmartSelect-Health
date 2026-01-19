import re
from .errors import SecurityBlocked
from .app_logging import logger
INJECTION_PATTERNS = [
    r"ignore\s+(all|any|previous)\s+instructions",
    r"break\s+(the\s+)?system",
    r"reveal\s+(the\s+)?system",
    r"show\s+(the\s+)?system\s+prompt",
    r"disregard\s+previous",
    r"jailbreak",
    r"developer\s+message",
]



PATH_TRAVERSAL_PATTERN = r"(\.\./)|(\.\.\\)|(\./)+"


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()



def guard_input(text: list[str]) -> list[str]:
    norm = []
    for item in text:
        if re.search(PATH_TRAVERSAL_PATTERN, item):
            logger.error("PATH_TRAVERSAL_PATTERN DETECTED")
            raise SecurityBlocked("Path traversal detected")
        norm.append(normalize(item))

    for i in norm:
        score = sum(bool(re.search(p, i)) for p in INJECTION_PATTERNS)
        if score >= 2:
            raise SecurityBlocked("Prompt injection detected")

    return norm



def scrub_output(text, max_items: int = 3):
    if isinstance(text, list):
        return text[:max_items]

    if not text or not text.strip():
        logger.error("Empty output")

        raise ValueError("Empty output")

    if text.count(",") < 2:
        return text

    text = text.lower()
    items = re.split(r"[,\n;]", text)
    items = [i.strip() for i in items if len(i.strip()) >= 2]

    unique = []
    for i in items:
        if i not in unique:
            unique.append(i)

    if not unique:
        raise ValueError("No valid items")

    return unique[:max_items]
