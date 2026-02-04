import os
import pickle
import faiss

from sentence_transformers import SentenceTransformer
from app.core.logging import logger
from app.core.config import settings


_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"[INFO] Loading Embedding Model ({settings.EMBEDDING_MODEL_NAME})...")
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
    return _embedding_model


_rag_instance = None


def get_rag_service():
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAG()
        try:
            _rag_instance.load_index()
        except Exception as e:
            logger.error(f"[ERROR] Failed to load RAG index: {e}.")
    return _rag_instance


class RAG:
    def __init__(self):
        self.model = get_embedding_model()
        self.index = None
        self.docs = []

    def load_index(self):
        if not os.path.exists(settings.RAG_INDEX_PATH) or not os.path.exists(
            settings.RAG_METADATA_PATH
        ):
            raise FileNotFoundError("RAG files missing. Run ETL script.")

        logger.info(f"[INFO] Loading FAISS index from {settings.RAG_INDEX_PATH}...")
        self.index = faiss.read_index(str(settings.RAG_INDEX_PATH))

        logger.info(f"[INFO] Loading metadata from {settings.RAG_METADATA_PATH}...")
        with open(settings.RAG_METADATA_PATH, "rb") as f:
            self.docs = pickle.load(f)

        logger.info(f"[INFO] RAG Ready. Loaded {self.index.ntotal} vectors.")

    def query(self, text: str, k: int) -> list[dict]:
        if self.index is None or self.index.ntotal == 0:
            logger.warning("[WARN] RAG Index is empty or not loaded.")
            return []

        q_vec = self.model.encode([text], convert_to_numpy=True)
        actual_k = min(k, self.index.ntotal)
        distances, indices = self.index.search(q_vec, actual_k)

        results = []
        for i in indices[0]:
            if i != -1 and i < len(self.docs):
                results.append(self.docs[i])

        return results
