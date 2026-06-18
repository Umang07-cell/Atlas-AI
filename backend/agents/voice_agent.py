"""
voice_agent.py

STT: Groq Whisper API (replaces local faster-whisper)
- No local model loading, no CPU inference, no RAM overhead
- ~200ms transcription vs 8-15s on Render CPU
- Same Groq API key already in use for LLM

TTS: gTTS (unchanged)
- From Render servers ~300-500ms to Google — acceptable for free tier
- No viable free alternative with better latency on hosted infra

Groq Whisper limits (free tier):
- 25MB max file size per request
- 20 requests/minute (single user: fine)
- Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
"""

import asyncio
import importlib
import os

Groq = None
try:
    Groq = importlib.import_module("groq").Groq
except ImportError:
    Groq = None
from backend.agents.llm import call_groq_json

_groq_client = None


def _get_groq():
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
    return _groq_client


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio using Groq Whisper API.
    Replaces local faster-whisper entirely.
    """
    # File size check — Groq hard limit is 25MB
    size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    if size_mb > 24:
        raise ValueError(f"Audio file too large ({size_mb:.1f}MB). Max 24MB. Ask user to speak shorter responses.")

    client = _get_groq()

    with open(audio_path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), f),
            model="whisper-large-v3-turbo",  # fastest Groq Whisper model
            language="en",
            response_format="text",
        )

    # Groq returns raw string when response_format="text"
    text = transcription.strip() if isinstance(transcription, str) else (transcription.text or "").strip()
    return text


def split_for_tts(text: str, max_len: int = 450) -> list:
    """Split text into TTS-friendly chunks at sentence boundaries."""
    text = text.strip()
    if len(text) <= max_len:
        return [text] if text else []
    chunks = []
    current = ""
    for part in text.replace("!", ".").replace("?", ".").split("."):
        part = part.strip()
        if not part:
            continue
        sentence = part + "."
        if len(current) + len(sentence) <= max_len:
            current += (" " if current else "") + sentence
        else:
            if current:
                chunks.append(current)
            current = sentence
    if current:
        chunks.append(current)
    return chunks or [text[:max_len]]


def detect_intent(transcript: str, user_profile: dict) -> dict:
    prompt = f"""You are ATLAS voice assistant. Detect intent from this voice command.

Command: "{transcript}"

User profile: domain={user_profile.get('domain','')}, skills={user_profile.get('skills',[])}

Classify intent as one of:
- navigate_jobs: wants to see jobs
- navigate_resume: wants resume studio
- navigate_interview: wants interview prep
- navigate_chat: wants to chat
- navigate_dashboard: go to dashboard
- create_task: add a task (extract task title)
- get_briefing: wants daily briefing
- career_question: asking career advice (extract question)
- general_query: anything else

Return ONLY JSON:
{{"intent": "<intent>", "parameters": {{}}, "spoken_response": "short friendly response to speak back (max 20 words)"}}"""

    try:
        result = call_groq_json(prompt)
        if "spoken_response" not in result:
            result["spoken_response"] = "Got it, let me help you with that."
        return result
    except Exception:
        return {
            "intent": "general_query",
            "parameters": {},
            "spoken_response": "I heard you. Let me help with that.",
        }


async def text_to_speech_async(text: str, output_path: str, voice: str = "en-IN-NeerjaNeural") -> str:
    """TTS via gTTS. Voice param kept for API compatibility, ignored."""
    text = text[:800] if len(text) > 800 else text
    loop = asyncio.get_event_loop()

    def _gtts():
        try:
            from gtts import gTTS
        except ImportError:
            raise ImportError("gtts library not installed. Install with: pip install gtts")
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(output_path)

    await loop.run_in_executor(None, _gtts)
    return output_path