var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
/* ============================================================
   staff-requests.js — REFACTORED FLOW
   Staff only sees requests in "processing" or "completed"
   that have been assigned to them via a distribution.
   Their only action: Mark as Completed (delivered).
   Admin handles: Approve, Reject, Create Distribution.
   ============================================================ */

var API_URL = API_BASE_URL;

document.addEventListener("DOMContentLoaded", () => {

    loadRequests();

    document.getElementById("refreshBtn")
        ?.addEventListener("click", loadRequests);

    document.getElementById("searchBar")
        ?.addEventListener("input", filterRequests);

    document.getElementById("statusFilter")
        ?.addEventListener("change", filterRequests);

    // Close view modal on X or backdrop click
    document.getElementById("closeRequestModal")
        ?.addEventListener("click", () => {
            document.getElementById("requestModal").classList.remove("show");
        });

    document.getElementById("requestModal")
        ?.addEventListener("click", (e) => {
            if (e.target === document.getElementById("requestModal")) {
                document.getElementById("requestModal").classList.remove("show");
            }
        });
});


/* ============================================================
   LOAD — cross-references requests + distributions to show
   only requests assigned to this staff member
   ============================================================ */
async function loadRequests() {

    const tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4">Loading...</td></tr>`;

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

        if (!reqRes.ok || !distRes.ok) throw new Error("Failed to fetch data.");

        const allRequests = await reqRes.json();
        const allDistributions = await distRes.json();

        // Map: request_id → distribution
        const distMap = {};
        allDistributions.forEach(d => { distMap[d.request_id] = d; });

        // Only show requests that:
        // 1. Have a distribution assigned (admin created it)
        // 2. Are "processing" or "completed"
        // 3. Belong to this staff member (if logged in)
        let myRequests = allRequests.filter(r => {
            const status = (r.status || "").toLowerCase();
            const dist = distMap[r.request_id];
            if (!dist) return false;
            if (status !== "processing" && status !== "completed") return false;
            if (staffId) return dist.staff_id === staffId;
            return true;
        });

        // Attach distribution info for display
        myRequests = myRequests.map(r => ({
            ...r,
            distribution: distMap[r.request_id] || null
        }));

        renderTable(myRequests);
        updateCounts(myRequests);

    } catch (error) {
        console.error("Error loading requests:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-4">
                    Failed to load requests. Is the backend running?
                </td>
            </tr>`;
    }
}


/* ============================================================
   RENDER TABLE
   ============================================================ */
function renderTable(requests) {

    const tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = "";

    if (requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                    No requests assigned to you right now.
                </td>
            </tr>`;
        document.getElementById("emptyState").classList.remove("d-none");
        return;
    }

    document.getElementById("emptyState").classList.add("d-none");

    requests.forEach(r => {
        const status = (r.status || "processing").toLowerCase();
        const priority = (r.priority_level || "medium").toLowerCase();
        const date = r.date_requested
            ? new Date(r.date_requested).toLocaleDateString("en-PH")
            : "—";
        const resource = r.distribution
            ? `${r.distribution.resource_name} (×${r.distribution.quantity_given})`
            : "—";

        // Only "processing" requests can be marked completed
        const actionBtn = status === "processing"
            ? `<button class="rq-btn-approve" onclick="markCompleted(${r.request_id})">
                   <i class="fas fa-check me-1"></i> Mark Delivered
               </button>`
            : `<span style="color:#15803d; font-size:12px; font-weight:600;">
                   <i class="fas fa-check-circle me-1"></i>Delivered
               </span>`;

        tbody.innerHTML += `
            <tr data-status="${status}">
                <td class="fw-semibold">#${String(r.request_id).padStart(4, "0")}</td>
                <td>${r.full_name || "—"}</td>
                <td>${r.category_name || "—"}</td>
                <td>${r.location_name || "—"}</td>
                <td><span class="rq-badge rq-badge-${priority}">${priority.toUpperCase()}</span></td>
                <td>${resource}</td>
                <td><span class="rq-badge rq-badge-${status}">${r.status}</span></td>
                <td>${date}</td>
                <td>
                    <button class="rq-btn-view me-1" onclick="viewRequest(${r.request_id}, '${r.full_name || ""}', '${r.category_name || ""}', '${r.location_name || ""}', '${r.priority_level || ""}', '${r.status || ""}', '${r.date_requested || ""}')">View</button>
                    ${actionBtn}
                </td>
            </tr>`;
    });

    filterRequests();
}


/* ============================================================
   MARK AS COMPLETED
   ============================================================ */
async function markCompleted(requestId) {

    if (!confirm(`Mark Request #${String(requestId).padStart(4, "0")} as Completed?\n\nThis confirms you have delivered the assistance.`)) return;

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const updatedBy = user ? user.user_id : 1;

        const res = await fetch(
            `${API_URL}/requests/${requestId}/status?status=completed&updated_by=${updatedBy}`,
            {
                method: "PUT", headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!res.ok) throw new Error("Update failed");

        showToast(`Request #${String(requestId).padStart(4, "0")} marked as Completed.`, true);
        loadRequests();

    } catch (err) {
        console.error(err);
        showToast("Failed to update. Check if backend is running.", false);
    }
}


/* ============================================================
   VIEW REQUEST — uses data already loaded, no extra fetch needed
   (avoids the raw ID problem from single-request endpoint)
   ============================================================ */
function viewRequest(id, name, type, location, priority, status, date) {

    const statusClass = (status || "").toLowerCase();
    const formatted = date ? new Date(date).toLocaleDateString("en-PH") : "—";

    document.getElementById("customRequestDetailBody").innerHTML = `
        <table class="request-details-table">
            <tr><th>Request ID</th><td>#${String(id).padStart(4, "0")}</td></tr>
            <tr><th>Requester</th><td>${name || "—"}</td></tr>
            <tr><th>Type</th><td>${type || "—"}</td></tr>
            <tr><th>Location</th><td>${location || "—"}</td></tr>
            <tr><th>Priority</th><td>${priority || "—"}</td></tr>
            <tr><th>Status</th>
                <td><span class="rq-badge rq-badge-${statusClass}">${status || "—"}</span></td>
            </tr>
            <tr><th>Date Submitted</th><td>${formatted}</td></tr>
        </table>`;

    document.getElementById("requestModal").classList.add("show");
}


/* ============================================================
   UPDATE COUNTS
   ============================================================ */
function updateCounts(requests) {
    const processing = requests.filter(r => (r.status || "").toLowerCase() === "processing").length;
    const completed = requests.filter(r => (r.status || "").toLowerCase() === "completed").length;

    document.getElementById("countProcessing").textContent = processing;
    document.getElementById("countCompleted").textContent = completed;
    document.getElementById("countTotal").textContent = requests.length;
    document.getElementById("countPending").textContent = processing;
}


/* ============================================================
   FILTER
   ============================================================ */
function filterRequests() {
    const search = (document.getElementById("searchBar")?.value || "").toLowerCase();
    const status = (document.getElementById("statusFilter")?.value || "all").toLowerCase();
    const rows = document.querySelectorAll("#requestsTableBody tr");
    let visible = 0;

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const rowStatus = row.dataset.status || "";
        const matchSearch = text.includes(search);
        const matchStatus = status === "all" || rowStatus === status;

        if (matchSearch && matchStatus) {
            row.style.display = "";
            visible++;
        } else {
            row.style.display = "none";
        }
    });

    document.getElementById("emptyState")?.classList.toggle("d-none", visible > 0);
}


/* ============================================================
   TOAST — replaces alert()
   ============================================================ */
function showToast(message, success = true) {
    let toast = document.getElementById("staffToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "staffToast";
        toast.style.cssText = `
            position:fixed; bottom:24px; right:24px; z-index:9999;
            padding:14px 20px; border-radius:10px; font-weight:600;
            font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,.15);
            transition:opacity .3s; display:none;`;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = success ? "#dcfce7" : "#fee2e2";
    toast.style.color = success ? "#15803d" : "#991b1b";
    toast.style.opacity = "1";
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
    }, 3000);
}
