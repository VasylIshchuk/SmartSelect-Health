import os
from pydantic_settings import BaseSettings


BASE_DIR: str = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

DATA_DIR: str = os.path.join(BASE_DIR, "data", )
KNOWLEDGE_BASE_DIR: str = os.path.join(DATA_DIR, "knowledge_base")

os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True)

class Settings(BaseSettings):
    GROQ_API_KEY: str

    MODEL_NAME: str = "mixtral-8x7b-32768"
    LOCAL_MODEL_NAME: str = "EleutherAI/gpt-neo-125M"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

    RAG_DATA_PATH: str = os.path.join(KNOWLEDGE_BASE_DIR, "medlineplus.csv")
    RAG_INDEX_PATH: str = os.path.join(KNOWLEDGE_BASE_DIR, "medline.index")
    RAG_METADATA_PATH: str = os.path.join(KNOWLEDGE_BASE_DIR, "medline_meta.pkl")
    DISEASES_DATA_PATH: str = os.path.join(KNOWLEDGE_BASE_DIR, "diseases.csv")
    LOG_PATH: str = os.path.join(DATA_DIR, "api.log")
    RAPORT_FILE_PATH: str = os.path.join(DATA_DIR, "report.md")

    class Config:
        env_file = ".env"


settings = Settings()
