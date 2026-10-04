import os
import re

js_dir = r"c:\Users\Ryan\Desktop\ResQMate\frontend\js"

# 1. Update existing empty state messages
def standardize_empty_messages(content):
    # Matches innerHTML assignments containing 'No ... yet' or 'No ... found'
    # and replaces the text content with 'No data yet'
    
    # regex to find typical empty state innerHTML strings
    pattern = r'(>)\s*No\s+[a-zA-Z\s]+(?:yet|found)\.?\s*(<)'
    new_content = re.sub(pattern, r'\g<1>No data yet\g<2>', content, flags=re.IGNORECASE)
    
    # Sometimes it's just 'No users found', etc without tags
    pattern2 = r'(=>\s*[\'"`])No\s+[a-zA-Z\s]+(?:yet|found)\.?([\'"`])'
    new_content = re.sub(pattern2, r'\g<1>No data yet\g<2>', new_content, flags=re.IGNORECASE)
    
    return new_content

# 2. Inject empty state checks where they are missing
def inject_missing_empty_states(content):
    # Look for: <container>.innerHTML = "";\s+<array>(.slice(x,y))?.forEach
    
    # We need to find places where `.innerHTML = ""` is followed immediately by `.forEach`
    # without an `if (<array>.length === 0)` check in between.
    
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # Check if line contains .innerHTML = "" or .innerHTML = ''
        if '.innerHTML = ""' in line or ".innerHTML = ''" in line:
            container_match = re.search(r'([a-zA-Z0-9_]+)\.innerHTML\s*=\s*["\']["\']', line)
            if container_match:
                container = container_match.group(1)
                
                # Look ahead up to 5 lines to see if there's a length check or forEach
                has_check = False
                array_name = None
                for j in range(1, 6):
                    if i + j >= len(lines):
                        break
                    lookahead = lines[i + j]
                    if 'length === 0' in lookahead or 'length == 0' in lookahead:
                        has_check = True
                        break
                    
                    # Match <array>.forEach or <array>.slice(...).forEach
                    foreach_match = re.search(r'([a-zA-Z0-9_]+)(?:\.slice\([^)]+\))?\.forEach', lookahead)
                    if foreach_match:
                        array_name = foreach_match.group(1)
                        break
                        
                if not has_check and array_name:
                    # Inject empty state check
                    indent = len(line) - len(line.lstrip())
                    spaces = " " * indent
                    
                    is_table_str = f'({container}.tagName === "TBODY" || {container}.tagName === "TABLE" || "{container}".toLowerCase().includes("table") || "{container}".toLowerCase().includes("body"))'
                    
                    injection = [
                        f"{spaces}if (!{array_name} || {array_name}.length === 0) {{",
                        f"{spaces}    if ({is_table_str}) {{",
                        f"{spaces}        {container}.innerHTML = `<tr><td colspan='100%' style='text-align:center;color:#9ca3af;padding:20px;'>No data yet</td></tr>`;",
                        f"{spaces}    }} else {{",
                        f"{spaces}        {container}.innerHTML = `<div style='text-align:center;color:#9ca3af;padding:20px;'>No data yet</div>`;",
                        f"{spaces}    }}",
                        f"{spaces}    return;",
                        f"{spaces}}}"
                    ]
                    new_lines.extend(injection)
        i += 1
    
    return '\n'.join(new_lines)

for root, _, files in os.walk(js_dir):
    for filename in files:
        if filename.endswith(".js"):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            updated_content = standardize_empty_messages(content)
            updated_content = inject_missing_empty_states(updated_content)
            
            if updated_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                print(f"Updated {filepath}")

print("Done.")
