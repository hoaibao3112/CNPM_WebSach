"""
AI Chatbot FastAPI Server
Uses LangChain + Ollama + FAISS for RAG-based responses.
"""

import os
import uuid
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from config import (
    GEMINI_API_KEY, LLM_MODEL,
    FAISS_INDEX_PATH,
    EMBEDDING_MODEL, CHATBOT_PORT
)

# ─── FastAPI App ────────────────────────────────────────────────

app = FastAPI(title="WebSach AI Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request / Response Models ──────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=10)
    return_sources: bool = False

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    sources: list[str] | None = None

# ─── Global State ───────────────────────────────────────────────

# In-memory conversation history per session (limited to last N messages)
conversation_history: dict[str, list] = {}
session_last_seen: dict[str, float] = {}
MAX_HISTORY = 10
SESSION_TTL_MINUTES = int(os.getenv("SESSION_TTL_MINUTES", "180"))

# LLM and vector store (lazy-initialized)
llm = None
vectorstore = None
retriever = None

# ─── System Prompt ──────────────────────────────────────────────

SYSTEM_PROMPT = """Bạn là trợ lý AI thông minh của cửa hàng sách trực tuyến WebSach.

Vai trò của bạn:
- Hỗ trợ khách hàng tìm kiếm sách, tư vấn sản phẩm
- Trả lời câu hỏi về chính sách cửa hàng (đặt hàng, giao hàng, đổi trả, khuyến mãi)
- Gợi ý sách phù hợp dựa trên sở thích khách hàng
- Cung cấp thông tin liên hệ khi cần

Quy tắc:
1. LUÔN trả lời bằng tiếng Việt
2. Thân thiện, lịch sự, chuyên nghiệp
3. Trả lời ngắn gọn, rõ ràng, đi thẳng vào vấn đề
4. Nếu không biết câu trả lời, hãy nói rằng bạn không có thông tin và đề nghị khách liên hệ hotline 0374170367
5. Sử dụng thông tin từ ngữ cảnh được cung cấp để trả lời chính xác
6. Khi gợi ý sách, luôn kèm giá và tác giả nếu có
7. KHÔNG bịa ra thông tin không có trong ngữ cảnh
8. Nếu câu hỏi liên quan mua hàng, hãy kết thúc bằng một gợi ý hành động ngắn
9. Nếu có nhiều lựa chọn, trình bày dạng danh sách gạch đầu dòng

Thông tin ngữ cảnh từ cơ sở dữ liệu:
{context}
"""

# ─── Initialize Components ──────────────────────────────────────

def init_components():
    """Initialize LLM, embeddings, and vector store."""
    global llm, vectorstore, retriever

    if not GEMINI_API_KEY:
        print("❌ WARNING: GEMINI_API_KEY is missing! Chatbot will fail to generate responses.")

    print(f"🤖 Initializing Google Gemini LLM: {LLM_MODEL}")
    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL,
        google_api_key=GEMINI_API_KEY,
        temperature=0.3,
        max_output_tokens=512,
    )

    print(f"🧠 Loading embeddings: {EMBEDDING_MODEL}")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    if os.path.exists(FAISS_INDEX_PATH):
        print(f"📦 Loading FAISS index from {FAISS_INDEX_PATH}")
        vectorstore = FAISS.load_local(
            FAISS_INDEX_PATH, 
            embeddings,
            allow_dangerous_deserialization=True
        )
        retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        print(f"   Index loaded with retriever (k=5)")
    else:
        print(f"⚠️ FAISS index not found at {FAISS_INDEX_PATH}")
        print(f"   Run 'python ingest.py' first to ingest data!")
        retriever = None

    print("✅ Components initialized successfully!")


# ─── Chat Logic ─────────────────────────────────────────────────

def prune_expired_sessions() -> None:
    """Delete stale sessions to avoid memory growth."""
    now = time.time()
    ttl_seconds = SESSION_TTL_MINUTES * 60
    expired_session_ids = [
        sid for sid, last_seen in session_last_seen.items()
        if now - last_seen > ttl_seconds
    ]

    for sid in expired_session_ids:
        conversation_history.pop(sid, None)
        session_last_seen.pop(sid, None)


def get_context(query: str, top_k: int = 5) -> tuple[str, list[str]]:
    """Retrieve relevant context snippets from FAISS."""
    if vectorstore is None:
        return (
            "Không có dữ liệu ngữ cảnh. Hãy trả lời dựa trên kiến thức chung.",
            []
        )
    
    try:
        docs = vectorstore.similarity_search(query, k=top_k)
        if docs:
            snippets = [doc.page_content[:500] for doc in docs]
            return "\n\n---\n\n".join([doc.page_content for doc in docs]), snippets
        return "Không tìm thấy thông tin liên quan trong cơ sở dữ liệu.", []
    except Exception as e:
        print(f"Retrieval error: {e}")
        return "Lỗi khi truy xuất dữ liệu.", []


def get_or_create_session(session_id: str | None) -> str:
    """Get existing session or create new one."""
    prune_expired_sessions()

    if session_id and session_id in conversation_history:
        session_last_seen[session_id] = time.time()
        return session_id

    new_id = session_id or str(uuid.uuid4())
    conversation_history[new_id] = []
    session_last_seen[new_id] = time.time()
    return new_id


def normalize_reply(text: str) -> str:
    """Normalize model output for cleaner UI display."""
    return "\n".join(line.rstrip() for line in text.strip().splitlines())


async def generate_response(message: str, session_id: str, top_k: int = 5) -> tuple[str, list[str]]:
    """Generate a response using RAG + LLM."""
    # 1. Retrieve context
    context, snippets = get_context(message, top_k=top_k)

    # 2. Build prompt with history
    history = conversation_history.get(session_id, [])

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}")
    ])

    chain = prompt | llm | StrOutputParser()

    # 3. Generate response
    response = await chain.ainvoke({
        "context": context,
        "history": history,
        "input": message
    })

    cleaned_response = normalize_reply(response)

    # 4. Update history
    history.append(HumanMessage(content=message))
    history.append(AIMessage(content=cleaned_response))

    # Keep only last N messages
    if len(history) > MAX_HISTORY * 2:
        history = history[-(MAX_HISTORY * 2):]
    conversation_history[session_id] = history
    session_last_seen[session_id] = time.time()

    return cleaned_response, snippets


# ─── API Endpoints ──────────────────────────────────────────────

import asyncio

@app.on_event("startup")
async def startup_event():
    print("🚀 App starting... Binding port immediately to pass Render health checks!")
    asyncio.create_task(asyncio.to_thread(init_components))


@app.get("/")
async def root():
    return {
        "status": "OK",
        "service": "WebSach AI Chatbot",
        "model": LLM_MODEL,
        "faiss_index": os.path.exists(FAISS_INDEX_PATH),
    }


@app.get("/health")
async def health():
    prune_expired_sessions()
    return {
        "status": "healthy",
        "model": LLM_MODEL,
        "llm_ready": llm is not None,
        "vectorstore_ready": vectorstore is not None,
        "active_sessions": len(conversation_history),
        "session_ttl_minutes": SESSION_TTL_MINUTES,
    }


@app.get("/sessions/stats")
async def session_stats():
    prune_expired_sessions()
    return {
        "active_sessions": len(conversation_history),
        "max_history_messages": MAX_HISTORY * 2,
        "session_ttl_minutes": SESSION_TTL_MINUTES,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập tin nhắn.")

    if llm is None:
        raise HTTPException(
            status_code=503,
            detail="Chatbot chưa sẵn sàng. Vui lòng kiểm tra mã Gemini API."
        )

    try:
        session_id = get_or_create_session(request.session_id)
        reply, sources = await generate_response(
            request.message.strip(),
            session_id,
            top_k=request.top_k,
        )
        return ChatResponse(
            reply=reply,
            session_id=session_id,
            sources=sources if request.return_sources else None,
        )
    except Exception as e:
        import traceback
        with open("error.log", "w", encoding="utf-8") as f:
            traceback.print_exc(file=f)
        print(f"❌ Chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
        )


@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history for a session."""
    if session_id in conversation_history:
        del conversation_history[session_id]
        session_last_seen.pop(session_id, None)
        return {"message": "Session cleared"}
    return {"message": "Session not found"}


# ─── Run ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    reload_enabled = os.getenv("CHATBOT_RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=CHATBOT_PORT, reload=reload_enabled)
