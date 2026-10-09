import re

file_path = 'frontend/js/admin-requests.js'
try:
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        
    # Replace itemsPerPage
    content = content.replace("const itemsPerPage = 8;", "let itemsPerPage = 10;")
    
    # Replace setupTabsAndPagination
    old_setup = """function setupTabsAndPagination() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            tabBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentTab = e.target.getAttribute("data-tab");
            currentPage = 1;
            filterRequests();
        });
    });

    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });

    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredRequestsData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    });
}"""

    new_setup = """function setupTabsAndPagination() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            tabBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentTab = e.target.getAttribute("data-tab");
            currentPage = 1;
            filterRequests();
        });
    });

    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });

    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredRequestsData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    });
    
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        filterRequests();
    });
}"""

    content = content.replace(old_setup, new_setup)
    
    # Replace updatePagination
    old_update = """function updatePagination() {
    const totalPages = Math.ceil(filteredRequestsData.length / itemsPerPage) || 1;
    
    // Safety check
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const slicedData = filteredRequestsData.slice(startIdx, endIdx);

    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const indicator = document.getElementById("pageIndicator");

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        if (prevBtn.disabled) {
            prevBtn.classList.add("disabled-btn");
            prevBtn.style.cursor = "not-allowed";
        } else {
            prevBtn.classList.remove("disabled-btn");
            prevBtn.style.cursor = "pointer";
        }
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
        if (nextBtn.disabled) {
            nextBtn.classList.add("disabled-btn");
            nextBtn.style.cursor = "not-allowed";
        } else {
            nextBtn.classList.remove("disabled-btn");
            nextBtn.style.cursor = "pointer";
        }
    }

    if (indicator) {
        indicator.textContent = `Page ${currentPage} of ${totalPages} (${filteredRequestsData.length} items)`;
    }

    renderRequestsTable(slicedData);
}"""

    new_update = """function updatePagination() {
    const totalPages = Math.ceil(filteredRequestsData.length / itemsPerPage) || 1;
    
    // Safety check
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, filteredRequestsData.length);
    const slicedData = filteredRequestsData.slice(startIdx, endIdx);

    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const indicator = document.getElementById("pageIndicator");

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        if (prevBtn.disabled) {
            prevBtn.classList.add("disabled-btn");
            prevBtn.style.cursor = "not-allowed";
        } else {
            prevBtn.classList.remove("disabled-btn");
            prevBtn.style.cursor = "pointer";
        }
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages || filteredRequestsData.length === 0;
        if (nextBtn.disabled) {
            nextBtn.classList.add("disabled-btn");
            nextBtn.style.cursor = "not-allowed";
        } else {
            nextBtn.classList.remove("disabled-btn");
            nextBtn.style.cursor = "pointer";
        }
    }

    if (indicator) {
        if (filteredRequestsData.length === 0) {
            indicator.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            indicator.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${filteredRequestsData.length} entries`;
        }
    }

    renderRequestsTable(slicedData);
}"""

    content = content.replace(old_update, new_update)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)
        
    print("Patched admin-requests.js")
except Exception as e:
    print("Error:", e)
