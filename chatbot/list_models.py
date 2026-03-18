import subprocess

try:
    result = subprocess.check_output(['ollama', 'list']).decode('utf-8')
    with open('models_utf8.txt', 'w', encoding='utf-8') as f:
        f.write(result)
except Exception as e:
    print(f"Error: {e}")
