from typing import List, Dict, Any
from backend.memory.chroma_client import get_resumes_collection, get_jobs_collection
from backend.memory.embeddings import embed_text


def store_resume_vector(embedding_id: str, text: str, user_id: int) -> None:
    col = get_resumes_collection()
    vector = embed_text(text)
    col.upsert(
        ids=[embedding_id],
        embeddings=[vector],
        documents=[text],
        metadatas=[{"user_id": user_id}],
    )


def store_job_vector(embedding_id: str, text: str, job_id: int, platform: str, posted_date: str) -> None:
    col = get_jobs_collection()
    vector = embed_text(text)
    col.upsert(
        ids=[embedding_id],
        embeddings=[vector],
        documents=[text],
        metadatas=[{"job_id": job_id, "platform": platform, "posted_date": posted_date}],
    )


def get_resume_vector(embedding_id: str) -> List[float]:
    col = get_resumes_collection()
    result = col.get(ids=[embedding_id], include=["embeddings"])
    if result and result["embeddings"]:
        return result["embeddings"][0]
    raise ValueError(f"No resume vector found for id: {embedding_id}")


def match_jobs_to_resume(resume_embedding_id: str, top_k: int = 20) -> List[Dict[str, Any]]:
    """
    Query jobs collection with the resume vector.
    Returns list of {job_id, score, document} dicts sorted by similarity.
    """
    resume_vector = get_resume_vector(resume_embedding_id)
    col = get_jobs_collection()

    results = col.query(
        query_embeddings=[resume_vector],
        n_results=min(top_k, col.count() or 1),
        include=["metadatas", "distances", "documents"],
    )

    matches = []
    if results and results["metadatas"]:
        for meta, dist, doc in zip(
            results["metadatas"][0],
            results["distances"][0],
            results["documents"][0],
        ):
            matches.append({
                "job_id": meta.get("job_id"),
                "score": round(1 - dist, 4),   # cosine distance → similarity
                "document": doc,
            })

    return sorted(matches, key=lambda x: x["score"], reverse=True)
