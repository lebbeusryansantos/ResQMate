import os
import re

# 1. Patch HTML options
hf = 'frontend/admin/users.html'
options_html = """
              <option value="10">10 Rows per page</option>
              <option value="25">25 Rows per page</option>
              <option value="50">50 Rows per page</option>
              <option value="100">100 Rows per page</option>
"""
if os.path.exists(hf):
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = re.compile(r'(<select[^>]*id="rowsPerPage"[^>]*>).*?(</select>)', re.DOTALL)
    new_content = pattern.sub(r'\1' + options_html + r'\2', content)
    with open(hf, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Patched HTML: {hf}")

# 2. Patch JS files itemsPerPage declaration and indicator string
jf = 'frontend/js/admin-users.js'
if os.path.exists(jf):
    with open(jf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change const/let itemsPerPage = X; to let itemsPerPage = 10;
    content = re.sub(r'(const|let)\s+itemsPerPage\s*=\s*\d+;', 'let itemsPerPage = 10;', content)
    
    # Change indicator text from Page X of Y to Showing A to B of C entries
    old_indicator_str = r'indicator\.textContent = `Page \$\{currentPage\} of \$\{totalPages\}`;'
    new_indicator_str = """
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, dataArray.length);
        const totalItems = dataArray.length;
        if (totalItems === 0) {
            indicator.textContent = `Showing 0 to 0 of 0 entries`;
        } else {
            indicator.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;
        }
    """.strip()
    
    content = re.sub(old_indicator_str, new_indicator_str, content)
    
    # Inject rowsPerPage listener
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
    
    with open(jf, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched JS: {jf}")
