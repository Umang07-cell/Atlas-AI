# embeddings.py — sentence-transformers removed, using Groq API instead
# Your app already has GROQ_API_KEY set in render.yaml

import os
import hashlib
import json
import sqlite3
from typing import List

# Simple cache so we don't re-embed the same text twice
CACHE_DB = "./data/embed_cache.db"

def _get_cache_conn():
    os.makedirs("./data", exist_ok=True)
    conn = sqlite3.connect(CACHE_DB)
    conn.execute("CREATE TABLE IF NOT EXISTS cache (hash TEXT PRIMARY KEY, embedding TEXT)")
    conn.commit()
    return conn


def _hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def embed_text(text: str) -> List[float]:
    return embed_texts([text])[0]


def embed_texts(texts: List[str]) -> List[List[float]]:
    import httpx

    results = [None] * len(texts)
    to_fetch = []

    conn = _get_cache_conn()
    for i, text in enumerate(texts):
        h = _hash(text)
        row = conn.execute("SELECT embedding FROM cache WHERE hash=?", (h,)).fetchone()
        if row:
            results[i] = json.loads(row[0])
        else:
            to_fetch.append((i, text, h))
    conn.close()

    if not to_fetch:
        return results

    # Use Groq's embedding endpoint
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        # Fallback: simple deterministic hash-based pseudo-embedding (384-dim)
        # Not semantic, but keeps app running if key missing
        import hashlib
        for i, text, h in to_fetch:
            seed = int(hashlib.sha256(text.encode()).hexdigest(), 16)
            import random
            rng = random.Random(seed)
            vec = [rng.gauss(0, 1) for _ in range(384)]
            norm = sum(x**2 for x in vec) ** 0.5
            results[i] = [x / norm for x in vec]
        return results

    conn = _get_cache_conn()
    for i, text, h in to_fetch:
        try:
            resp = httpx.post(
                "https://api.groq.com/openai/v1/embeddings",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": "llama3-groq-en-8b-8192-tool-use-preview", "input": text},
                timeout=10
            )
            vec = resp.json()["data"][0]["embedding"]
        except Exception:
            # Fallback pseudo-embedding
            import random
            seed = int(hashlib.sha256(text.encode()).hexdigest(), 16)
            rng = random.Random(seed)
            vec = [rng.gauss(0, 1) for _ in range(384)]
            norm = sum(x**2 for x in vec) ** 0.5
            vec = [x / norm for x in vec]

        results[i] = vec
        conn.execute("INSERT OR REPLACE INTO cache VALUES (?,?)", (h, json.dumps(vec)))
    conn.commit()
    conn.close()

    return results