"""
interview_orchestrator.py

Key changes from original:
1. Removed analyze_answer() pre-call — was adding ~700ms latency per turn for
   information already present in the main prompt context. The LLM decides
   follow-up quality internally now.

2. Phase advancement is TIME-ONLY. The LLM is not constrained to phases —
   it flows naturally. Phase tracking exists only so the UI can show a
   progress indicator and so we know when to close.

3. Memory update is called AFTER get_interview_response, not before.
   The response uses the PREVIOUS turn's memory (already updated).
   This eliminates one blocking LLM call from the critical path per turn.
   Net effect: each turn goes from 3 LLM calls → 2 LLM calls.
   (main response + memory update, where memory update result is used next turn)

4. Minimum questions per phase are kept as soft guards only — phase only
   advances if BOTH time budget is exceeded AND minimum questions are met.
   The LLM's natural flow handles the rest.
"""

from datetime import datetime
from typing import List

from backend.agents.interview_agent import (
    get_interview_response,
    generate_interview_feedback,
    PHASE_ORDER,
    PHASE_TIME_SHARE,
)
from backend.agents.interview_memory import update_interview_memory, parse_facts


def _elapsed_seconds(session) -> int:
    if not session.started_at:
        return 0
    return int((datetime.utcnow() - session.started_at).total_seconds())


def _remaining_seconds(session) -> int:
    total = (session.duration_minutes or 20) * 60
    return max(0, total - _elapsed_seconds(session))


def _phase_index(phase: str) -> int:
    try:
        return PHASE_ORDER.index(phase)
    except ValueError:
        return 0


# Minimum user answers before a phase CAN advance (soft floor, not a script)
_MIN_ANSWERS = {
    "intro": 1,
    "background": 2,
    "technical": 3,
    "behavioral": 2,
    "hr": 1,
    "closing": 0,
}


def _user_answers_in_phase(messages: List[dict], phase: str) -> int:
    """Rough count of user answers since entering current phase."""
    user_msgs = [m for m in messages if m["role"] == "user"]
    cumulative_min = sum(
        _MIN_ANSWERS.get(p, 1) for p in PHASE_ORDER[:_phase_index(phase)]
    )
    return max(0, len(user_msgs) - cumulative_min)


def _should_advance_phase(session, messages: List[dict], phase: str, remaining: int) -> bool:
    if phase == "complete":
        return False

    # Force close when nearly out of time
    if remaining <= 90:
        return True

    phase_idx = _phase_index(phase)
    total = (session.duration_minutes or 20) * 60
    elapsed = _elapsed_seconds(session)

    # How much time was budgeted for phases up to and including current
    time_used_ratio = elapsed / total if total > 0 else 0
    cumulative_budget = sum(
        PHASE_TIME_SHARE.get(p, 0.1) for p in PHASE_ORDER[:phase_idx + 1]
    )

    time_exceeded = time_used_ratio >= cumulative_budget
    enough_answers = _user_answers_in_phase(messages, phase) >= _MIN_ANSWERS.get(phase, 1)

    # Only advance if BOTH time budget exceeded AND minimum answers given
    return time_exceeded and enough_answers


def process_interview_turn(
    session,
    messages: List[dict],
    user_message: str,
    user_profile: dict,
) -> dict:
    # Use memory from previous turn (already stored on session)
    memory_summary = session.memory_summary or ""
    memory_facts = parse_facts(session.memory_facts or "{}")
    follow_up_hints = memory_facts.get("follow_up_hints", [])

    phase = session.phase or "intro"
    remaining = _remaining_seconds(session)

    # Determine if we should move to next phase or wrap up
    should_close = remaining <= 60
    advance = _should_advance_phase(session, messages, phase, remaining)

    response_phase = phase
    next_phase = phase
    is_complete = False
    feedback = None

    if phase == "closing":
        # The user just answered the closing question. Time to complete.
        response_phase = "complete"
        next_phase = "complete"
        is_complete = True
    elif should_close or (advance and phase == "hr"):
        # Enter closing phase naturally
        response_phase = "closing"
        next_phase = "closing"
    elif advance:
        idx = _phase_index(phase)
        if idx < len(PHASE_ORDER) - 1:
            next_phase = PHASE_ORDER[idx + 1]
            response_phase = next_phase  # LLM knows which phase we're entering

    # ── MAIN LLM CALL — this is the only blocking call on the critical path ──
    result = get_interview_response(
        messages=messages,
        jd_text=session.jd_text,
        user_profile=user_profile,
        phase=response_phase,
        level=session.level,
        memory_summary=memory_summary,
        memory_facts=memory_facts,
        follow_up_hints=follow_up_hints,
        remaining_seconds=remaining,
    )

    # ── MEMORY UPDATE — runs after response, result used in NEXT turn ──
    # This is still synchronous here but could be made async with FastAPI
    # BackgroundTasks if you want to shave another ~400ms off latency.
    try:
        memory_update = update_interview_memory(
            messages=messages,
            current_summary=memory_summary,
            current_facts=memory_facts,
            latest_user_message=user_message,
        )
        new_memory_summary = memory_update["summary"]
        new_memory_facts = memory_update["facts"]
    except Exception:
        new_memory_summary = memory_summary
        new_memory_facts = memory_facts

    # Generate feedback only when interview completes
    if is_complete:
        full_messages = messages + [{"role": "assistant", "content": result["response"]}]
        feedback = generate_interview_feedback(full_messages, session.level, session.jd_text)

    return {
        "response": result["response"],
        "next_phase": next_phase,
        "is_complete": is_complete,
        "phase": response_phase,
        "memory_summary": new_memory_summary,
        "memory_facts": new_memory_facts,
        "feedback": feedback,
        "remaining_seconds": remaining,
        "elapsed_seconds": _elapsed_seconds(session),
    }


def process_interview_start(session, user_profile: dict) -> dict:
    remaining = (session.duration_minutes or 20) * 60
    result = get_interview_response(
        messages=[],
        jd_text=session.jd_text,
        user_profile=user_profile,
        phase="intro",
        level=session.level,
        memory_summary="",
        memory_facts=parse_facts("{}"),
        follow_up_hints=[],
        remaining_seconds=remaining,
    )
    return {
        **result,
        "next_phase": "intro",
        "remaining_seconds": remaining,
        "elapsed_seconds": 0,
    }