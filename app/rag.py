import faiss
import pandas as pd
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")


class MiniRAG:
    def __init__(self):
        self.dim = 384
        self.index = faiss.IndexFlatL2(self.dim)
        self.docs: list[str] = []

    def load_csv(
        self,
        path: str,
        text_columns: list[str],
        sep: str = ","
    ):
        df = pd.read_csv(path, sep=sep)

        texts = []
        for col in text_columns:
            if col not in df.columns:
                raise ValueError(f"Column '{col}' not found in CSV")

            values = (
                df[col]
                .dropna()
                .astype(str)
                .str.strip()
                .tolist()
            )
            texts.extend(values)

        self.add_docs(texts)

    def add_docs(self, texts: list[str]):
        if not texts:
            return

        vecs = model.encode(texts, convert_to_numpy=True)
        self.index.add(vecs)
        self.docs.extend(texts)

    def query(self, text: str, k: int = 3) -> list[str]:
        if self.index.ntotal == 0:
            return []

        q_vec = model.encode([text], convert_to_numpy=True)
        _, idx = self.index.search(q_vec, min(k, self.index.ntotal))

        return [self.docs[i] for i in idx[0] if i < len(self.docs)]
