var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";
var API_URL = API_BASE_URL;

let requestsData = [];
let usersData = [];
let filteredRequestsData = [];
let currentTab = 'active';
let currentPage = 1;
const itemsPerPage = 20;

document.addEventListener("DOMContentLoaded", () => {
    loadRequests();
    setupFilters();
    setupTabsAndPagination();

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
        filterRequests();

    } catch (error) {
        console.error("Load Requests Error:", error);
    }
}

/* ===========================
   STATISTICS
=========================== */
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

        let actionBtns = `
            <button class="rq-btn-view" title="View Details"
                onclick="viewRequest(${request.request_id})">
                <i class="fa-solid fa-eye"></i> View Details
            </button>`;

        tbody.innerHTML += `
            <tr data-status="${status}">
                <td><strong>#${request.request_id}</strong></td>
                <td>${request.full_name || "—"}</td>
                <td>${request.calamity_type || request.category_name || "—"}</td>
                <td>${request.location_name || "—"}</td>
                <td><span class="rq-badge rq-badge-${priority}">${priority.toUpperCase()}</span></td>
                <td><span class="rq-badge rq-badge-${status}">${request.status.replace(/_/g, ' ').toUpperCase()}</span></td>
                <td>${request.assigned_staff || "Not Assigned"}</td>
                <td style="display: flex; gap: 5px; flex-wrap: wrap;">${actionBtns}</td>
            </tr>
        `;
    });
}

/* ===========================
   UPDATE STATUS (process / complete)
=========================== */
window.updateStatus = async function (requestId, newStatus, priority = null, feedback = null) {
    let confirmMsg = `Are you sure you want to update Request #${requestId}?`;
    if (newStatus === "processing") confirmMsg = `Are you sure you want to move Request #${requestId} to Processing?`;
    if (newStatus === "completed") confirmMsg = `Are you sure you want to mark Request #${requestId} as Completed?`;
    if (newStatus === "awaiting_confirmation") confirmMsg = `Are you sure you want to send Request #${requestId} for user confirmation?`;

    if (!confirm(confirmMsg)) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const updatedBy = user ? user.user_id : 1;

    try {
        let url = `${API_URL}/requests/${requestId}/status?status=${newStatus}&updated_by=${updatedBy}`;
        if (priority) url += `&priority_level=${encodeURIComponent(priority)}`;
        if (feedback) url += `&admin_feedback=${encodeURIComponent(feedback)}`;

        const res = await fetch(url, {
            method: "PUT", headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.detail || "Update failed.");
            return;
        }

        showToast(`Request #${requestId} updated successfully.`, true);
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
   DELETE REQUEST
=========================== */
let currentDeleteRequestId = null;

window.deleteRequest = function (requestId) {
    currentDeleteRequestId = requestId;
    const modal = document.getElementById("deleteModal");
    if(modal) {
        modal.classList.add("show");
        const form = document.getElementById("deleteForm");
        if (form) form.reset();
        const otherContainer = document.getElementById("otherDeleteReasonContainer");
        if (otherContainer) otherContainer.style.display = "none";
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const deleteSelect = document.getElementById("deleteReasonSelect");
    const otherContainer = document.getElementById("otherDeleteReasonContainer");
    const otherInput = document.getElementById("otherDeleteReason");
    const deleteForm = document.getElementById("deleteForm");
    const closeBtn = document.getElementById("closeDeleteModal");
    const cancelBtn = document.getElementById("cancelDeleteBtn");
    const deleteModal = document.getElementById("deleteModal");

    if(deleteSelect) {
        deleteSelect.addEventListener("change", (e) => {
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

    const hideDeleteModal = () => {
        if(deleteModal) deleteModal.classList.remove("show");
    };

    if(closeBtn) closeBtn.addEventListener("click", hideDeleteModal);
    if(cancelBtn) cancelBtn.addEventListener("click", hideDeleteModal);

    if(deleteForm) {
        deleteForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentDeleteRequestId) return;
            
            let reason = deleteSelect.value;
            if (reason === "Others") {
                reason = otherInput.value.trim();
            }

            try {
                // The reason can be logged by the backend if desired, but for now we just pass it or not
                const url = `${API_URL}/requests/${currentDeleteRequestId}`;

                const res = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(err.detail || "Delete failed.");
                    return;
                }

                showToast(`Request #${currentDeleteRequestId} deleted permanently.`, true);
                hideDeleteModal();
                loadRequests();

            } catch (error) {
                console.error(error);
                showToast("Failed to delete. Is the backend running?", false);
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
    const prioritySpan = document.getElementById("modalPriority");
    const prioritySelect = document.getElementById("modalPriorityEdit");
    const adminFeedbackRow = document.getElementById("adminFeedbackRow");
    const adminFeedbackTextarea = document.getElementById("adminFeedback");

    document.getElementById("modalStatus").textContent = request.status || "—";
    document.getElementById("modalDescription").textContent = request.request_details || "—";

    const rejectionRow = document.getElementById("rejectionReasonRow");
    if (request.status?.toLowerCase() === "rejected" && request.rejection_reason) {
        document.getElementById("modalRejectionReason").textContent = request.rejection_reason;
        rejectionRow.style.display = "flex";
    } else {
        rejectionRow.style.display = "none";
    }
    
    const actionContainer = document.getElementById("modalActionContainer");
    const status = (request.status || "pending").toLowerCase();
    
    if (status === "pending") {
        prioritySpan.style.display = "none";
        if (prioritySelect) {
            prioritySelect.style.display = "block";
            prioritySelect.value = (request.priority_level || "medium").toLowerCase();
        }
        if (adminFeedbackRow) {
            adminFeedbackRow.classList.remove("d-none");
            adminFeedbackRow.style.display = "flex";
            adminFeedbackTextarea.value = "";
        }
    } else {
        prioritySpan.style.display = "block";
        if (prioritySelect) prioritySelect.style.display = "none";
        if (adminFeedbackRow) {
            adminFeedbackRow.style.display = "none";
            adminFeedbackRow.classList.add("d-none");
        }
    }

    const userFeedbackRow = document.getElementById("userFeedbackRow");
    if (status === "completed" && (request.user_feedback || request.feedback_rating)) {
        if (userFeedbackRow) {
            userFeedbackRow.classList.remove("d-none");
            userFeedbackRow.style.display = "flex";
            userFeedbackRow.style.flexDirection = "column";
            userFeedbackRow.style.alignItems = "flex-start";
            document.getElementById("modalFeedbackRating").textContent = request.feedback_rating ? `${request.feedback_rating} / 5` : "N/A";
            document.getElementById("modalUserFeedback").textContent = request.user_feedback || "No comments provided.";
        }
    } else {
        if (userFeedbackRow) {
            userFeedbackRow.classList.add("d-none");
            userFeedbackRow.style.display = "none";
        }
    }

    const renderActions = () => {
        if (!actionContainer) return;
        actionContainer.innerHTML = "";
        
        if (status === "pending") {
            const currentSelectedPriority = prioritySelect ? prioritySelect.value : request.priority_level;
            const originalPriority = (request.priority_level || "medium").toLowerCase();
            const isPriorityChanged = currentSelectedPriority !== originalPriority;

            if (isPriorityChanged) {
                actionContainer.innerHTML += `
                    <button class="rq-btn-approve" onclick="updateStatus(${request.request_id}, 'awaiting_confirmation', document.getElementById('modalPriorityEdit').value, document.getElementById('adminFeedback').value); document.getElementById('closeViewModal').click();">
                        <i class="fa-solid fa-paper-plane"></i> Send for User Confirmation
                    </button>
                    <button class="rq-btn-reject" onclick="rejectRequest(${request.request_id}); document.getElementById('closeViewModal').click();">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                `;
            } else {
                actionContainer.innerHTML += `
                    <button class="rq-btn-approve" onclick="updateStatus(${request.request_id}, 'processing'); document.getElementById('closeViewModal').click();">
                        <i class="fa-solid fa-check"></i> Process
                    </button>
                    <button class="rq-btn-reject" onclick="rejectRequest(${request.request_id}); document.getElementById('closeViewModal').click();">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                `;
            }
        } else if (status === "processing") {
            actionContainer.innerHTML += `
                <button class="rq-btn-approve" onclick="updateStatus(${request.request_id}, 'completed'); document.getElementById('closeViewModal').click();">
                    <i class="fa-solid fa-flag-checkered"></i> Complete
                </button>
            `;
        }
        
        if (status === "rejected" || status === "completed") {
            actionContainer.innerHTML += `
                <button class="rq-btn-reject" style="background-color: #dc3545; color: white;" onclick="deleteRequest(${request.request_id}); document.getElementById('closeViewModal').click();">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            `;
        }
    };

    renderActions();

    if (prioritySelect) {
        prioritySelect.onchange = () => {
            renderActions();
        };
    }

    document.getElementById("viewRequestModal").classList.add("show");
};

/* ===========================
   FILTERS
=========================== */
function setupFilters() {
    document.getElementById("requestSearch")?.addEventListener("input", () => { currentPage = 1; filterRequests(); });
    document.getElementById("statusFilter")?.addEventListener("change", () => { currentPage = 1; filterRequests(); });
    document.getElementById("provinceFilter")?.addEventListener("change", () => { currentPage = 1; filterRequests(); });
    document.getElementById("cityFilter")?.addEventListener("change", () => { currentPage = 1; filterRequests(); });
    document.getElementById("calamityFilter")?.addEventListener("change", () => { currentPage = 1; filterRequests(); });
    document.getElementById("timeFilter")?.addEventListener("change", () => { currentPage = 1; filterRequests(); });
}

function setupTabsAndPagination() {
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
}

function filterRequests() {
    const search = (document.getElementById("requestSearch")?.value || "").toLowerCase();
    const status = (document.getElementById("statusFilter")?.value || "all").toLowerCase();
    const province = (document.getElementById("provinceFilter")?.value || "all").toLowerCase();
    const city = (document.getElementById("cityFilter")?.value || "all").toLowerCase();
    const calamity = (document.getElementById("calamityFilter")?.value || "all").toLowerCase();
    const timeFilter = (document.getElementById("timeFilter")?.value || "all");

    const now = new Date();

    filteredRequestsData = requestsData.filter(r => {
        // Tab filtering
        const isCompleted = (r.status || "").toLowerCase() === "completed";
        if (currentTab === 'completed' && !isCompleted) return false;
        if (currentTab === 'active' && isCompleted) return false;

        const text = `${r.full_name} ${r.request_id} ${r.category_name} ${r.calamity_type || ''}`.toLowerCase();
        const loc = (r.location_name || "").toLowerCase();
        const mSearch = text.includes(search);
        const mStatus = status === "all" || (r.status || "").toLowerCase() === status;
        const mProv = province === "all" || loc.includes(province);
        const mCity = city === "all" || loc.includes(city);
        
        const rCalamity = (r.calamity_type || r.category_name || "").toLowerCase();
        const mCalamity = calamity === "all" || rCalamity.includes(calamity);

        let mTime = true;
        if (timeFilter !== "all" && r.date_requested) {
            const reqDate = new Date(r.date_requested);
            const diffTime = Math.abs(now - reqDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (timeFilter === "past_week" && diffDays > 7) mTime = false;
            if (timeFilter === "past_month" && diffDays > 30) mTime = false;
            if (timeFilter === "past_year" && diffDays > 365) mTime = false;
        }

        return mSearch && mStatus && mProv && mCity && mCalamity && mTime;
    });

    updatePagination();
}

function updatePagination() {
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
}

/* ===========================
   TOAST
=========================== */
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
