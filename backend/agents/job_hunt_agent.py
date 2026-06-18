import json
from typing import List
from backend.agents.llm import call_groq_json
from backend.memory.matcher import match_jobs_to_resume


def rerank_and_explain(top_matches: List[dict], user_profile: dict) -> List[dict]:
    """
    Take top-20 vector matches, ask Groq to re-rank top 5 with explanations.
    Returns list of {job_id, rank, match_reason}
    """
    if not top_matches:
        return []

    matches_text = json.dumps(top_matches[:20], indent=2)
    profile_text = json.dumps(user_profile, indent=2)

    prompt = f"""You are a career matching assistant.
A user has this profile:
{profile_text}

These are job matches ranked by vector similarity:
{matches_text}

Select the top 5 most relevant jobs and explain WHY each matches this user.
Consider: skills alignment, domain match, experience level, location preference.

Return ONLY JSON:
[
  {{
    "job_id": <int>,
    "rank": 1,
    "match_reason": "2-sentence explanation why this job fits the candidate"
  }},
  ...
]
Only return 5 items. Sort by rank 1 (best) to 5."""

    return call_groq_json(prompt)


def get_matches_for_user(resume_embedding_id: str, user_profile: dict, top_k: int = 20) -> List[dict]:
    """Full matching pipeline: vector search → Groq re-rank."""
    raw_matches = match_jobs_to_resume(resume_embedding_id, top_k=top_k)
    if not raw_matches:
        return []

    # Format for Groq prompt
    formatted = [
        {
            "job_id": m["job_id"],
            "score": m["score"],
            "description_excerpt": m["document"][:300],
        }
        for m in raw_matches
    ]

    return rerank_and_explain(formatted, user_profile)
