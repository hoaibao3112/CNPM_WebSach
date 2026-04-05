import urllib.request
import json
import urllib.error

payload = {
    'message': 'Gợi ý cho tôi 3 sách kỹ năng bán chạy',
    'top_k': 6,
    'return_sources': True,
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/chat', data=data, headers={
    'Content-Type': 'application/json'
})

try:
    with urllib.request.urlopen(req) as response:
        body = json.loads(response.read().decode('utf-8'))
        print("Reply:", body.get('reply'))
        print("Session:", body.get('session_id'))
        sources = body.get('sources') or []
        print(f"Sources count: {len(sources)}")
        for idx, source in enumerate(sources[:3], start=1):
            preview = source.replace("\n", " ")[:180]
            print(f"  {idx}. {preview}...")
except urllib.error.HTTPError as e:
    print("HTTP Error", e.code)
    print("Response:", e.read().decode('utf-8'))
except Exception as e:
    print("Other Error:", e)
