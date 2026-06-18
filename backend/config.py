import os
from dotenv import load_dotenv

load_dotenv()

# LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")

# Auth
JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", 24))

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/atlas.db")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./data/chroma")

# Scheduler
DEFAULT_SCHEDULE_TIME = os.getenv("DEFAULT_SCHEDULE_TIME", "10:00")

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")