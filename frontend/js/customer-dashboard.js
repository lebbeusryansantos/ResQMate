
let allRequests = [];
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

function filterRequests() {
    const searchVal = document.getElementById("searchRequests") ? document.getElementById("searchRequests").value.toLowerCase() : "";
    const statusVal = document.getElementById("statusFilter") ? document.getElementById("statusFilter").value : "all";
    
    let filtered = allRequests.filter(req => {
        const idMatch = String(req.request_id).toLowerCase().includes(searchVal);
        let type = "Other";
        if (req.category_id == 1) type = "Food";
        else if (req.category_id == 2) type = "Water";
        else if (req.category_id == 3) type = "Shelter";
        else if (req.category_id == 4) type = "Medicine";
        
        const typeMatch = type.toLowerCase().includes(searchVal);
        const matchesSearch = idMatch || typeMatch;
        
        const reqStatus = (req.status || "pending").toLowerCase();
        const matchesStatus = (statusVal === "all") || (reqStatus === statusVal);
        
        return matchesSearch && matchesStatus;
    });
    
    setupPagination(filtered, renderRecentRequests);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        filterRequests();
    });

    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            filterRequests();
        }
    });
    
    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        currentPage++;
        filterRequests();
    });
    
    document.getElementById("searchRequests")?.addEventListener("input", () => {
        currentPage = 1;
        filterRequests();
    });
    
    document.getElementById("statusFilter")?.addEventListener("change", () => {
        currentPage = 1;
        filterRequests();
    });
});

var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);

function getAuthHeaders() {
    const userData = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    return {
        "Authorization": `Bearer ${userData.token || ""}`,
        "Content-Type": "application/json"
    };
}

async function loadDashboard() {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );

    if (!user) {

        window.location.href =
            "../landingpage.html";

        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/requests/user/${user.user_id}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load requests.");
        }

        const requests = await response.json();
        allRequests = requests;
        loadStats(requests);
        filterRequests();

    }
    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );
    }
}

function loadStats(requests) {

    const pending =
        requests.filter(
            r =>
                r.status &&
                r.status.toLowerCase() ===
                "pending"
        ).length;

    const processing =
        requests.filter(
            r =>
                r.status &&
                r.status.toLowerCase() === "processing"
        ).length;

    const completed =
        requests.filter(
            r =>
                r.status &&
                r.status.toLowerCase() ===
                "completed"
        ).length;

    const rejected =
        requests.filter(
            r =>
                r.status &&
                r.status.toLowerCase() ===
                "rejected"
        ).length;

    const cancelled =
        requests.filter(
            r =>
                r.status &&
                r.status.toLowerCase() ===
                "cancelled"
        ).length;

    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("processingCount").textContent = processing;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("rejectedCount").textContent = rejected;
    document.getElementById("cancelledCount").textContent = cancelled;
}

function renderRecentRequests(requests) {

    const tableBody =
        document.getElementById(
            "recentRequestsBody"
        );

    tableBody.innerHTML = "";

    if (!requests || requests.length === 0) {
        tableBody.innerHTML = `<tr><td colspan='100%' style='text-align:center;color:#9ca3af;padding:20px;'>No data yet</td></tr>`;
        return;
    }

    requests.forEach(request => {

            let type = "Other";
            if (request.category_id == 1) {
                type = "Food";
            }
            else if (request.category_id == 2) {
                type = "Water";
            }
            else if (request.category_id == 3) {
                type = "Shelter";
            }
            else if (request.category_id == 4) {
                type = "Medicine";
            }
            else if (request.category_id == 5) {
                type = "Other";
            }

            let status = request.status ? request.status.toLowerCase() : "pending";

            let statusText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (status === "cancelled") statusText = "Cancelled by User";
            if (status === "rejected") statusText = "Rejected by Admin";

            const date =
                request.date_requested
                    ? new Date(
                        request.date_requested
                    ).toLocaleDateString(
                        "en-US",
                        {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        }
                    )
                    : "";

            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = request.request_id;

            const tdType = document.createElement("td");
            tdType.textContent = type;

            const tdStatus = document.createElement("td");
            const spanStatus = document.createElement("span");
            spanStatus.className = `status-badge ${status}`;
            spanStatus.textContent = statusText;
            tdStatus.appendChild(spanStatus);

            const tdDate = document.createElement("td");
            tdDate.textContent = date;

            tr.appendChild(tdId);
            tr.appendChild(tdType);
            tr.appendChild(tdStatus);
            tr.appendChild(tdDate);

            tableBody.appendChild(tr);
        });
}