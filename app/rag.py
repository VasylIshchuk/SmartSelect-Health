import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

class MiniRAG:
    def __init__(self):
        self.index = faiss.IndexFlatL2(384)
        self.docs = []

    def add_docs(self, texts):
        vecs = model.encode(texts, convert_to_numpy=True)
        self.index.add(vecs)
        self.docs.extend(texts)

    def query(self, text, k=3):
        q_vec = model.encode([text], convert_to_numpy=True)
        D, I = self.index.search(q_vec, k)
        return [self.docs[i] for i in I[0]]
