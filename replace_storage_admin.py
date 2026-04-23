import os
import re

directories = [
    r"c:\Users\PC\Desktop\CNPM\admin\src"
]

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Replace getItem
    content = re.sub(
        r'localStorage\.getItem\([\'"]authToken[\'"]\)',
        r"(document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null)",
        content
    )

    # Replace setItem
    content = re.sub(
        r'localStorage\.setItem\([\'"]authToken[\'"]\s*,\s*([^)]+)\)',
        r'document.cookie = "authToken=" + (\1) + "; path=/; max-age=" + (7*24*60*60)',
        content
    )

    # Replace removeItem
    content = re.sub(
        r'localStorage\.removeItem\([\'"]authToken[\'"]\)',
        r'document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"',
        content
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.js'):
                replace_in_file(os.path.join(root, file))

print("Replacement complete.")
