import json
from backend.agents.llm import call_cerebras_json

def analyze_answer(
    user_message: str,
    phase: str,
    memory_summary: str,
    memory_facts: dict,
    level: str,
) -> dict:
    """Analyze candidate answer quality and recommend follow-up / phase movement."""
    prompt = f"""You are evaluating a candidate's interview answer in real time.

PHASE: {phase}
LEVEL: {level}

INTERVIEW MEMORY:
{memory_summary}

KNOWN FACTS:
{json.dumps(memory_facts, indent=2)}

CANDIDATE ANSWER:
{user_message}

Return ONLY JSON:
{{
  "answer_quality": "strong|partial|weak|off_topic",
  "should_follow_up": true,
  "follow_up_reason": "why a follow-up helps",
  "suggested_difficulty": "easier|same|harder",
  "phase_recommendation": "stay|advance",
  "topics_to_probe": ["topic1"]
}}"""

    try:
        return call_cerebras_json(prompt)
    except Exception:
        return {
            "answer_quality": "partial",
            "should_follow_up": True,
            "follow_up_reason": "Dig deeper into their experience.",
            "suggested_difficulty": "same",
            "phase_recommendation": "stay",
            "topics_to_probe": [],
        }
