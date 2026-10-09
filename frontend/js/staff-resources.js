var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
var API_URL = API_BASE_URL;

let resourcesData = [];
let currentPage = 1;
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

function updatePagination() {
    applyFilters();
}

document.addEventListener("DOMContentLoaded", () => {
    loadResources();

    document.getElementById("refreshBtn")?.addEventListener("click", loadResources);

    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });
    
    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        currentPage++;
        updatePagination();
    });

    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        applyFilters();
    });

    document.getElementById("searchBar")?.addEventListener("input", () => {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById("statusFilter")?.addEventListener("change", () => {
        currentPage = 1;
        applyFilters();
    });
});

async function loadResources() {
    try {
        const response = await fetch(`${API_URL}/resources/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error("Failed to load resources:", await response.text());
            return;
        }

        resourcesData = await response.json();
        updateStatistics(resourcesData);
        applyFilters();
    } catch (error) {
        console.error(error);
    }
}

function updateStatistics(resources) {
    let available = 0;
    let low = 0;
    let depleted = 0;

    resources.forEach(resource => {
        const quantity = parseInt(resource.quantity_available || resource.quantity) || 0;
        if (quantity === 0) depleted++;
        else if (quantity <= 20) low++;
        else available++;
    });

    const totalEl = document.getElementById("totalResources");
    const availEl = document.getElementById("availableResources");
    const lowEl = document.getElementById("lowStockResources");
    const depEl = document.getElementById("depletedResources");

    if(totalEl) totalEl.textContent = resources.length;
    if(availEl) availEl.textContent = available;
    if(lowEl) lowEl.textContent = low;
    if(depEl) depEl.textContent = depleted;
}

function applyFilters() {
    const searchValue = (document.getElementById("searchBar")?.value || "").toLowerCase();
    const categoryValue = (document.getElementById("statusFilter")?.value || "all").toLowerCase();

    const filtered = resourcesData.filter(r => {
        const matchesSearch = JSON.stringify(r).toLowerCase().includes(searchValue);
        const category = (r.category || r.category_name || "").toLowerCase();
        const matchesCategory = categoryValue === "all" || category === categoryValue;
        
        return matchesSearch && matchesCategory;
    });

    setupPagination(filtered, renderResourcesDOM);
}

function renderResourcesDOM(resources) {
    const tbody = document.getElementById("resourcesTableBody");
    const emptyState = document.getElementById("emptyState");

    tbody.innerHTML = "";

    if (resources.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center" style="text-align:center;padding:30px;color:#9ca3af;">No matching records found.</td></tr>`;
        if (emptyState) emptyState.style.display = "block";
        return;
    } else {
        if (emptyState) emptyState.style.display = "none";
    }

    resources.forEach(resource => {
        const quantity = parseInt(resource.quantity_available || resource.quantity) || 0;
        let status = "AVAILABLE";
        let badge = "rq-badge-active";

        if (quantity === 0) {
            status = "DEPLETED";
            badge = "rq-badge-inactive";
        } else if (quantity <= 20) {
            status = "LOW STOCK";
            badge = "rq-badge-medium";
        }

        tbody.innerHTML += `
            <tr>
                <td>#R${String(resource.resource_id).padStart(3, "0")}</td>
                <td>${resource.resource_name}</td>
                <td>${(resource.category || "-").toUpperCase()}</td>
                <td>${quantity}</td>
                <td><span class="rq-badge ${badge}">${status}</span></td>
            </tr>
        `;
    });
}
