import os
import re

html_files = [
    'frontend/staff/dashboard.html',
    'frontend/staff/distributions.html',
    'frontend/staff/requests.html',
    'frontend/staff/resources.html',
    'frontend/customer/requests.html'
]

select_html = """
          <select id="rowsPerPage" class="rq-input rows-filter" aria-label="Rows per page" style="max-width: 120px; margin-left: 10px; padding: 8px; border-radius: 6px; border: 1px solid #ddd;">
              <option value="10">10 Rows per page</option>
              <option value="25">25 Rows per page</option>
              <option value="50">50 Rows per page</option>
              <option value="100">100 Rows per page</option>
          </select>
"""

options_only_html = """
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

    # If it already has rowsPerPage, replace its options
    if 'id="rowsPerPage"' in content:
        pattern = re.compile(r'(<select[^>]*id="rowsPerPage"[^>]*>).*?(</select>)', re.DOTALL)
        content = pattern.sub(r'\1' + options_only_html + r'\2', content)
    else:
        # We need to inject it. Let's find a good place.
        # If toolbar-actions exists, inject it inside
        if '<div class="toolbar-actions"' in content:
            # Inject after the first </div> that closes search-box, or just right before closing toolbar-actions
            content = content.replace('</div>\n                    </div>\n                </div>', '</div>\n' + select_html + '                    </div>\n                </div>')
        elif 'class="search-box"' in content:
             content = content.replace('</div>\n                </div>\n\n                <!-- Message Box -->', '</div>\n' + select_html + '\n                </div>\n\n                <!-- Message Box -->')
        elif 'class="requests-table"' in content:
             # Just put it before the table responsive div
             content = content.replace('<div class="table-responsive">', '<div style="display:flex; justify-content:flex-end; margin-bottom: 10px;">' + select_html + '</div>\n<div class="table-responsive">')
        elif '<table' in content:
             content = content.replace('<div class="table-responsive">', '<div style="display:flex; justify-content:flex-end; margin-bottom: 10px;">' + select_html + '</div>\n<div class="table-responsive">')

    with open(hf, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched HTML: {hf}")


js_files = [
    'frontend/js/staff-dashboard.js',
    'frontend/js/staff-distributions.js',
    'frontend/js/staff-requests.js',
    'frontend/js/staff-resources.js',
    'frontend/js/customer-requests.js'
]

for jf in js_files:
    if not os.path.exists(jf):
        continue
    with open(jf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change itemsPerPage to let itemsPerPage = 10;
    if 'const itemsPerPage' in content or 'let itemsPerPage' in content:
        content = re.sub(r'(const|let)\s+itemsPerPage\s*=\s*\d+;', 'let itemsPerPage = 10;', content)
    else:
        # inject it if missing near currentPage
        content = re.sub(r'(let\s+currentPage\s*=\s*1;)', r'\1\nlet itemsPerPage = 10;', content)

    # Change indicator text
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

    # Some files use filteredRequestsData.length or similar directly if setupPagination is not generic. Let's fix that if needed.
    # For now, staff-dashboard doesn't have setupPagination. We'll ignore if indicator replace fails.

    # Inject rowsPerPage listener
    listener = """
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        if (typeof updatePagination === "function") updatePagination();
        else if (typeof filterRequests === "function") filterRequests();
    });
"""
    if 'document.getElementById("rowsPerPage")' not in content:
        # inject at DOMContentLoaded
        if 'document.addEventListener("DOMContentLoaded"' in content:
            content = content.replace(
                'document.addEventListener("DOMContentLoaded", () => {', 
                'document.addEventListener("DOMContentLoaded", () => {' + listener
            )
    
    with open(jf, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched JS: {jf}")
