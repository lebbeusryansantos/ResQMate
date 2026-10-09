var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";
const API_BASE = API_BASE_URL;

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
    document.getElementById("rowsPerPage")?.addEventListener("change", (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        if (typeof updatePagination === "function") updatePagination();
    });

});


const distributionModal = document.getElementById("distributionModal");
const deleteDistributionModal = document.getElementById("deleteDistributionModal");
const addDistributionBtn = document.getElementById("addDistributionBtn");
const cancelDistribution = document.getElementById("cancelDistribution");
const saveDistribution = document.getElementById("saveDistribution");
const cancelDeleteDistribution = document.getElementById("cancelDeleteDistribution");
const confirmDeleteDistribution = document.getElementById("confirmDeleteDistribution");
const distributionTableBody = document.querySelector("#distributionTable tbody");

let editingDistributionId = null;
let deletingDistributionId = null;
let allDistributions = [];
let resourcesData = []; // Store resources to check max quantity

/* ===========================
   LOAD DISTRIBUTIONS
=========================== */
async function loadDistributions() {
    try {
        const response = await fetch(`${API_BASE}/distributions/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const distributions = await response.json();
        allDistributions = distributions;
        renderTable(distributions);
    } catch (error) {
        console.error("Failed to load distributions", error);
    }
}

/* ===========================
   RENDER TABLE
=========================== */

let currentData = [];
function renderTable(data) {
    currentData = data;
    currentPage = 1; // Reset to page 1 on new data/filter
    setupPagination(currentData, renderTableDOM);
}
function updatePagination() {
    setupPagination(currentData, renderTableDOM);
}

function renderTableDOM(data) {
    distributionTableBody.innerHTML = "";

    if (data.length === 0) {
        distributionTableBody.innerHTML = `
            <tr><td colspan="12" class="text-center" style="text-align:center;padding:30px;color:#9ca3af;">No matching records found.</td></tr>`;
        return;
    }

    data.forEach(d => {

        let status =
            (d.request_status || "assigned")
                .toLowerCase();

        if (status === "awaiting_verification") {
            status = "processing";
        }

        const statusLabel = {
            assigned: "Assigned",
            processing: "Processing",
            completed: "Completed",
            rejected: "Rejected"
        }[status] || "Assigned";

        const statusClass = {
            assigned: "approved",
            processing: "pending",
            completed: "completed",
            rejected: "rejected"
        }[status] || "approved";

        distributionTableBody.innerHTML += `
        <tr>
            <td><strong>#${d.distribution_id}</strong></td>
            <td>#${d.request_id}</td>
            <td>${d.staff_name || "—"}</td>
            <td>${d.resource_name || "—"}</td>
            <td>${d.quantity_given}</td>
            <td>${d.staff_id}</td>

            <td>
                <span class="rq-badge rq-badge-${statusClass}">
                    ${statusLabel}
                </span>
            </td>

            <td>
                <button class="rq-btn-edit"
                    onclick="editDistribution(${d.distribution_id}, ${d.request_id}, ${d.resource_id}, ${d.staff_id}, ${d.quantity_given})">
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button class="rq-btn-delete"
                    onclick="openDeleteDistribution(${d.distribution_id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    });
}

/* ===========================
   OPEN CREATE MODAL
=========================== */
if (addDistributionBtn) {
    addDistributionBtn.addEventListener("click", async () => {

        await loadRequests();

        editingDistributionId = null;

        document.getElementById(
            "distributionModalTitle"
        ).textContent = "Create Distribution";

        document.getElementById("requestId").value = "";
        document.getElementById("quantity").value = "";
        document.getElementById("quantity").removeAttribute("max");
        document.getElementById("resource").value = "";
        document.getElementById("staff").value = "";

        distributionModal.classList.add("show");
    });
}

/* ===========================
   REQUESTS LOADER
=========================== */
if (saveDistribution) {
    saveDistribution.addEventListener("click", async () => {
        const requestId = document.getElementById("requestId").value.trim();
        const resourceId = document.getElementById("resource").value;
        const staffId = document.getElementById("staff").value;
        const quantityInput = document.getElementById("quantity");
        const quantity = Number(quantityInput.value);

        if (!requestId || !resourceId || !staffId || !quantityInput.value) {
            alert("Please complete all fields.");
            return;
        }

        // Validate max quantity limit based on selected resource
        const resourceSelect = document.getElementById("resource");
        const selectedOption = resourceSelect.options[resourceSelect.selectedIndex];
        const maxQty = Number(selectedOption.getAttribute("data-max")) || Infinity;

        if (quantity > maxQty) {
            alert(`Quantity given cannot exceed the available stock limit of ${maxQty}.`);
            return;
        }

        if (quantity <= 0) {
            alert("Quantity must be greater than zero.");
            return;
        }

        const originalText = saveDistribution.textContent;
        saveDistribution.disabled = true;
        saveDistribution.textContent = "Processing...";

        try {
            let url, method;

            if (!editingDistributionId) {
                url = `${API_BASE}/distributions/create?request_id=${requestId}&resource_id=${resourceId}&staff_id=${staffId}&quantity_given=${quantity}`;
                method = "POST";
            } else {
                url = `${API_BASE}/distributions/${editingDistributionId}?request_id=${requestId}&resource_id=${resourceId}&staff_id=${staffId}&quantity_given=${quantity}`;
                method = "PUT";
            }

            const res = await fetch(url, {
                method, headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Failed to save distribution.");
                return;
            }

            distributionModal.classList.remove("show");
            loadDistributions();

        } catch (error) {
            console.error(error);
            alert("Request failed. Is the backend running?");
        } finally {
            saveDistribution.disabled = false;
            saveDistribution.textContent = originalText;
        }
    });
}

/* ===========================
   EDIT
=========================== */
window.editDistribution = async function (
    id,
    requestId,
    resourceId,
    staffId,
    quantity
) {
    editingDistributionId = id;

    document.getElementById(
        "distributionModalTitle"
    ).textContent = "Edit Distribution";

    await loadRequests();

    const requestSelect =
        document.getElementById("requestId");

    if (
        !Array.from(requestSelect.options)
            .some(opt => opt.value == requestId)
    ) {
        requestSelect.innerHTML += `
            <option value="${requestId}">
                #${requestId}
            </option>
        `;
    }

    requestSelect.value = requestId;
    document.getElementById("resource").value = resourceId;

    // Set max attribute based on resource
    const resourceSelect = document.getElementById("resource");
    const selectedOption = resourceSelect.options[resourceSelect.selectedIndex];
    const maxQty = selectedOption ? selectedOption.getAttribute("data-max") : null;
    const qtyInput = document.getElementById("quantity");
    if (maxQty) qtyInput.max = maxQty;

    qtyInput.value = quantity;
    document.getElementById("staff").value = staffId;
    document.getElementById("quantity").value = quantity;

    distributionModal.classList.add("show");
};

/* ===========================
   DELETE
=========================== */
window.openDeleteDistribution = function (id) {
    deletingDistributionId = id;
    deleteDistributionModal.classList.add("show");
};

if (confirmDeleteDistribution) {
    confirmDeleteDistribution.addEventListener("click", async () => {
        const originalText = confirmDeleteDistribution.textContent;
        confirmDeleteDistribution.disabled = true;
        confirmDeleteDistribution.textContent = "Deleting...";
        try {
            const res = await fetch(`${API_BASE}/distributions/${deletingDistributionId}`, {
                method: "DELETE", headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Delete failed.");
                return;
            }
            deleteDistributionModal.classList.remove("show");
            loadDistributions();
        } catch (error) {
            console.error(error);
        } finally {
            confirmDeleteDistribution.disabled = false;
            confirmDeleteDistribution.textContent = originalText;
        }
    });
}

/* ===========================
   CLOSE MODALS
=========================== */
if (cancelDistribution) cancelDistribution.addEventListener("click", () => distributionModal.classList.remove("show"));
if (cancelDeleteDistribution) cancelDeleteDistribution.addEventListener("click", () => deleteDistributionModal.classList.remove("show"));

distributionModal?.addEventListener("click", e => { if (e.target === distributionModal) distributionModal.classList.remove("show"); });
deleteDistributionModal?.addEventListener("click", e => { if (e.target === deleteDistributionModal) deleteDistributionModal.classList.remove("show"); });

/* ===========================
   SEARCH + STATUS FILTER
=========================== */
function applyFilters() {
    const searchValue = (document.getElementById("distributionSearch")?.value || "").toLowerCase();
    const statusValue = (document.getElementById("statusFilter")?.value || "all").toLowerCase();

    const filtered = allDistributions.filter(d => {
        const matchesSearch = JSON.stringify(d).toLowerCase().includes(searchValue);
        const status = (d.status || "").toLowerCase();
        const matchesStatus = statusValue === "all" || status === statusValue;
        return matchesSearch && matchesStatus;
    });
    
    renderTable(filtered);
}

document.getElementById("distributionSearch")?.addEventListener("input", applyFilters);
document.getElementById("statusFilter")?.addEventListener("change", applyFilters);

/* ===========================
   POPULATE DROPDOWNS (REQUESTS, RESOURCES, STAFF)
=========================== */
async function loadRequests() {
    try {
        const response = await fetch(`${API_BASE}/requests/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const requests = await response.json();
        const requestSel = document.getElementById("requestId");
        requestSel.innerHTML = '<option value="">Select Request ID</option>';
        requests.forEach(req => {
            requestSel.innerHTML += `<option value="${req.request_id}">#${req.request_id} - ${req.assistance_type || "Request"} (${req.city || ""})</option>`;
        });
    } catch (e) {
        console.error("Failed to load requests", e);
    }
}

async function loadResources() {
    try {
        const response = await fetch(`${API_BASE}/resources/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        resourcesData = await response.json();
        const resourceSel = document.getElementById("resource");
        resourceSel.innerHTML = '<option value="">Select Resource</option>';
        resourcesData.forEach(r => {
            resourceSel.innerHTML += `<option value="${r.resource_id}" data-max="${r.quantity_available}">${r.resource_name} (${r.quantity_available} ${r.unit})</option>`;
        });
    } catch (e) { console.error("Failed to load resources", e); }
}

// Handle dynamic max quantity constraint when resource selection changes
document.getElementById("resource")?.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    const maxQty = selectedOption.getAttribute("data-max");
    const quantityInput = document.getElementById("quantity");

    if (maxQty) {
        quantityInput.max = maxQty;
    } else {
        quantityInput.removeAttribute("max");
    }
});

async function loadStaff() {
    try {
        const users = await (await fetch(`${API_BASE}/users/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        })).json();
        const staffSel = document.getElementById("staff");
        staffSel.innerHTML = '<option value="">Select Staff</option>';
        users.filter(u => u.role === "staff").forEach(u => {
            staffSel.innerHTML += `<option value="${u.user_id}">${u.full_name}</option>`;
        });
    } catch (e) { console.error("Failed to load staff", e); }
}

/* ===========================
   INITIAL LOAD
=========================== */
loadRequests();
loadResources();
loadStaff();
loadDistributions();