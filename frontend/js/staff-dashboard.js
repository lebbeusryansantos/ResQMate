var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
/* ============================================================
   staff-dashboard.js
   Loads live stats from the backend matching the correct flow:
   Staff only handles "Processing" → "Completed".
   ============================================================ */

var API_URL = API_BASE_URL;

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


document.addEventListener("DOMContentLoaded", () => {
    loadDashboardStats();
    loadRecentRequests();
});

async function loadDashboardStats() {

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user ? user.user_id : null;

        const [reqRes, distRes, resRes] = await Promise.all([
            fetch(`${API_URL}/requests/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}/distributions/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}/resources/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        const allRequests = await reqRes.json();
        const allDistributions = await distRes.json();
        const allResources = await resRes.json();

        // Build distribution map keyed by request_id
        const distMap = {};
        allDistributions.forEach(d => { distMap[d.request_id] = d; });

        // Requests assigned to this staff (processing or completed)
        const myRequests = allRequests.filter(r => {
            const status = (r.status || "").toLowerCase();
            const dist = distMap[r.request_id];
            if (!dist) return false;
            if (status !== "processing" && status !== "completed") return false;
            if (staffId) return dist.staff_id === staffId;
            return true;
        });

        const processing = myRequests.filter(r => r.status.toLowerCase() === "processing").length;
        const completed = myRequests.filter(r => r.status.toLowerCase() === "completed").length;

        document.getElementById("totalRequests").textContent = myRequests.length;
        document.getElementById("pendingRequests").textContent = processing;
        document.getElementById("completedDistributions").textContent = completed;
        document.getElementById("totalResources").textContent = allResources.length;

    } catch (err) {
        console.error("Dashboard stats failed:", err);
    }
}

async function loadRecentRequests() {

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user ? user.user_id : null;

        const [reqRes, distRes] = await Promise.all([
            fetch(`${API_URL}/requests/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}/distributions/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        const allRequests = await reqRes.json();
        const allDistributions = await distRes.json();

        const distMap = {};
        allDistributions.forEach(d => { distMap[d.request_id] = d; });

        const myRequests = allRequests.filter(r => {
            const status = (r.status || "").toLowerCase();
            const dist = distMap[r.request_id];
            if (!dist) return false;
            if (status !== "processing" && status !== "completed") return false;
            if (staffId) return dist.staff_id === staffId;
            return true;
        });

        const table = document.getElementById("recentRequestsTable");
        table.innerHTML = "";

        if (myRequests.length === 0) {
            table.innerHTML = `<tr><td colspan="12" class="text-center" style="text-align:center;padding:30px;color:#9ca3af;">No matching records found.</td></tr>`;
            return;
        }

        myRequests.slice(0, 5).forEach(r => {
            const status = (r.status || "pending").toLowerCase();
            const priority = (r.priority_level || "medium").toLowerCase();

            table.innerHTML += `
                <tr>
                    <td>#${String(r.request_id).padStart(4, "0")}</td>
                    <td>${r.full_name || "—"}</td>
                    <td><span class="rq-badge rq-badge-${priority}">${priority.toUpperCase()}</span></td>
                    <td><span class="rq-badge rq-badge-${status}">${r.status.replace(/_/g, ' ').toUpperCase()}</span></td>
                </tr>`;
        });

    } catch (err) {
        console.error("Recent requests failed:", err);
    }
}
