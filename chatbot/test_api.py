import urllib.request
import json
import urllib.error

data = json.dumps({'message': 'xin chào'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/chat', data=data, headers={
    'Content-Type': 'application/json'
})

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error", e.code)
    print("Response:", e.read().decode('utf-8'))
except Exception as e:
    print("Other Error:", e)
