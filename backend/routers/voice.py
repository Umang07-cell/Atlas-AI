import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.agents.voice_agent import text_to_speech_async, transcribe_audio, detect_intent, split_for_tts

router = APIRouter(prefix="/voice", tags=["voice"])


class SpeakRequest(BaseModel):
    text: str
    voice: str = "en-IN-NeerjaNeural"


class SpeakChunksRequest(BaseModel):
    text: str
    voice: str = "en-IN-NeerjaNeural"


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    os.makedirs("tmp", exist_ok=True)
    # Accept webm, mp4, wav, ogg
    ext = "webm"
    if audio.content_type:
        if "wav" in audio.content_type: ext = "wav"
        elif "ogg" in audio.content_type: ext = "ogg"
        elif "mp4" in audio.content_type: ext = "mp4"

    tmp_path = f"tmp/audio_{user_id}_{uuid.uuid4().hex}.{ext}"
    try:
        contents = await audio.read()
        with open(tmp_path, "wb") as f:
            f.write(contents)

        transcript = transcribe_audio(tmp_path)
        if not transcript:
            return {"transcript": "", "intent": "general_query", "spoken_response": "I didn't catch that. Please try again."}

        user_profile = {
            "name": user.name,
            "domain": user.domain,
            "skills": user.get_skills(),
        }
        intent_data = detect_intent(transcript, user_profile)

        return {
            "transcript": transcript,
            "intent": intent_data.get("intent", "general_query"),
            "parameters": intent_data.get("parameters", {}),
            "spoken_response": intent_data.get("spoken_response", "Got it!"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/transcribe/interview")
async def transcribe_interview(
    audio: UploadFile = File(...),
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """Fast STT for mock interview — no intent detection."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    os.makedirs("tmp", exist_ok=True)
    ext = "webm"
    if audio.content_type:
        if "wav" in audio.content_type:
            ext = "wav"
        elif "ogg" in audio.content_type:
            ext = "ogg"
        elif "mp4" in audio.content_type:
            ext = "mp4"

    tmp_path = f"tmp/interview_{user_id}_{uuid.uuid4().hex}.{ext}"
    try:
        contents = await audio.read()
        with open(tmp_path, "wb") as f:
            f.write(contents)
        transcript = transcribe_audio(tmp_path)
        return {"transcript": transcript or ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/speak")
async def speak(req: SpeakRequest):
    os.makedirs("tmp", exist_ok=True)
    output_path = f"tmp/tts_{uuid.uuid4().hex}.mp3"
    try:
        await text_to_speech_async(req.text, output_path, req.voice)
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError("TTS produced empty file")
        from starlette.background import BackgroundTask
        return FileResponse(
            output_path,
            media_type="audio/mpeg",
            filename="response.mp3",
            background=BackgroundTask(os.remove, output_path),
        )
    except Exception as e:
        # Clean up if file was created
        if os.path.exists(output_path):
            os.remove(output_path)
        # Return the error detail so frontend can see what's wrong
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")


@router.post("/speak/chunks")
def speak_chunks(req: SpeakChunksRequest):
    """Return sentence chunks for sequential TTS playback on the client."""
    chunks = split_for_tts(req.text)
    return {"chunks": chunks, "voice": req.voice}
