"""Configuration for the AI Chatbot service."""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")

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
DB_PASSWORD = os.getenv("DB_PASSWORD", "kimloan12345")
DB_NAME = os.getenv("DB_NAME", "qlbs")

# Embedding model
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# Server
CHATBOT_PORT = int(os.getenv("CHATBOT_PORT", "8000"))
