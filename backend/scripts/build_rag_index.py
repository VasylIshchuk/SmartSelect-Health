import os
import pickle
import faiss
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Any

from .medline_data_rag import download_and_process
from app.core.logging import logger
from app.core.config import settings
from app.services.rag_service import get_embedding_model


def build_rag_index():
    try:
        logger.info(
            "[INFO] START: a complete ETL (Extract, Transform, Load) script for build RAG system"
        )

        _ensure_data_exists(settings.RAG_DATA_PATH)
        df = _load_data(settings.RAG_DATA_PATH)
        texts, metadata = _prepare_documents(df)

        if not texts:
            logger.warning("[WARM] No texts to process")
            return

        embeddings = _generate_embeddings(texts, settings.EMBEDDING_MODEL_NAME)
        index = _create_faiss_index(embeddings)

        save_artifacts(
            index, metadata, settings.RAG_INDEX_PATH, settings.RAG_METADATA_PATH
        )

        logger.info("[INFO] SUCCESS: RAG Index built successfully!")

    except Exception as e:
        logger.error(f"[ERROR] FAILED: An error occurred while building the index: {e}")
        raise


def _ensure_data_exists(csv_path: str) -> None:
    logger.info("[Step 1]: Downloading and processing CSV...")
    download_and_process()

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found at {csv_path}")


def _load_data(csv_path: str) -> pd.DataFrame:
    logger.info("[Step 2]: Loading CSV data...")
    df = pd.read_csv(csv_path)
    return df.fillna("")


def _prepare_documents(df: pd.DataFrame) -> Tuple[List[str], List[Dict[str, Any]]]:
    logger.info(f"[Step 3]: Processing {len(df)} records...")
    texts_to_embed = []
    metadata_docs = []

    for _, row in df.iterrows():
        embed_text = f"{row['title']} " f"{str(row['description'])[:500]}"

        display_text = (
            f"Disease/Topic: {row['title']}\n"
            f"Description: {str(row['description'])}\n"
            f"Source: {row.get('source_url', '')}"
        )

        doc_entry = {
            "original_id": row.get("id"),
            "source": row.get("source_url"),
            "text": display_text,
            "title": row["title"],
        }

        texts_to_embed.append(embed_text)
        metadata_docs.append(doc_entry)

    return texts_to_embed, metadata_docs


def _generate_embeddings(texts: List[str], model_name: str) -> np.ndarray:
    logger.info(f"[Step 4]: Loading model {model_name}...")
    model = get_embedding_model()

    logger.info("[Step 5]: Generating embeddings (this may take a while)...")
    return model.encode(texts, convert_to_numpy=True)


def _create_faiss_index(embeddings: np.ndarray) -> faiss.Index:
    logger.info("[Step 6]: Building FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index


def save_artifacts(
    index: faiss.Index, metadata: List[Dict], index_path: str, metadata_path: str
) -> None:
    logger.info("[Step 7]: Saving artifacts to disk...")

    faiss.write_index(index, str(index_path))

    with open(metadata_path, "wb") as f:
        pickle.dump(metadata, f)

    logger.info(f"[INFO] Saved index to {index_path}")
    logger.info(f"[INFO] Saved metadata to {metadata_path}")


if __name__ == "__main__":
    build_rag_index()
