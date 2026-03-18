"""
AI Chatbot FastAPI Server
Uses LangChain + Ollama + FAISS for RAG-based responses.
"""

import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from config import (
    OLLAMA_BASE_URL, OLLAMA_MODEL,
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

class ChatResponse(BaseModel):
    reply: str
    session_id: str

# ─── Global State ───────────────────────────────────────────────

# In-memory conversation history per session (limited to last N messages)
conversation_history: dict[str, list] = {}
MAX_HISTORY = 10

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

Thông tin ngữ cảnh từ cơ sở dữ liệu:
{context}
"""

# ─── Initialize Components ──────────────────────────────────────

def init_components():
    """Initialize LLM, embeddings, and vector store."""
    global llm, vectorstore, retriever

    print(f"🤖 Initializing Ollama LLM: {OLLAMA_MODEL} at {OLLAMA_BASE_URL}")
    llm = ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=0.3,
        num_predict=512,
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

def get_context(query: str) -> str:
    """Retrieve relevant context from ChromaDB."""
    if retriever is None:
        return "Không có dữ liệu ngữ cảnh. Hãy trả lời dựa trên kiến thức chung."
    
    try:
        docs = retriever.invoke(query)
        if docs:
            return "\n\n---\n\n".join([doc.page_content for doc in docs])
        return "Không tìm thấy thông tin liên quan trong cơ sở dữ liệu."
    except Exception as e:
        print(f"Retrieval error: {e}")
        return "Lỗi khi truy xuất dữ liệu."


def get_or_create_session(session_id: str | None) -> str:
    """Get existing session or create new one."""
    if session_id and session_id in conversation_history:
        return session_id
    new_id = session_id or str(uuid.uuid4())
    conversation_history[new_id] = []
    return new_id


async def generate_response(message: str, session_id: str) -> str:
    """Generate a response using RAG + LLM."""
    # 1. Retrieve context
    context = get_context(message)

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

    # 4. Update history
    history.append(HumanMessage(content=message))
    history.append(AIMessage(content=response))

    # Keep only last N messages
    if len(history) > MAX_HISTORY * 2:
        history = history[-(MAX_HISTORY * 2):]
    conversation_history[session_id] = history

    return response


# ─── API Endpoints ──────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    init_components()


@app.get("/")
async def root():
    return {
        "status": "OK",
        "service": "WebSach AI Chatbot",
        "model": OLLAMA_MODEL,
        "faiss_index": os.path.exists(FAISS_INDEX_PATH),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập tin nhắn.")

    if llm is None:
        raise HTTPException(
            status_code=503,
            detail="Chatbot chưa sẵn sàng. Vui lòng kiểm tra Ollama đang chạy."
        )

    try:
        session_id = get_or_create_session(request.session_id)
        reply = await generate_response(request.message.strip(), session_id)
        return ChatResponse(reply=reply, session_id=session_id)
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
        return {"message": "Session cleared"}
    return {"message": "Session not found"}


# ─── Run ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    reload_enabled = os.getenv("CHATBOT_RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=CHATBOT_PORT, reload=reload_enabled)
