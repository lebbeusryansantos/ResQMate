// Core logic and operations for admin-requests
var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";
var API_URL = API_BASE_URL;

let requestsData = [];
let usersData = [];

document.addEventListener("DOMContentLoaded", () => {
    loadRequests();
    setupFilters();

    // Close view modal
    document.getElementById("closeViewModal")?.addEventListener("click", () => {
        document.getElementById("viewRequestModal").classList.remove("show");
    });
});

/* ===========================
   LOAD
=========================== */
async function loadRequests() {
    try {
        const [requestsRes, usersRes] = await Promise.all([
            fetch(`${API_URL}/requests/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}/users/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        requestsData = await requestsRes.json();
        usersData = await usersRes.json();

        if (!Array.isArray(requestsData)) requestsData = [];

        renderStatistics();
        renderRequestsTable();

    } catch (error) {
        console.error("Load Requests Error:", error);
    }
}

/* ===========================
   STATISTICS
=========================== */
// Handles renderStatistics logic and operations
function renderStatistics() {
    const total = requestsData.length;
    const pending = requestsData.filter(r => (r.status || "").toLowerCase() === "pending").length;
    const processing = requestsData.filter(r => (r.status || "").toLowerCase() === "processing").length;
    const completed = requestsData.filter(r => (r.status || "").toLowerCase() === "completed").length;

    document.getElementById("totalRequests").textContent = total;
    document.getElementById("pendingRequests").textContent = pending;
    document.getElementById("processingRequests").textContent = processing;
    document.getElementById("completedRequests").textContent = completed;
}

/* ===========================
   RENDER TABLE
=========================== */
// Handles renderRequestsTable logic and operations
function renderRequestsTable(data = requestsData) {

    const tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#9ca3af;">No data yet</td></tr>`;
        return;
    }

    data.forEach(request => {

        const status = (request.status || "pending").toLowerCase();
        const priority = (request.priority_level || "medium").toLowerCase();

        // Action buttons based on current status
        let actionBtns = `
            <button class="rq-btn-view" title="View Details"
                onclick="viewRequest(${request.request_id})">
                <i class="fa-solid fa-eye"></i>
            </button>`;

        if (status === "pending") {
            actionBtns += `
                <button class="rq-btn-approve" title="Move to Processing"
                    onclick="updateStatus(${request.request_id}, 'processing')">
                    <i class="fa-solid fa-check"></i> Process
                </button>
                <button class="rq-btn-reject" title="Reject Request"
                    onclick="rejectRequest(${request.request_id})">
                    <i class="fa-solid fa-xmark"></i> Reject
                </button>`;
        } else if (status === "processing") {
            actionBtns += `
                <button class="rq-btn-approve" title="Mark Completed"
                    onclick="updateStatus(${request.request_id}, 'completed')">
                    <i class="fa-solid fa-flag-checkered"></i> Complete
                </button>`;
        }

        tbody.innerHTML += `
            <tr data-status="${status}">
                <td><strong>#${request.request_id}</strong></td>
                <td>${request.full_name || "—"}</td>
                <td>${request.category_name || "—"}</td>
                <td>${request.location_name || "—"}</td>
                <td><span class="rq-badge rq-badge-${priority}">${priority.toUpperCase()}</span></td>
                <td><span class="rq-badge rq-badge-${status}">${request.status}</span></td>
                <td>${request.assigned_staff || "Not Assigned"}</td>
                <td style="white-space:nowrap;">${actionBtns}</td>
            </tr>
        `;
    });
}

/* ===========================
   UPDATE STATUS (process / complete)
=========================== */
window.updateStatus = async function (requestId, newStatus) {

    const label = newStatus === "processing" ? "move to Processing" : "mark as Completed";
    if (!confirm(`Are you sure you want to ${label} Request #${requestId}?`)) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const updatedBy = user ? user.user_id : 1;

    try {
        const res = await fetch(
            `${API_URL}/requests/${requestId}/status?status=${newStatus}&updated_by=${updatedBy}`,
            {
                method: "PUT", headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!res.ok) {
            const err = await res.json();
            alert(err.detail || "Update failed.");
            return;
        }

        showToast(`Request #${requestId} updated to "${newStatus}".`, true);
        loadRequests();

    } catch (error) {
        console.error(error);
        showToast("Failed to update. Is the backend running?", false);
    }
};

/* ===========================
   REJECT REQUEST
=========================== */
let currentRejectRequestId = null;

window.rejectRequest = function (requestId) {
    currentRejectRequestId = requestId;
    const modal = document.getElementById("rejectionModal");
    if(modal) {
        modal.classList.add("show");
        const form = document.getElementById("rejectionForm");
        if (form) form.reset();
        const otherContainer = document.getElementById("otherReasonContainer");
        if (otherContainer) otherContainer.style.display = "none";
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const rejectionSelect = document.getElementById("rejectionReasonSelect");
    const otherContainer = document.getElementById("otherReasonContainer");
    const otherInput = document.getElementById("otherRejectionReason");
    const rejectionForm = document.getElementById("rejectionForm");
    const closeBtn = document.getElementById("closeRejectionModal");
    const cancelBtn = document.getElementById("cancelRejectionBtn");
    const rejectionModal = document.getElementById("rejectionModal");

    if(rejectionSelect) {
        rejectionSelect.addEventListener("change", (e) => {
            if (e.target.value === "Others") {
                otherContainer.style.display = "block";
                otherInput.required = true;
            } else {
                otherContainer.style.display = "none";
                otherInput.required = false;
                otherInput.value = "";
            }
        });
    }

    const hideModal = () => {
        if(rejectionModal) rejectionModal.classList.remove("show");
    };

    if(closeBtn) closeBtn.addEventListener("click", hideModal);
    if(cancelBtn) cancelBtn.addEventListener("click", hideModal);

    if(rejectionForm) {
        rejectionForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentRejectRequestId) return;
            
            let reason = rejectionSelect.value;
            if (reason === "Others") {
                reason = otherInput.value.trim();
            }

            const user = JSON.parse(localStorage.getItem("user"));
            const updatedBy = user ? user.user_id : 1;

            try {
                const url = `${API_URL}/requests/${currentRejectRequestId}/status?status=rejected&updated_by=${updatedBy}`
                    + (reason ? `&rejection_reason=${encodeURIComponent(reason)}` : "");

                const res = await fetch(url, {
                    method: "PUT",
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(err.detail || "Reject failed.");
                    return;
                }

                showToast(`Request #${currentRejectRequestId} rejected.`, false);
                hideModal();
                loadRequests();

            } catch (error) {
                console.error(error);
                showToast("Failed to reject. Is the backend running?", false);
            }
        });
    }
});

/* ===========================
   VIEW MODAL
=========================== */
window.viewRequest = function (requestId) {

    const request = requestsData.find(r => r.request_id === requestId);
    if (!request) return;

    document.getElementById("modalRequestId").textContent = `#${request.request_id}`;
    document.getElementById("modalRequester").textContent = request.full_name || "—";
    document.getElementById("modalCategory").textContent = request.category_name || "—";
    document.getElementById("modalLocation").textContent = request.location_name || "—";
    document.getElementById("modalPriority").textContent = request.priority_level || "—";
    document.getElementById("modalStatus").textContent = request.status || "—";
    document.getElementById("modalDescription").textContent = request.request_details || "—";

    const rejectionRow = document.getElementById("rejectionReasonRow");
    if (request.status?.toLowerCase() === "rejected" && request.rejection_reason) {
        document.getElementById("modalRejectionReason").textContent = request.rejection_reason;
        rejectionRow.style.display = "flex";
    } else {
        rejectionRow.style.display = "none";
    }

    document.getElementById("viewRequestModal").classList.add("show");
};

/* ===========================
   FILTERS
=========================== */
// Handles setupFilters logic and operations
function setupFilters() {
    document.getElementById("requestSearch")?.addEventListener("input", filterRequests);
    document.getElementById("statusFilter")?.addEventListener("change", filterRequests);
    document.getElementById("provinceFilter")?.addEventListener("change", filterRequests);
    document.getElementById("cityFilter")?.addEventListener("change", filterRequests);
}

// Handles filterRequests logic and operations
function filterRequests() {
    const search = (document.getElementById("requestSearch")?.value || "").toLowerCase();
    const status = (document.getElementById("statusFilter")?.value || "all").toLowerCase();
    const province = (document.getElementById("provinceFilter")?.value || "all").toLowerCase();
    const city = (document.getElementById("cityFilter")?.value || "all").toLowerCase();

    const filtered = requestsData.filter(r => {
        const text = `${r.full_name} ${r.request_id} ${r.category_name}`.toLowerCase();
        const loc = (r.location_name || "").toLowerCase();
        const mSearch = text.includes(search);
        const mStatus = status === "all" || (r.status || "").toLowerCase() === status;
        const mProv = province === "all" || loc.includes(province);
        const mCity = city === "all" || loc.includes(city);
        return mSearch && mStatus && mProv && mCity;
    });

    renderRequestsTable(filtered);
}

/* ===========================
   TOAST
=========================== */
// Handles showToast logic and operations
function showToast(message, success = true) {
    let toast = document.getElementById("adminToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "adminToast";
        toast.style.cssText = `
            position:fixed;bottom:24px;right:24px;z-index:9999;
            padding:14px 20px;border-radius:10px;font-weight:600;
            font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.15);
            transition:opacity .3s;display:none;`;
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
