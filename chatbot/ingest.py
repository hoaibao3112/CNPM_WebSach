"""
Data ingestion script for the AI Chatbot.
Reads FAQs, products, categories, and promotions from MySQL,
plus static knowledge docs, and stores them in FAISS.
"""

import os
import mysql.connector
import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from config import (
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
    FAISS_INDEX_PATH, EMBEDDING_MODEL, GEMINI_API_KEY
)


def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4"
    )


def load_faqs(cursor):
    """Load FAQ entries from database."""
    docs = []
    cursor.execute("SELECT question, answer, category FROM faqs")
    rows = cursor.fetchall()
    for q, a, cat in rows:
        text = f"Câu hỏi: {q}\nTrả lời: {a}\nDanh mục: {cat or 'Chung'}"
        docs.append(text)
    print(f"  ✅ Loaded {len(docs)} FAQs")
    return docs


def load_products(cursor):
    """Load product information from database."""
    docs = []
    cursor.execute("""
        SELECT sp.MaSP, sp.TenSP, sp.MoTa, sp.DonGia, sp.SoLuong,
               tl.TenTL, tg.TenTG
        FROM sanpham sp
        LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
        LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
        LIMIT 200
    """)
    rows = cursor.fetchall()
    for masp, ten, mota, gia, sl, theloai, tacgia in rows:
        price_str = f"{int(gia):,} VNĐ" if gia else "Liên hệ"
        stock_str = f"Còn {sl} cuốn" if sl and sl > 0 else "Hết hàng"
        text = (
            f"Sản phẩm: {ten}\n"
            f"Mã sản phẩm: {masp}\n"
            f"Giá: {price_str}\n"
            f"Thể loại: {theloai or 'Chưa phân loại'}\n"
            f"Tác giả: {tacgia or 'Không rõ'}\n"
            f"Tình trạng: {stock_str}\n"
            f"Mô tả: {mota or 'Không có mô tả'}"
        )
        docs.append(text)
    print(f"  ✅ Loaded {len(docs)} products")
    return docs


def load_categories(cursor):
    """Load category information."""
    docs = []
    cursor.execute("SELECT MaTL, TenTL FROM theloai")
    rows = cursor.fetchall()
    cats = [f"- {ten} (Mã: {ma})" for ma, ten in rows]
    if cats:
        text = "Danh sách thể loại sách có trong cửa hàng:\n" + "\n".join(cats)
        docs.append(text)
    print(f"  ✅ Loaded {len(rows)} categories")
    return docs


def load_promotions(cursor):
    """Load active promotions."""
    docs = []
    cursor.execute("""
        SELECT km.MaKM, km.TenKM, km.NgayBD, km.NgayKT, km.GiaTriGiam,
               km.LoaiGiamGia, km.TrangThai
        FROM khuyen_mai km
        WHERE km.TrangThai = 1
        LIMIT 20
    """)
    rows = cursor.fetchall()
    for makm, ten, ngaybd, ngaykt, giatri, loai, _ in rows:
        text = (
            f"Khuyến mãi: {ten}\n"
            f"Mã: {makm}\n"
            f"Giảm: {giatri}{'%' if loai == 'phan_tram' else ' VNĐ'}\n"
            f"Thời gian: {ngaybd} đến {ngaykt}"
        )
        docs.append(text)
    print(f"  ✅ Loaded {len(docs)} promotions")
    return docs


def load_static_docs():
    """Load static knowledge documents from files."""
    docs = []
    knowledge_dir = os.path.join(os.path.dirname(__file__), "knowledge_docs")

    def read_txt_file(filepath: str) -> str:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    def read_pdf_file(filepath: str) -> str:
        pdf = fitz.open(filepath)
        page_texts = []
        for page in pdf:
            text = page.get_text("text").strip()
            if text:
                page_texts.append(text)
        pdf.close()
        return "\n\n".join(page_texts)

    if os.path.exists(knowledge_dir):
        for filename in sorted(os.listdir(knowledge_dir)):
            filepath = os.path.join(knowledge_dir, filename)
            if not os.path.isfile(filepath):
                continue

            lower_name = filename.lower()
            try:
                if lower_name.endswith(".txt"):
                    content = read_txt_file(filepath)
                    if content.strip():
                        docs.append(f"Nguồn: {filename}\n\n{content}")
                        print(f"  ✅ Loaded TXT doc: {filename}")
                elif lower_name.endswith(".pdf"):
                    content = read_pdf_file(filepath)
                    if content.strip():
                        docs.append(f"Nguồn: {filename}\n\n{content}")
                        print(f"  ✅ Loaded PDF doc: {filename}")
            except Exception as e:
                print(f"  ⚠️ Could not load '{filename}': {e}")
    return docs


def main():
    print("🚀 Starting data ingestion for AI Chatbot...")
    print(f"   Database: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    print(f"   FAISS Index: {FAISS_INDEX_PATH}")
    print(f"   Embedding model: {EMBEDDING_MODEL}")
    print()

    # 1. Collect all documents
    all_docs = []

    # Load static docs
    print("📄 Loading static knowledge documents...")
    all_docs.extend(load_static_docs())

    # Load from database
    print("🗄️ Loading data from MySQL...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        all_docs.extend(load_faqs(cursor))
        all_docs.extend(load_products(cursor))
        all_docs.extend(load_categories(cursor))

        # Try loading promotions (table may not exist in some setups)
        try:
            all_docs.extend(load_promotions(cursor))
        except mysql.connector.Error as e:
            print(f"  ⚠️ Could not load promotions: {e}")

        cursor.close()
        conn.close()
    except mysql.connector.Error as e:
        print(f"❌ Database connection error: {e}")
        print("   Continuing with static docs only...")

    print(f"\n📊 Total documents collected: {len(all_docs)}")

    # 2. Split into chunks
    print("✂️ Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", "==", ". ", " "]
    )
    chunks = text_splitter.create_documents(all_docs)
    print(f"   Created {len(chunks)} chunks")

    # 3. Create embeddings and store in FAISS
    print("🧠 Creating embeddings and storing in FAISS...")

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    vectorstore = FAISS.from_documents(
        documents=chunks,
        embedding=embeddings
    )
    
    vectorstore.save_local(FAISS_INDEX_PATH)

    print(f"\n✅ Ingestion complete!")
    print(f"   Stored {len(chunks)} chunks in FAISS index at '{FAISS_INDEX_PATH}'")


if __name__ == "__main__":
    main()
