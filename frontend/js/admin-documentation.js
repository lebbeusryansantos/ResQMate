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

                    <td>${doc.remarks}</td>

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

                        ${doc.status ===
                    "pending_review"

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

async function rejectDocumentation(id) {

    if (
        !confirm(
            "Reject this documentation?"
        )
    ) return;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/delivery-documentations/${id}/reject`,
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
            "Documentation rejected."
        );

        loadDocumentations();

    } catch {

        alert(
            "Rejection failed."
        );
    }
}