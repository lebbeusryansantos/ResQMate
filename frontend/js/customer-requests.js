// Core logic and operations for customer-requests
var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

var API_URL = API_BASE_URL;

// Handles getAuthHeaders logic and operations
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

            const typeText = req.category_name || "General";

            const status = req.status
                ? req.status.toLowerCase()
                : "pending";

            const statusFormatted = req.status
                ? req.status.charAt(0).toUpperCase() + req.status.slice(1)
                : "Pending";

            const dateFormatted = req.date_requested
                ? new Date(req.date_requested).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                })
                : "";

            let actionHTML = "";

            if (status === "pending") {
                actionHTML = `
                    <button 
                        class="follow-up-button"
                        data-request-id="${req.request_id}">
                        Follow Up
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
                const requestId = button.dataset.requestId;

                alert(
                    `Follow-up request sent for Request #${requestId}.`
                );
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
        ).textContent = request.category_name || "General";

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

        statusBadge.textContent =
            request.status || "Pending";

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
            document.getElementById(
                "modalRejectionReason"
            ).textContent =
                request.rejection_reason;

            rejectionRow.style.display =
                "block";
        } else {
            rejectionRow.style.display =
                "none";
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

// Handles closeModal logic and operations
function closeModal() {

    document
        .getElementById(
            "viewRequestModal"
        )
        .classList.remove("show");

}
