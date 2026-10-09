import os
import re

# 1. Patch HTML options
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
    pattern = re.compile(r'(<select[^>]*id="rowsPerPage"[^>]*>).*?(</select>)', re.DOTALL)
    new_content = pattern.sub(r'\1' + options_html + r'\2', content)
    with open(hf, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Patched HTML: {hf}")


# 2. Patch JS files itemsPerPage declaration and indicator string
js_files = [
    'frontend/js/admin-distributions.js', 
    'frontend/js/admin-resources.js'
]

for jf in js_files:
    if not os.path.exists(jf):
        continue
    with open(jf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change const/let itemsPerPage = X; to let itemsPerPage = 10;
    content = re.sub(r'(const|let)\s+itemsPerPage\s*=\s*\d+;', 'let itemsPerPage = 10;', content)
    
    # Change indicator text from Page X of Y to Showing A to B of C entries
    old_indicator_str = r'indicator\.textContent = `Page \$\{currentPage\} of \$\{totalPages\}`;'
    new_indicator_str = r'''
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, dataArray.length);
        const totalItems = dataArray.length;
        if (totalItems === 0) {
            indicator.textContent = `Showing 0 to 0 of 0 entries`;
        } else {
            indicator.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;
        }
    '''.strip()
    
    content = re.sub(old_indicator_str, new_indicator_str, content)
    
    with open(jf, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched itemsPerPage and indicator in {jf}")

# 3. Inject rowsPerPage listener in admin-distributions.js
f = 'frontend/js/admin-distributions.js'
if os.path.exists(f):
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
        
    listener = """
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        if (typeof updatePagination === "function") updatePagination();
    });
"""
    if 'document.getElementById("rowsPerPage")' not in content:
        # inject after nextPageBtn
        content = content.replace(
            'if (typeof updatePagination === "function") updatePagination();\n    });', 
            'if (typeof updatePagination === "function") updatePagination();\n    });' + listener
        )
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"Injected listener to {f}")

# 4. Inject rowsPerPage listener in admin-resources.js
# First we must refactor renderTable to support pagination
f = 'frontend/js/admin-resources.js'
if os.path.exists(f):
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    listener = """
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        if (typeof updatePagination === "function") updatePagination();
    });
"""
    if 'document.getElementById("rowsPerPage")' not in content:
        content = content.replace(
            'if (typeof updatePagination === "function") updatePagination();\n    });', 
            'if (typeof updatePagination === "function") updatePagination();\n    });' + listener
        )

    # Refactor renderTable
    if 'function renderTableDOM' not in content:
        content = content.replace(
            'function renderTable(resources) {', 
            'let currentData = [];\nfunction renderTable(resources) {\n    currentData = resources;\n    currentPage = 1;\n    setupPagination(currentData, renderTableDOM);\n}\nfunction updatePagination() {\n    setupPagination(currentData, renderTableDOM);\n}\n\nfunction renderTableDOM(resources) {'
        )
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f"Refactored renderTable and injected listener in {f}")

