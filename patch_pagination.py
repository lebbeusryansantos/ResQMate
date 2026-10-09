import os
import re

html_files = [
    'frontend/admin/requests.html', 
    'frontend/admin/distributions.html', 
    'frontend/admin/resources.html',
    'frontend/admin/admin-logs.html'
]

options_html = """
              <option value="10">10 Rows per page</option>
              <option value="25">25 Rows per page</option>
              <option value="50">50 Rows per page</option>
              <option value="100">100 Rows per page</option>
"""

for hf in html_files:
    if not os.path.exists(hf):
        continue
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to replace <select id="rowsPerPage"...> options
    # Find the select tag and everything up to </select>
    pattern = re.compile(r'(<select[^>]*id="rowsPerPage"[^>]*>).*?(</select>)', re.DOTALL)
    new_content = pattern.sub(r'\1' + options_html + r'\2', content)
    
    with open(hf, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Patched {hf}")

# Now patch JS files
js_files = [
    'frontend/js/admin-requests.js', 
    'frontend/js/admin-distributions.js', 
    'frontend/js/admin-resources.js',
    'frontend/js/admin-logs.js'
]

for jf in js_files:
    if not os.path.exists(jf):
        continue
    with open(jf, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    
    # 1. replace const itemsPerPage = X with let itemsPerPage = 10;
    for i, line in enumerate(lines):
        if re.search(r'const\s+itemsPerPage\s*=\s*\d+;', line):
            line = re.sub(r'const\s+itemsPerPage\s*=\s*\d+;', 'let itemsPerPage = 10;', line)
        if re.search(r'let\s+itemsPerPage\s*=\s*\d+;', line):
            line = re.sub(r'let\s+itemsPerPage\s*=\s*\d+;', 'let itemsPerPage = 10;', line)
        new_lines.append(line)
        
    content = "".join(new_lines)
    
    with open(jf, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched itemsPerPage in {jf}")
