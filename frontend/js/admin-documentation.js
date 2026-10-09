var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";

let docsData = [];
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
    const endIdx = Math.min(startIdx + itemsPerPage, dataArray.length);
    const slicedData = dataArray.slice(startIdx, endIdx);
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";
        if (currentPage === 1) prevBtn.classList.add("disabled-btn");
        else prevBtn.classList.remove("disabled-btn");
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages || dataArray.length === 0;
        nextBtn.style.cursor = nextBtn.disabled ? "not-allowed" : "pointer";
        if (nextBtn.disabled) nextBtn.classList.add("disabled-btn");
        else nextBtn.classList.remove("disabled-btn");
    }
    
    if (indicator) {
        if (dataArray.length === 0) {
            indicator.textContent = 'Showing 0 to 0 of 0 entries';
        } else {
            indicator.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${dataArray.length} entries`;
        }
    }
    
    renderCallback(slicedData);
}

function updatePagination() {
    applyFilters();
}

document.addEventListener("DOMContentLoaded", () => {
    loadDocumentations();

    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });
    
    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        currentPage++;
        updatePagination();
    });

    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        applyFilters();
    });

    document.getElementById("docSearch")?.addEventListener("input", () => {
        currentPage = 1;
        applyFilters();
    });
    
    document.getElementById("statusFilter")?.addEventListener("change", () => {
        currentPage = 1;
        applyFilters();
    });
});

async function loadDocumentations() {
    const tbody = document.getElementById("documentationTableBody");
    tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE_URL}/delivery-documentations/`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (!response.ok) throw new Error("Failed to load documentations");

        docsData = await response.json();
        applyFilters();
    } catch (error) {
        console.error("Error loading documentations:", error);
        tbody.innerHTML = `<tr><td colspan="8">Error loading data.</td></tr>`;
    }
}

function applyFilters() {
    const searchValue = (document.getElementById("docSearch")?.value || "").toLowerCase();
    const statusValue = (document.getElementById("statusFilter")?.value || "all").toLowerCase();

    const filtered = docsData.filter(doc => {
        const matchesSearch = JSON.stringify(doc).toLowerCase().includes(searchValue);
        const matchesStatus = statusValue === "all" || (doc.status || "").toLowerCase() === statusValue;
        
        return matchesSearch && matchesStatus;
    });

    setupPagination(filtered, renderDocsDOM);
}

function renderDocsDOM(data) {
    const tbody = document.getElementById("documentationTableBody");
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="text-align:center;padding:30px;color:#9ca3af;">No matching records found.</td></tr>`;
        return;
    }

    data.forEach(doc => {
        let statusBadge = "rq-badge-medium";
        if (doc.status === "approved") {
            statusBadge = "rq-badge-approved";
        } else if (doc.status === "rejected") {
            statusBadge = "rq-badge-rejected";
        } else if (doc.status === "pending_review") {
            statusBadge = "rq-badge-pending";
        }

        let remarksHTML = `
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick='viewRemarks(${JSON.stringify(doc.remarks || "")})'>
                View
            </button>
        `;

        let attachmentsHTML = "";
        if (doc.file_path) {
            attachmentsHTML += `<a href="${doc.file_path}" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; text-decoration: none;"><i class="fa-solid fa-file"></i> View File</a>`;
        } else {
            attachmentsHTML = "—";
        }

        let actionsHTML = "";
        if (doc.status === "pending_review") {
            actionsHTML = `
                <button class="rq-btn-approve" onclick="updateDocStatus(${doc.documentation_id}, 'approve')" style="padding: 6px 12px; margin-right: 5px;">Approve</button>
                <button class="rq-btn-reject" onclick="updateDocStatus(${doc.documentation_id}, 'reject')" style="padding: 6px 12px;">Reject</button>
            `;
        } else if (doc.status === "approved") {
            actionsHTML = `<span style="color: #10b981; font-weight: 500;"><i class="fas fa-check-circle me-1"></i> COMPLETED</span>`;
        } else if (doc.status === "rejected") {
            actionsHTML = `<span style="color: #ef4444; font-weight: 500;"><i class="fas fa-times-circle me-1"></i> REJECTED</span>`;
        } else {
            actionsHTML = "—";
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>#DOC${doc.documentation_id}</strong></td>
                <td>Dist #${doc.request_id}</td>
                <td>${doc.staff_name || "—"}</td>
                <td>${remarksHTML}</td>
                <td>${attachmentsHTML}</td>
                <td>
                    <span class="rq-badge ${statusBadge}">
                        ${(doc.status || "—").replace(/_/g, ' ').toUpperCase()}
                    </span>
                </td>
                <td>${doc.submitted_at ? new Date(doc.submitted_at).toLocaleString() : '—'}</td>
                <td style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: center;">${actionsHTML}</td>
            </tr>
        `;
    });
}

async function updateDocStatus(doc_id, action) {
    if (!confirm(`Are you sure you want to ${action} this documentation?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/delivery-documentations/${doc_id}/${action}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to ${action} documentation`);
        }

        alert(`Documentation successfully ${action}d.`);
        loadDocumentations();
    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
}

function viewRemarks(remarks) {
    document.getElementById("remarksContent").textContent = remarks || "No remarks provided.";
    document.getElementById("remarksModal")?.classList.add("show");
}

document.getElementById("closeRemarksModal")?.addEventListener("click", () => {
    document.getElementById("remarksModal")?.classList.remove("show");
});

document.getElementById("remarksModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("remarksModal")) {
        document.getElementById("remarksModal")?.classList.remove("show");
    }
});
