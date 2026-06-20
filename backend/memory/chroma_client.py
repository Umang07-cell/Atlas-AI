# chroma_client.py — ChromaDB removed, replaced with SQLite-based vector store
# Same function signatures, drop-in replacement

import os
import json
import sqlite3
from backend.config import CHROMA_PATH

DB_PATH = os.path.join(os.path.dirname(CHROMA_PATH), "vectors.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS vectors (
            id TEXT,
            collection TEXT,
            embedding TEXT,
            document TEXT,
            metadata TEXT,
            PRIMARY KEY (id, collection)
        )
    """)
    conn.commit()
    return conn


class SimpleCollection:
    def __init__(self, name):
        self.name = name

    def add(self, ids, embeddings, documents=None, metadatas=None):
        conn = _get_conn()
        for i, vid in enumerate(ids):
            conn.execute("""
                INSERT OR REPLACE INTO vectors (id, collection, embedding, document, metadata)
                VALUES (?, ?, ?, ?, ?)
            """, (
                vid,
                self.name,
                json.dumps(embeddings[i]),
                documents[i] if documents else "",
                json.dumps(metadatas[i]) if metadatas else "{}"
            ))
        conn.commit()
        conn.close()

    def query(self, query_embeddings, n_results=5, **kwargs):
        import numpy as np
        conn = _get_conn()
        rows = conn.execute(
            "SELECT id, embedding, document, metadata FROM vectors WHERE collection=?",
            (self.name,)
        ).fetchall()
        conn.close()

        if not rows:
            return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

        q = np.array(query_embeddings[0])
        scores = []
        for row in rows:
            vec = np.array(json.loads(row[1]))
            sim = float(np.dot(q, vec) / (np.linalg.norm(q) * np.linalg.norm(vec) + 1e-9))
            scores.append((sim, row))

        scores.sort(reverse=True)
        top = scores[:n_results]

        return {
            "ids": [[r[1][0] for r in top]],
            "documents": [[r[1][2] for r in top]],
            "metadatas": [[json.loads(r[1][3]) for r in top]],
            "distances": [[1 - r[0] for r in top]]
        }

    def delete(self, ids):
        conn = _get_conn()
        for vid in ids:
            conn.execute("DELETE FROM vectors WHERE id=? AND collection=?", (vid, self.name))
        conn.commit()
        conn.close()

    def get(self, ids=None, **kwargs):
        conn = _get_conn()
        if ids:
            placeholders = ",".join("?" * len(ids))
            rows = conn.execute(
                f"SELECT id, document, metadata FROM vectors WHERE collection=? AND id IN ({placeholders})",
                [self.name] + list(ids)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, document, metadata FROM vectors WHERE collection=?",
                (self.name,)
            ).fetchall()
        conn.close()
        return {
            "ids": [r[0] for r in rows],
            "documents": [r[1] for r in rows],
            "metadatas": [json.loads(r[2]) for r in rows]
        }


def get_or_create_collection(name: str) -> SimpleCollection:
    return SimpleCollection(name)

def get_resumes_collection() -> SimpleCollection:
    return get_or_create_collection("resumes")

def get_jobs_collection() -> SimpleCollection:
    return get_or_create_collection("jobs")