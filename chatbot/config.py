"""Configuration for the AI Chatbot service."""

import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Gemini settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")

# FAISS settings
_faiss_env_path = os.getenv("FAISS_INDEX_PATH")
FAISS_INDEX_PATH = (
	os.path.abspath(_faiss_env_path)
	if _faiss_env_path
	else os.path.join(BASE_DIR, "faiss_index")
)

# MySQL settings (same as Node.js server)
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "qlbs")

# SSL settings for TiDB Cloud
DB_REQUIRE_SSL = os.getenv("DB_REQUIRE_SSL", "false").lower() == "true"

# Embedding model
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/embedding-001")

# Server (Render uses PORT env var)
CHATBOT_PORT = int(os.getenv("PORT", os.getenv("CHATBOT_PORT", "8000")))
