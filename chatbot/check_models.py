import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key or api_key.startswith("AQ."):
    print("❌ CẢNH BÁO: API Key của bạn có vẻ không đúng định dạng (nên bắt đầu bằng AIzaSy).")
    print(f"Key hiện tại: {api_key[:10]}...")

genai.configure(api_key=api_key)

print("🔍 Đang kiểm tra danh sách model khả dụng cho API Key này...")
try:
    found_any = False
    for m in genai.list_models():
        found_any = True
        status = "✅" if "generateContent" in m.supported_generation_methods else "📦"
        print(f"{status} Model: {m.name}")
        print(f"   - Phương thức hỗ trợ: {m.supported_generation_methods}")
        print("-" * 30)

    if not found_any:
        print("❌ Không tìm thấy model nào! Vui lòng kiểm tra lại API Key.")
except Exception as e:
    print(f"❌ Lỗi khi kết nối Google API: {e}")
    print("Vui lòng kiểm tra lại sự chính xác của API Key và kết nối mạng.")
