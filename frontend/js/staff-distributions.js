var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
/* ============================================================
   staff-distributions.js  — READ ONLY for staff
   Per the defined flow, only Admin creates distributions.
   Staff only views what has been assigned to them.
   The "New Distribution" button has been removed from the HTML.
   ============================================================ */

var API_URL = API_BASE_URL;

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
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, dataArray.length);
        const totalItems = dataArray.length;
        if (totalItems === 0) {
            indicator.textContent = `Showing 0 to 0 of 0 entries`;
        } else {
            indicator.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;
        }
    }
    
    renderCallback(slicedData);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        if (typeof updatePagination === "function") updatePagination();
        else if (typeof filterRequests === "function") filterRequests();
    });

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


document.addEventListener("DOMContentLoaded", () => {
    loadDistributions();

    document.getElementById("searchInput")
        ?.addEventListener("keyup", filterDistributions);
});

async function loadDistributions() {

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user ? user.user_id : null;

        const response = await fetch(`${API_URL}/distributions/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Failed to fetch distributions.");

        let distributions = await response.json();

        // If staff is logged in, only show their own assigned distributions
        if (staffId) {
            distributions = distributions.filter(d => d.staff_id === staffId);
        }

        renderDistributions(distributions);

    } catch (error) {
        console.error(error);
        showMessage("Failed to load distributions. Is the backend running?", false);
    }
}

let currentData = [];
function renderDistributions(distributions) {
    currentData = distributions;
    currentPage = 1;
    setupPagination(currentData, renderDistributionsDOM);
}

function updatePagination() {
    setupPagination(currentData, renderDistributionsDOM);
}

function renderDistributionsDOM(distributions) {

    const table = document.getElementById("distributionTableBody");
    table.innerHTML = "";

    if (distributions.length === 0) {
        table.innerHTML = `<tr><td colspan="12" class="text-center" style="text-align:center;padding:30px;color:#9ca3af;">No matching records found.</td></tr>`;
        return;
    }

    distributions.forEach(d => {
        const date = d.distribution_date
            ? new Date(d.distribution_date).toLocaleDateString("en-PH")
            : "—";

        table.innerHTML += `
            <tr>
                <td>${d.distribution_id}</td>
                <td>#${String(d.request_id).padStart(4, "0")}</td>
                <td>${d.resource_name || "—"}</td>
                <td>${d.staff_name || "—"}</td>
                <td>${d.quantity_given}</td>
                <td>${date}</td>
            </tr>`;
    });
}

function filterDistributions() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const filtered = allDistributions.filter(d => JSON.stringify(d).toLowerCase().includes(search));
    renderDistributions(filtered);
}
document.getElementById("searchInput")?.addEventListener("input", filterDistributions);

function showMessage(message, success) {
    const box = document.getElementById("messageBox");
    if (!box) return;
    box.textContent = message;
    box.className = success ? "success-message" : "error-message";
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 3000);
}
