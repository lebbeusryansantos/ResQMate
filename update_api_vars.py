import os
import re

frontend_dir = r"c:\Users\Ryan\Desktop\ResQMate\frontend"

# Regex to find `const API_BASE_URL = ...` or `let API_BASE_URL = ...` at the start of lines
# We want to replace it with `var API_BASE_URL = ...` to prevent redeclaration errors

for root, _, files in os.walk(frontend_dir):
    for filename in files:
        if filename.endswith(".js"):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace const/let API_BASE_URL with var API_BASE_URL
            new_content = re.sub(r'^(const|let)\s+API_BASE_URL\s*=', 'var API_BASE_URL =', content, flags=re.MULTILINE)
            new_content = re.sub(r'^(const|let)\s+API_URL\s*=', 'var API_URL =', new_content, flags=re.MULTILINE)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

print("Done updating API_BASE_URL to var.")
