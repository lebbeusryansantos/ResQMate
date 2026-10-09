import glob
import re

js_files = [
    'frontend/js/admin-distributions.js',
    'frontend/js/admin-requests.js',
    'frontend/js/admin-resources.js',
    'frontend/js/admin-users.js',
    'frontend/js/customer-requests.js',
    'frontend/js/staff-distributions.js',
    'frontend/js/staff-requests.js',
    'frontend/js/staff-resources.js',
    'frontend/js/admin-dashboard.js',
    'frontend/js/staff-dashboard.js',
    'frontend/js/customer-dashboard.js'
]

pagination_code = """
let currentPage = 1;
const itemsPerPage = 8;

function setupPagination(dataArray, renderCallback) {
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const indicator = document.getElementById("pageIndicator");
    
    const totalPages = Math.ceil(dataArray.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const slicedData = dataArray.slice(startIdx, endIdx);
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";
        if (currentPage === 1) prevBtn.classList.add("disabled-btn");
        else prevBtn.classList.remove("disabled-btn");
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.style.cursor = currentPage === totalPages ? "not-allowed" : "pointer";
        if (currentPage === totalPages) nextBtn.classList.add("disabled-btn");
        else nextBtn.classList.remove("disabled-btn");
    }
    
    if (indicator) {
        indicator.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    renderCallback(slicedData);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            if (typeof updatePagination === "function") updatePagination();
        }
    });
    
    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        currentPage++;
        if (typeof updatePagination === "function") updatePagination();
    });
});
"""

for f in js_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
    except FileNotFoundError:
        continue

    # 1. Standardize itemsPerPage to 8
    if 'const itemsPerPage' in content:
        content = re.sub(r'const\s+itemsPerPage\s*=\s*\d+;', 'const itemsPerPage = 8;', content)
    elif 'itemsPerPage' not in content:
        # inject pagination generic logic at the top (after imports/consts)
        content = re.sub(r'(const API_BASE =.*?;|var API_URL =.*?;)', r'\1\n' + pagination_code, content)

    # 2. Empty state fixing
    empty_state_html = '<tr><td colspan="12" class="text-center" style="text-align:center;padding:30px;color:#9ca3af;">No matching records found.</td></tr>'
    content = re.sub(r'<tr><td colspan="\d+".*?>No data yet</td></tr>', empty_state_html, content)
    content = re.sub(r'<tr><td colspan="\d+".*?>No records found.*?</td></tr>', empty_state_html, content)
    content = re.sub(r'<tr><td colspan="\d+".*?>.*?No data.*?</td></tr>', empty_state_html, content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f'Patched {f}')
