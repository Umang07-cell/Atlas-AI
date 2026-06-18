import os
import chromadb
from backend.config import CHROMA_PATH

os.makedirs(CHROMA_PATH, exist_ok=True)

_client = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
    return _client


def get_or_create_collection(name: str):
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


def get_resumes_collection():
    return get_or_create_collection("resumes")


def get_jobs_collection():
    return get_or_create_collection("jobs")
