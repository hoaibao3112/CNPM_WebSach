import os
import re

directories = [
    r"c:\Users\PC\Desktop\CNPM\GiaoDien\js",
    r"c:\Users\PC\Desktop\CNPM\admin\src"
]

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Replace getItem
    content = re.sub(
        r'localStorage\.getItem\([\'"]token[\'"]\)',
        r"(document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null)",
        content
    )

    # Replace setItem
    # Matches: localStorage.setItem('token', data.token) or localStorage.setItem("token", token)
    content = re.sub(
        r'localStorage\.setItem\([\'"]token[\'"]\s*,\s*([^)]+)\)',
        r'document.cookie = "token=" + (\1) + "; path=/; max-age=" + (7*24*60*60)',
        content
    )

    # Replace removeItem
    content = re.sub(
        r'localStorage\.removeItem\([\'"]token[\'"]\)',
        r'document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"',
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
