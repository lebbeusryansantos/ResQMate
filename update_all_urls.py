import os
import re

directory = r'c:\Users\Ryan\Desktop\ResQMate\frontend'

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.js'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            orig_content = content
            
            # The buggy definition:
            buggy_def = 'const API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? `${API_BASE_URL}` : "https://res-q-mate-ten.vercel.app";'
            correct_def = 'const API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://res-q-mate-ten.vercel.app";'
            
            content = content.replace(buggy_def, correct_def)
            
            if content != orig_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
