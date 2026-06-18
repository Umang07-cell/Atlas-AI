import json, os, re
from groq import Groq   # type: ignore[import]
from cerebras.cloud.sdk import Cerebras # type: ignore[import]

# ── Groq (Chat, Resume, Jobs, Tasks, Voice) ───────────────────────────────────
_groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
GROQ_MODEL = "llama-3.3-70b-versatile"

# ── Cerebras (Interview — long sessions, 1M tokens/day free) ─────────────────
_cerebras_client = Cerebras(api_key=os.getenv("CEREBRAS_API_KEY", ""))
CEREBRAS_MODEL = "gpt-oss-120b"


def _clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        end = -1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[1:end])
    return text.strip()


def _parse_json(raw: str) -> dict | list:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}|\[.*\]', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Non-JSON response: {raw[:200]}")


# ── GROQ — Chat, Resume, Jobs, Tasks, Voice ───────────────────────────────────

def call_groq(prompt: str, expect_json: bool = False) -> str:
    response = _groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
        temperature=0.7,
    )
    text = response.choices[0].message.content.strip()
    if expect_json:
        text = _clean_json_text(text)
    return text.strip()


def call_groq_json(prompt: str) -> dict | list:
    raw = call_groq(prompt, expect_json=True)
    return _parse_json(raw)


# ── CEREBRAS — Interview only ─────────────────────────────────────────────────

def call_cerebras(prompt: str, expect_json: bool = False) -> str:
    response = _cerebras_client.chat.completions.create(
        model=CEREBRAS_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
        temperature=0.7,
    )
    text = response.choices[0].message.content.strip()
    if expect_json:
        text = _clean_json_text(text)
    return text.strip()


def call_cerebras_json(prompt: str) -> dict | list:
    raw = call_cerebras(prompt, expect_json=True)
    return _parse_json(raw)


