import glob
import re

js_files = glob.glob('frontend/js/*.js')

new_pagination = """let currentPage = 1;
let itemsPerPage = 10;

function setupPagination(dataArray, renderCallback) {
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const indicator = document.getElementById("pageIndicator");
    
    const totalPages = Math.ceil(dataArray.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, dataArray.length);
    const slicedData = dataArray.slice(startIdx, endIdx);
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";
        if (currentPage === 1) prevBtn.classList.add("disabled-btn");
        else prevBtn.classList.remove("disabled-btn");
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages || dataArray.length === 0;
        nextBtn.style.cursor = nextBtn.disabled ? "not-allowed" : "pointer";
        if (nextBtn.disabled) nextBtn.classList.add("disabled-btn");
        else nextBtn.classList.remove("disabled-btn");
    }
    
    if (indicator) {
        if (dataArray.length === 0) {
            indicator.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            indicator.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${dataArray.length} entries`;
        }
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

    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        if (typeof applyFilters === "function") {
            applyFilters();
        } else if (typeof filterRequests === "function") {
            filterRequests();
        } else if (typeof filterDistributions === "function") {
            filterDistributions();
        } else if (typeof updatePagination === "function") {
            updatePagination();
        }
    });
});
"""

for f in js_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        if 'setupPagination' in content:
            # We also had `const itemsPerPage = 8;` or similar
            # Replace the old setupPagination block
            pattern = re.compile(r'let currentPage = 1;\s*(const|let) itemsPerPage = \d+;.*?document\.addEventListener\("DOMContentLoaded", \(\) => \{[^{}]*?updatePagination[^{}]*\}\);\s*', re.DOTALL)
            
            # If the pattern doesn't match perfectly, fallback to string replacement for just the function?
            new_content = pattern.sub(new_pagination, content, count=1)
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Patched JS pagination in {f}')
    except Exception as e:
        print(f"Error processing {f}: {e}")
