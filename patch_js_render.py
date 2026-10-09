import glob
import re

js_files = [
    'frontend/js/admin-distributions.js',
    'frontend/js/admin-resources.js',
    'frontend/js/admin-users.js',
    'frontend/js/customer-requests.js',
    'frontend/js/staff-distributions.js',
    'frontend/js/staff-requests.js',
    'frontend/js/staff-resources.js'
]

# Note: admin-requests.js already has its own updatePagination and slicing logic, so we skip modifying its renderTable wrapper
# except for the empty state which was already handled. Wait, admin-requests.js also needs its filter logic updated.

for f in js_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
    except FileNotFoundError:
        continue
    
    # Check if we already renamed it
    if 'function renderTableDOM(' not in content:
        # 1. Rename renderTable to renderTableDOM
        content = re.sub(r'function\s+renderTable\s*\(\s*data\s*\)\s*\{', 'function renderTableDOM(data) {', content)
        
        # 2. Inject the new wrapper
        wrapper = """
let currentData = [];
function renderTable(data) {
    currentData = data;
    currentPage = 1; // Reset to page 1 on new data/filter
    setupPagination(currentData, renderTableDOM);
}
function updatePagination() {
    setupPagination(currentData, renderTableDOM);
}
"""
        content = re.sub(r'function\s+renderTableDOM', wrapper + '\nfunction renderTableDOM', content)
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f'Patched render wrapper in {f}')
