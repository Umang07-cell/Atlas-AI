import json
from typing import List
from backend.agents.llm import call_cerebras_json

def _default_facts() -> dict:
    return {
        "skills_claimed": [],
        "projects": [],
        "strengths": [],
        "gaps": [],
        "topics_covered": [],
    }


def parse_facts(raw: str) -> dict:
    try:
        facts = json.loads(raw) if raw else {}
        base = _default_facts()
        base.update({k: facts.get(k, base[k]) for k in base})
        return base
    except Exception:
        return _default_facts()


def update_interview_memory(
    messages: List[dict],
    current_summary: str,
    current_facts: dict,
    latest_user_message: str,
) -> dict:
    """Update rolling summary and structured facts after each candidate answer."""
    recent = messages[-6:] if len(messages) > 6 else messages
    history = "\n".join(
        f"{'Candidate' if m['role'] == 'user' else 'Interviewer'}: {m['content']}"
        for m in recent
    )

    prompt = f"""You maintain memory for a live job interview.

CURRENT SUMMARY:
{current_summary or 'No summary yet.'}

CURRENT FACTS:
{json.dumps(current_facts, indent=2)}

LATEST CANDIDATE ANSWER:
{latest_user_message}

RECENT CONVERSATION:
{history}

Update memory based on the latest answer. Return ONLY JSON:
{{
  "summary": "2-4 sentence rolling summary of what we know about this candidate so far",
  "facts": {{
    "skills_claimed": ["skill1"],
    "projects": ["project or achievement mentioned"],
    "strengths": ["demonstrated strength"],
    "gaps": ["weak area or missing detail"],
    "topics_covered": ["topic already asked about"]
  }},
  "follow_up_hints": ["specific follow-up the interviewer should consider"],
  "difficulty_signal": "easier|same|harder"
}}"""

    try:
        result = call_cerebras_json(prompt)
        facts = _default_facts()
        facts.update(result.get("facts", {}))
        return {
            "summary": result.get("summary", current_summary),
            "facts": facts,
            "follow_up_hints": result.get("follow_up_hints", []),
            "difficulty_signal": result.get("difficulty_signal", "same"),
        }
    except Exception:
        return {
            "summary": current_summary,
            "facts": current_facts,
            "follow_up_hints": [],
            "difficulty_signal": "same",
        }
