// Core logic and operations for admin-documentation
var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

document.addEventListener(
    "DOMContentLoaded",
    loadDocumentations
);

async function loadDocumentations() {

    const tbody =
        document.getElementById(
            "documentationTableBody"
        );

    tbody.innerHTML =
        `<tr>
            <td colspan="8">
                Loading...
            </td>
        </tr>`;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/delivery-documentations/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load documentations"
            );
        }

        const data =
            await response.json();

        tbody.innerHTML = "";

        if (data.length === 0) {

            tbody.innerHTML =
                `<tr>
                    <td colspan="8">
                        No documentation found.
                    </td>
                </tr>`;

            return;
        }

        data.forEach(doc => {

            tbody.innerHTML += `
                <tr>

                    <td>${doc.documentation_id}</td>

                    <td>#${doc.request_id}</td>

                    <td>${doc.staff_name || "-"}</td>

                    <td>
                        <button
                            class="btn-view-remarks"
                            onclick='viewRemarks(${JSON.stringify(doc.remarks || "")})'>
                            View
                        </button>
                    </td>

                    <td>
                        <a
                            href="${doc.file_path}"
                            target="_blank"
                            class="btn-proof"
                        >
                            View File
                        </a>
                    </td>

                    <td>
                        <span class="status-${doc.status}">
                            ${doc.status}
                        </span>
                    </td>

                    <td>
                        ${new Date(
                doc.submitted_at
            ).toLocaleString()}
                    </td>

                    <td>

                        ${doc.status === "pending_review"

                    ?

                    `
                            <button
                                class="btn-approve"
                                onclick="approveDocumentation(${doc.documentation_id})">
                                Approve
                            </button>

                            <button
                                class="btn-reject"
                                onclick="rejectDocumentation(${doc.documentation_id})">
                                Reject
                            </button>
                            `

                    :

                    doc.status === "approved"

                        ?

                        `
                            <span class="status-completed">
                                <i class="fas fa-check-circle"></i>
                                Completed
                            </span>
                            `

                        :

                        doc.status === "rejected"

                            ?

                            `
                            <span class="status-rejected-badge">
                                <i class="fas fa-times-circle"></i>
                                Rejected
                            </span>
                            `

                            :

                            "-"
                }

                    </td>

                </tr>
            `;
        });

    } catch (error) {

        console.error(error);

        tbody.innerHTML =
            `<tr>
                <td colspan="8">
                    Failed to load documentations.
                </td>
            </tr>`;
    }
}

// Handles viewRemarks logic and operations
function viewRemarks(remarks) {

    document.getElementById(
        "remarksContent"
    ).textContent = remarks || "No remarks provided.";

    document.getElementById(
        "remarksModal"
    ).classList.add("show");
}

document
    .getElementById("closeRemarksModal")
    ?.addEventListener("click", () => {

        document
            .getElementById("remarksModal")
            .classList.remove("show");
    });

document
    .getElementById("remarksModal")
    ?.addEventListener("click", e => {

        if (
            e.target ===
            document.getElementById("remarksModal")
        ) {
            document
                .getElementById("remarksModal")
                .classList.remove("show");
        }
    });

async function approveDocumentation(id) {

    if (
        !confirm(
            "Approve this documentation?"
        )
    ) return;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/delivery-documentations/${id}/approve`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error();
        }

        alert(
            "Documentation approved."
        );

        loadDocumentations();

    } catch {

        alert(
            "Approval failed."
        );
    }
}

let currentRejectDocId = null;

window.rejectDocumentation = function(id) {
    currentRejectDocId = id;
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
            if (!currentRejectDocId) return;
            
            let reason = rejectionSelect.value;
            if (reason === "Others") {
                reason = otherInput.value.trim();
            }

            try {
                // Attach the reason as query param (payload handling)
                const url = `${API_BASE_URL}/delivery-documentations/${currentRejectDocId}/reject?rejection_reason=${encodeURIComponent(reason)}`;
                const response = await fetch(url, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                if (!response.ok) {
                    throw new Error();
                }

                alert("Documentation rejected.");
                hideModal();
                loadDocumentations();

            } catch {
                alert("Rejection failed.");
            }
        });
    }
});