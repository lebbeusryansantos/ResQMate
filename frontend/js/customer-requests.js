var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

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


function getAuthHeaders() {
    const userData = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    return {
        "Authorization": `Bearer ${userData.token || ""}`,
        "Content-Type": "application/json"
    };
}

document.addEventListener("DOMContentLoaded", async () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
        alert("You are not logged in. Please log in first.");
        window.location.href = "../index.html";
        return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role === "superadmin") { window.location.href = "../superadmin/superadmin-logs.html"; return; }
    if (parsedUser.role === "admin") { window.location.href = "../admin/dashboard.html"; return; }
    if (parsedUser.role === "staff") { window.location.href = "../staff/dashboard.html"; return; }


    let user;

    try {
        user = JSON.parse(storedUser);
        console.log("USER:", user);
        console.log("TOKEN:", user.token);
    } catch (error) {
        alert("Invalid user information. Please log in again.");
        return;
    }

    if (!user.user_id) {
        alert("User ID was not found. Please log in again.");
        return;
    }

    const tbody = document.querySelector(".requests-table tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; color: #718096; padding: 20px;">
                Loading your requests...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_URL}/requests/user/${user.user_id}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch requests.");
        }

        const requests = await response.json();

        tbody.innerHTML = "";

        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #718096; padding: 20px;">No data yet</td>
                </tr>
            `;
            return;
        }

        requests.forEach(req => {
            const row = document.createElement("tr");

            const typeText = req.category_name || "Other";

            let status = req.status ? req.status.toLowerCase() : "pending";

            let statusFormatted = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (status === "cancelled") statusFormatted = "Cancelled by User";
            if (status === "rejected") statusFormatted = "Rejected by Admin";
            if (status === "awaiting_confirmation") statusFormatted = "Requires Action";

            const dateFormatted = req.date_requested
                ? new Date(req.date_requested).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                })
                : "";

            let actionHTML = "";

            const followedUpRequests = JSON.parse(localStorage.getItem("followedUpRequests") || "[]");
            const isFollowedUp = followedUpRequests.includes(String(req.request_id));

            if (status === "pending") {
                if (isFollowedUp) {
                    actionHTML = `
                        <button 
                            class="follow-up-button"
                            disabled
                            style="background-color: #9ca3af; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: not-allowed;"
                            data-request-id="${req.request_id}">
                            Followed Up
                        </button>
                        <button 
                            class="view-request-button"
                            style="background-color: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;"
                            onclick="openCancelModal(${req.request_id})">
                            Cancel
                        </button>
                        <button 
                            class="view-request-button"
                            style="background-color: #6b7280; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;"
                            onclick="viewRequest(${req.request_id})">
                            View
                        </button>
                    `;
                } else {
                    actionHTML = `
                        <button 
                            class="follow-up-button"
                            style="background-color: #3b82f6; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;"
                            data-request-id="${req.request_id}">
                            Follow Up
                        </button>
                        <button 
                            class="view-request-button"
                            style="background-color: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;"
                            onclick="openCancelModal(${req.request_id})">
                            Cancel
                        </button>
                        <button 
                            class="view-request-button"
                            style="background-color: #6b7280; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;"
                            onclick="viewRequest(${req.request_id})">
                            View
                        </button>
                    `;
                }
            } else {
                actionHTML = `
                    <button 
                        class="view-request-button"
                        style="background-color: #6b7280; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;"
                        onclick="viewRequest(${req.request_id})">
                        View
                    </button>
                `;
            }

            const tdId = document.createElement("td");
            tdId.className = "req-id";
            tdId.textContent = req.request_id;

            const tdType = document.createElement("td");
            tdType.textContent = typeText;

            const tdStatus = document.createElement("td");
            const statusSpan = document.createElement("span");
            statusSpan.className = `status-badge ${status}`;
            statusSpan.textContent = statusFormatted;
            tdStatus.appendChild(statusSpan);

            const tdDate = document.createElement("td");
            tdDate.textContent = dateFormatted;

            const tdAction = document.createElement("td");
            tdAction.innerHTML = actionHTML; // actionHTML is hardcoded/safe

            row.appendChild(tdId);
            row.appendChild(tdType);
            row.appendChild(tdStatus);
            row.appendChild(tdDate);
            row.appendChild(tdAction);

            tbody.appendChild(row);
        });

        document.querySelectorAll(".follow-up-button").forEach(button => {
            button.addEventListener("click", () => {
                // If it's already disabled, do nothing
                if (button.disabled) return;

                const requestId = button.dataset.requestId;

                alert(
                    `Follow-up request sent for Request #${requestId}.`
                );

                // Save to localStorage so it survives refresh
                const followedUpRequests = JSON.parse(localStorage.getItem("followedUpRequests") || "[]");
                if (!followedUpRequests.includes(String(requestId))) {
                    followedUpRequests.push(String(requestId));
                    localStorage.setItem("followedUpRequests", JSON.stringify(followedUpRequests));
                }

                // Disable the button after clicking
                button.disabled = true;
                button.style.backgroundColor = '#9ca3af'; // gray out
                button.style.cursor = 'not-allowed';
                button.textContent = "Followed Up";
            });
        });

    } catch (error) {
        console.error("Error fetching user requests:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan=5" style="text-align: center; color: #ef4444; padding: 20px;">
                    Error loading requests. Please try again later.
                </td>
            </tr>
        `;
    }
});

let customerRequestsData = [];

async function viewRequest(requestId) {
    try {
        const response = await fetch(
            `${API_URL}/requests/${requestId}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch request details");
        }

        const request = await response.json();

        document.getElementById(
            "modalRequestIdBadge"
        ).textContent = `Request ID #${request.request_id}`;

        document.getElementById(
            "modalCategory"
        ).textContent = request.category_name || "Other";

        document.getElementById(
            "modalBarangay"
        ).textContent = request.barangay || "-";

        document.getElementById(
            "modalCity"
        ).textContent = request.city || "-";

        document.getElementById(
            "modalProvince"
        ).textContent = request.province || "-";

        document.getElementById(
            "modalRegion"
        ).textContent = request.region || "-";

        document.getElementById(
            "modalDescription"
        ).textContent = request.request_details || "-";

        document.getElementById(
            "modalPriority"
        ).textContent = request.priority_level || "-";

        const statusBadge =
            document.getElementById(
                "modalStatusBadge"
            );

        let displayStatus = request.status || "Pending";
        if (displayStatus.toLowerCase() === "cancelled") displayStatus = "Cancelled by User";
        if (displayStatus.toLowerCase() === "rejected") displayStatus = "Rejected by Admin";
        if (displayStatus.toLowerCase() === "awaiting_confirmation") displayStatus = "Requires Action";
        
        statusBadge.textContent = displayStatus;

        statusBadge.className =
            `status-badge-modal ${(request.status || "pending").toLowerCase()}`;

        const rejectionRow =
            document.getElementById(
                "rejectionReasonRow"
            );

        if (
            request.status &&
            request.status.toLowerCase() === "rejected" &&
            request.rejection_reason
        ) {
            document.getElementById("modalRejectionReason").textContent = request.rejection_reason;
            rejectionRow.style.display = "block";
        } else {
            rejectionRow.style.display = "none";
        }

        const adminFeedbackRow = document.getElementById("adminFeedbackRow");
        if (request.status && request.status.toLowerCase() === "awaiting_confirmation" && request.admin_feedback) {
            document.getElementById("modalAdminFeedback").textContent = request.admin_feedback;
            if (adminFeedbackRow) adminFeedbackRow.style.display = "block";
        } else {
            if (adminFeedbackRow) adminFeedbackRow.style.display = "none";
        }

        const actionContainer = document.getElementById("modalActionContainer");
        const acceptActionContainer = document.getElementById("acceptActionContainer");
        if (actionContainer && acceptActionContainer) {
            if (request.status && request.status.toLowerCase() === "awaiting_confirmation") {
                actionContainer.style.display = "flex";
                acceptActionContainer.innerHTML = `
                    <button class="modal-btn" style="background-color: #3b82f6; color: white;" onclick="acceptPriority(${request.request_id}); closeModal();">
                        <i class="fa-solid fa-check"></i> Accept New Priority
                    </button>
                `;
            } else {
                actionContainer.style.display = "none";
                acceptActionContainer.innerHTML = "";
            }
        }

        const userFeedbackSection = document.getElementById("userFeedbackSection");
        const feedbackFormContainer = document.getElementById("feedbackFormContainer");
        const feedbackDisplayContainer = document.getElementById("feedbackDisplayContainer");
        const displayFeedbackRating = document.getElementById("displayFeedbackRating");
        const displayFeedbackText = document.getElementById("displayFeedbackText");
        const submitFeedbackBtn = document.getElementById("submitFeedbackBtn");

        if (userFeedbackSection) {
            if (request.status && request.status.toLowerCase() === "completed") {
                userFeedbackSection.style.display = "block";
                
                if (request.feedback_rating || request.user_feedback) {
                    feedbackFormContainer.style.display = "none";
                    feedbackDisplayContainer.style.display = "block";
                    
                    displayFeedbackRating.textContent = request.feedback_rating ? `${request.feedback_rating} Stars` : "N/A";
                    displayFeedbackText.textContent = request.user_feedback || "No comments provided.";
                } else {
                    feedbackDisplayContainer.style.display = "none";
                    feedbackFormContainer.style.display = "block";
                    
                    document.getElementById("feedbackRating").value = "";
                    document.getElementById("feedbackText").value = "";
                    
                    submitFeedbackBtn.onclick = () => submitFeedback(request.request_id);
                }
            } else {
                userFeedbackSection.style.display = "none";
            }
        }

        document
            .getElementById(
                "viewRequestModal"
            )
            .classList.add("show");

    } catch (error) {
        console.error(error);
        alert("Unable to load request details.");
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const modal =
            document.getElementById(
                "viewRequestModal"
            );

        document
            .getElementById(
                "closeViewModal"
            )
            ?.addEventListener(
                "click",
                closeModal
            );

        document
            .getElementById(
                "closeModalButton"
            )
            ?.addEventListener(
                "click",
                closeModal
            );

        modal?.addEventListener(
            "click",
            (e) => {

                if (e.target === modal) {
                    closeModal();
                }

            }
        );

    }
);

function closeModal() {

    document
        .getElementById(
            "viewRequestModal"
        )
        .classList.remove("show");

}

let currentCancelRequestId = null;

window.openCancelModal = function(requestId) {
    currentCancelRequestId = requestId;
    const modal = document.getElementById("cancelRequestModal");
    if(modal) {
        modal.classList.add("show");
        document.getElementById("cancelRequestForm").reset();
        document.getElementById("otherCancelReasonContainer").style.display = "none";
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const cancelSelect = document.getElementById("cancelReasonSelect");
    const otherContainer = document.getElementById("otherCancelReasonContainer");
    const otherInput = document.getElementById("otherCancelReason");
    const cancelForm = document.getElementById("cancelRequestForm");
    const closeBtn = document.getElementById("closeCancelModal");
    const cancelBtn = document.getElementById("cancelCancelBtn");
    const cancelModal = document.getElementById("cancelRequestModal");

    if(cancelSelect) {
        cancelSelect.addEventListener("change", (e) => {
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

    const hideCancelModal = () => {
        if(cancelModal) cancelModal.classList.remove("show");
    };

    if(closeBtn) closeBtn.addEventListener("click", hideCancelModal);
    if(cancelBtn) cancelBtn.addEventListener("click", hideCancelModal);

    if(cancelForm) {
        cancelForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentCancelRequestId) return;
            
            let reason = cancelSelect.value;
            if (reason === "Others") {
                reason = otherInput.value.trim();
            }

            try {
                const url = `${API_URL}/requests/${currentCancelRequestId}/cancel?reason=${encodeURIComponent(reason)}`;
                const res = await fetch(url, {
                    method: "PUT",
                    headers: getAuthHeaders()
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(err.detail || "Cancel failed.");
                    return;
                }

                alert(`Request #${currentCancelRequestId} cancelled successfully.`);
                hideCancelModal();
                
                // Refresh data
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                if (user.user_id) {
                    // Trigger a reload by reloading the page
                    window.location.reload();
                }

            } catch (error) {
                console.error(error);
                alert("Failed to cancel request.");
            }
        });
    }
});

window.acceptPriority = async function(requestId) {
    if (!confirm(`Are you sure you want to accept the new priority for Request #${requestId}?`)) return;

    try {
        const url = `${API_URL}/requests/${requestId}/accept_priority`;
        const res = await fetch(url, {
            method: "PUT",
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.detail || "Accept failed.");
            return;
        }

        alert(`Priority accepted for Request #${requestId}.`);
        window.location.reload();

    } catch (error) {
        console.error(error);
        alert("Failed to accept priority.");
    }
};

window.submitFeedback = async function(requestId) {
    const rating = document.getElementById("feedbackRating").value;
    const feedback = document.getElementById("feedbackText").value;
    
    if (!rating) {
        alert("Please select a rating.");
        return;
    }
    
    if (!confirm(`Submit feedback for Request #${requestId}?`)) return;

    try {
        const url = `${API_URL}/requests/${requestId}/feedback?feedback_rating=${rating}&user_feedback=${encodeURIComponent(feedback)}`;
        const res = await fetch(url, {
            method: "PUT",
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.detail || "Failed to submit feedback.");
            return;
        }

        alert("Feedback submitted successfully.");
        // Hide form and show display
        document.getElementById("feedbackFormContainer").style.display = "none";
        document.getElementById("feedbackDisplayContainer").style.display = "block";
        document.getElementById("displayFeedbackRating").textContent = `${rating} Stars`;
        document.getElementById("displayFeedbackText").textContent = feedback || "No comments provided.";
        
        loadRequests(); // reload table just in case

    } catch (error) {
        console.error(error);
        alert("Failed to submit feedback.");
    }
};
