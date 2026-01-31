import os
from dotenv import load_dotenv

load_dotenv()

HUGGING_FACE_MODEL = os.getenv("HUGGING_FACE_MODEL", "Qwen/Qwen3-4B-Instruct-2507")



HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")