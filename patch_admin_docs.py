import re

file_path = 'frontend/js/admin-documentation.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to extract the render logic and replace it with a robust filtering/pagination structure.
# Since it's somewhat small, I'll rewrite the core.

new_js = """var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";

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
        const statusBadge =
            doc.status === "Approved"
                ? "rq-badge-active"
                : doc.status === "Rejected"
                    ? "rq-badge-inactive"
                    : "rq-badge-medium";

        let attachmentsHTML = "";
        if (doc.image_url) {
            attachmentsHTML += `<button class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.open('${doc.image_url}', '_blank')"><i class="fa-solid fa-image"></i> View Image</button>`;
        }
        if (doc.signature_url) {
            attachmentsHTML += ` <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.open('${doc.signature_url}', '_blank')"><i class="fa-solid fa-signature"></i> Signature</button>`;
        }

        let actionsHTML = "";
        if (doc.status === "Pending") {
            actionsHTML = `
                <button class="rq-btn-approve" onclick="updateDocStatus(${doc.doc_id}, 'Approved')" style="padding: 6px 12px; margin-right: 5px;">Approve</button>
                <button class="rq-btn-reject" onclick="updateDocStatus(${doc.doc_id}, 'Rejected')" style="padding: 6px 12px;">Reject</button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>#DOC${doc.doc_id}</strong></td>
                <td>Dist #${doc.distribution_id}</td>
                <td>User #${doc.staff_id}</td>
                <td>${doc.submitted_at ? new Date(doc.submitted_at).toLocaleString() : 'N/A'}</td>
                <td>
                    <span class="rq-badge ${statusBadge}">
                        ${doc.status}
                    </span>
                </td>
                <td>${doc.notes || '—'}</td>
                <td>${attachmentsHTML || '—'}</td>
                <td>${actionsHTML || '—'}</td>
            </tr>
        `;
    });
}

async function updateDocStatus(doc_id, new_status) {
    if (!confirm(`Are you sure you want to mark this documentation as ${new_status}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/delivery-documentations/${doc_id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ status: new_status })
        });

        if (!response.ok) {
            throw new Error(`Failed to update to ${new_status}`);
        }

        alert(`Documentation successfully marked as ${new_status}.`);
        loadDocumentations();
    } catch (error) {
        console.error(error);
        alert(`Error updating documentation status: ${error.message}`);
    }
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_js)
