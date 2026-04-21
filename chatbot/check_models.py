import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key or api_key.startswith("AQ."):
    print("❌ CẢNH BÁO: API Key của bạn có vẻ không đúng định dạng (nên bắt đầu bằng AIzaSy).")
    print(f"Key hiện tại: {api_key[:10]}...")

genai.configure(api_key=api_key)

print("🔍 Đang kiểm tra danh sách model khả dụng...")
try:
    models = genai.list_models()
    found = False
    for m in models:
        if 'embedContent' in m.supported_generation_methods:
            print(f"✅ Model Embedding tìm thấy: {m.name}")
            found = True
    if not found:
        print("❌ Không tìm thấy model embedding nào cho Key này.")
except Exception as e:
    print(f"❌ Lỗi khi kết nối Google API: {e}")
    print("Vui lòng kiểm tra lại sự chính xác của API Key và kết nối mạng.")
