import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models.chat import ChatMessage
from backend.models.user import User
from backend.agents.chat_agent import chat_with_atlas

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    user_id: int
    message: str


@router.post("/send")
def send_chat(req: ChatRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get last 10 messages for context
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == req.user_id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history.reverse()

    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": req.message})

    user_profile = {
        "name": user.name,
        "domain": user.domain,
        "skills": user.get_skills(),
        "experience_level": user.experience_level,
        "location": user.location,
    }

    try:
        response = chat_with_atlas(messages, user_profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e}")

    # Save both messages
    db.add(ChatMessage(user_id=req.user_id, role="user", content=req.message))
    db.add(ChatMessage(user_id=req.user_id, role="assistant", content=response))
    db.commit()

    return {"response": response}


@router.get("/history")
def get_history(user_id: int = Query(...), db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at.asc()).limit(50).all()

    return [
        {"id": m.id, "role": m.role, "content": m.content, "created_at": str(m.created_at)}
        for m in messages
    ]


@router.delete("/history")
def clear_history(user_id: int = Query(...), db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.commit()
    return {"message": "Chat history cleared"}
