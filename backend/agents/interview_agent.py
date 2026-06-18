from typing import List
from backend.agents.llm import call_cerebras
PHASE_ORDER = ["intro", "background", "technical", "behavioral", "hr", "closing"]
PHASE_TIME_SHARE = {
    "intro": 0.05, "background": 0.20, "technical": 0.35,
    "behavioral": 0.20, "hr": 0.10, "closing": 0.10,
}
PHASE_LABELS = {
    "intro": "Introduction", "background": "Background",
    "technical": "Technical", "behavioral": "Behavioral",
    "hr": "HR Round", "closing": "Closing", "complete": "Complete",
}
LEVEL_CONTEXT = {
    "fresher": "0-1 yr. Foundational. Be patient.",
    "junior": "1-3 yrs. Practical depth.",
    "experienced": "3+ yrs. System design, leadership.",
}

# Under 120 words. Every word earns its place.
SYSTEM_PERSONA = """You are Priya, a hiring manager on a voice call interview.

Rules:
- One reaction (1 sentence) + one question per turn. Never two questions.
- Under 55 words total. Voice call - brevity matters.
- Use contractions. Sound human.
- Never say "great answer", "wonderful", "excellent", or any filler praise.
- Never announce topic changes. Shift naturally.
- Never say you are an AI.
- Only reference what the candidate explicitly said. Never assume.
- Start easy. Earn the right to go technical by understanding the person first.
- Probe weak answers. Go deeper on strong ones."""


def _pacing(turn: int, mins_left: int) -> str:
    if mins_left <= 2:
        return "Close now. Thank them warmly. One honest encouraging sentence. End it."
    if mins_left <= 5:
        return "HR territory. Goals, motivation, expectations. Then close."
    if mins_left <= 10:
        return "Behavioral. One specific situation-based question. How they handled conflict, failure, or pressure."
    if turn <= 1:
        return "Warm up only. Ask how they are doing. Nothing interview-related yet."
    if turn <= 4:
        return "Background. Who are they, what have they been working on. Easy and open."
    if turn <= 8:
        return "Dig into one specific project they mentioned. What, their role, what was hard."
    return "Technical now. Based on what they told you - decisions, tradeoffs, what they would change."


def get_interview_response(
    messages: List[dict],
    jd_text: str,
    user_profile: dict,
    phase: str,
    level: str,
    memory_summary: str = "",
    memory_facts: dict = None,
    follow_up_hints: list = None,
    remaining_seconds: int = 1200,
) -> dict:
    memory_facts = memory_facts or {}
    follow_up_hints = follow_up_hints or []

    candidate_name = user_profile.get("name", "the candidate")
    candidate_domain = user_profile.get("domain", "Technology")
    level_ctx = LEVEL_CONTEXT.get(level, LEVEL_CONTEXT["fresher"])
    jd_summary = (jd_text or "")[:400] or "General tech role"

    recent = messages[-8:]
    history = "\n".join(
        f"{'Candidate' if m['role'] == 'user' else 'Priya'}: {m['content']}"
        for m in recent
    ) or "Just starting."

    turn_count = len([m for m in messages if m["role"] == "user"])
    mins_left = max(0, remaining_seconds // 60)
    pacing = _pacing(turn_count, mins_left)

    hints = "; ".join(follow_up_hints[:2]) or "none"
    summary = memory_summary or "Nothing yet."

    if len(messages) == 0:
        task = f'Open the interview. Say: "Hi {candidate_name}, I\'m Priya. We\'ll keep this conversational - background first, then technical. But first, how are you doing today?" Under 35 words. Warm and direct.'
    else:
        task = f"React to their last answer in 1 sentence, then ask your next question.\nPacing: {pacing}\nFollow-up hints: {hints}"

    prompt = f"""{SYSTEM_PERSONA}

JOB: {jd_summary}
CANDIDATE: {candidate_name}, {candidate_domain}, {level_ctx}
MEMORY: {summary}

CONVERSATION:
{history}

TASK: {task}

Respond as Priya. Under 55 words."""

    response = call_cerebras(prompt)

    # Trim hard if model ignores word limit
    words = response.split()
    if len(words) > 80:
        sentences = []
        current = ""
        for char in response:
            current += char
            if char in ".?!":
                sentences.append(current.strip())
                current = ""
        trimmed = ""
        for s in sentences:
            if len((trimmed + " " + s).split()) <= 75:
                trimmed = (trimmed + " " + s).strip()
            else:
                break
        if trimmed:
            response = trimmed

    return {"response": response, "next_phase": phase, "is_complete": False, "phase": phase}


def generate_interview_feedback(messages: List[dict], level: str, jd_text: str) -> dict:
    conversation = "\n".join(
        f"{'Candidate' if m['role'] == 'user' else 'Interviewer'}: {m['content']}"
        for m in messages
    )

    prompt = f"""Senior interviewer reviewing a completed interview.
Level: {level}
Job: {(jd_text or '')[:300]}

TRANSCRIPT:
{conversation[:4000]}

Return ONLY valid JSON. Be honest - base scores on actual transcript, not assumptions:
{{
  "overall_score": <1-10>,
  "technical_score": <1-10>,
  "communication_score": <1-10>,
  "confidence_score": <1-10>,
  "strengths": ["evidence-backed strength"],
  "improvements": ["specific gap from transcript"],
  "verdict": "Strong Hire | Hire | Maybe | No Hire",
  "summary": "2 sentence honest assessment",
  "highlights": ["specific moment from this interview"],
  "questions_recap": ["how they handled one key question"]
}}"""

    try:
        return call_cerebras(prompt)
    except Exception:
        return {
            "overall_score": 0, "technical_score": 0,
            "communication_score": 0, "confidence_score": 0,
            "strengths": [], "improvements": ["Could not evaluate — session may have been too short"],
            "verdict": "Incomplete", "summary": "Could not generate feedback. Please try a longer session.",
            "highlights": [], "questions_recap": [],
        }        