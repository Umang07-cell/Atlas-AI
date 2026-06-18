from sentence_transformers import SentenceTransformer
from typing import List

_model = None
MODEL_NAME = "all-MiniLM-L6-v2"   # 384-dim, fast on CPU, ~80MB


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_text(text: str) -> List[float]:
    """Embed a single text string. Returns list of floats."""
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Batch embed multiple texts."""
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True, batch_size=8)
    return [v.tolist() for v in vectors]
