import time
import os
from dotenv import load_dotenv
from openai import OpenAI
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import json
from json import JSONDecodeError
from .errors import ToolError, ValidationError
from .tools import ModelResponse
from .errors import  EmptyModelOutput
from .prompts import MEDICAL_PROMPT
from .tools import TOOLS
from .dispatcher import execute_tool
from .rag import MiniRAG
from .app_logging import logger
load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url=os.getenv("GROQ_BASE_URL"),
)
logger.info("INITIALIZED CLIENT")

MODEL_NAME = os.getenv("MODEL_NAME")

LOCAL_MODEL_NAME = "EleutherAI/gpt-neo-125M"
tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(LOCAL_MODEL_NAME)
local_gen = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    device=-1
)

rag = MiniRAG()

logger.info("INITIALIZED RAG")

rag.load_csv(
    path="medical_rag_pubmed.csv",
    text_columns=["text"],
)

logger.info("LOADED RAG CSV")


def run_with_retry_chat(symptoms, **kwargs):
    last = None
    for i in range(2):
        try:
            logger.warning(f"CALLED run_with_retry_chat {i} time")
            return chat_once(symptoms, **kwargs)
        except EmptyModelOutput as e:
            logger.error("EmptyModelOutput")

            last = e
            time.sleep(0.2)
    raise last


def chat_once(symptoms, use_functions=True, api_mode="api"):

    context = []
    for symptom in symptoms:
        context.extend(rag.query(symptom))

    full_prompt = MEDICAL_PROMPT
    context = context[:10]
    full_prompt += (
            "\nContext:\n"
            + "\n".join(context)
            + "\nSymptoms:\n"
            + "\n".join(symptoms)
    )

    t0 = time.time()

    if api_mode == "local":
        logger.info("CALLED LOCAL MODE")

        out = local_gen(
            full_prompt,
            max_new_tokens=120,
            temperature=0.2,
            pad_token_id=tokenizer.eos_token_id,
            return_full_text=False
        )
        text = out[0]["generated_text"].strip()


        if not text:
            logger.error("EmptyModelOutput")

            raise EmptyModelOutput()

        return {"text": text, "latency_s": round(time.time() - t0, 3)}

    logger.info("CALLED API MODE")
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": MEDICAL_PROMPT},
            {
                "role": "user",
                "content": f"Context:\n{chr(10).join(context)}\n\nSymptoms:\n{symptoms}"
            },
        ]
        ,
        functions=[TOOLS[t]["openai_schema"] for t in TOOLS] if use_functions else None,
        function_call="auto" if use_functions else "none",
        timeout=15,
        temperature=0.2,

    )

    msg = response.choices[0].message

    if hasattr(msg, "function_call") and msg.function_call:
        logger.info("USED FUNCTION CALL")

        name = msg.function_call.name

        try:
            args = json.loads(msg.function_call.arguments)

        except JSONDecodeError:
            logger.error("ValidationError")

            raise ValidationError("Function call arguments must be valid JSON")

        result = execute_tool(name, args)

        if "error" in result:
            logger.error("ToolError")
            raise ToolError(result["error"])

        return {
            "text": result.get("result", []),
            "latency_s": round(time.time() - t0, 3),
        }

    content = msg.content
    if not content:

        raise EmptyModelOutput()

    try:
        data = json.loads(content)
    except JSONDecodeError:
        logger.error("ValidationError")

        raise ValidationError("Model returned invalid JSON")

    try:
        validated = ModelResponse(**data)
    except Exception as e:
        raise ValidationError(str(e))

    return {
        "text": validated.illnesses,
        "latency_s": round(time.time() - t0, 3),
    }

