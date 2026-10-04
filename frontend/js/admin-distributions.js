var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";
const API_BASE = API_BASE_URL;

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
function renderTable(data) {

    distributionTableBody.innerHTML = "";

    if (data.length === 0) {
        distributionTableBody.innerHTML = `
            <tr><td colspan="8" style="text-align:center;padding:30px;color:#9ca3af;">No data yet</td></tr>`;
        return;
    }

    data.forEach(d => {
        const date = d.distribution_date
            ? new Date(d.distribution_date).toLocaleDateString("en-PH")
            : "—";

        distributionTableBody.innerHTML += `
            <tr>
                <td><strong>#${d.distribution_id}</strong></td>
                <td>#${d.request_id}</td>
                <td>${d.staff_name || "—"}</td>
                <td>${d.resource_name || "—"}</td>
                <td>${d.quantity_given}</td>
                <td>${d.staff_id}</td>
                <td><span class="rq-badge rq-badge-approved">Assigned</span></td>
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
        document.getElementById("resource").value = "";
        document.getElementById("staff").value = "";

        distributionModal.classList.add("show");
    });
}

/* ===========================
   REQUESTS LOADER
=========================== */

async function loadRequests() {
    try {
        const [requestsRes, distributionsRes] = await Promise.all([
            fetch(`${API_BASE}/requests/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch(`${API_BASE}/distributions/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);

        const requests = await requestsRes.json();
        const distributions = await distributionsRes.json();

        const assignedRequestIds = distributions.map(
            d => Number(d.request_id)
        );

        const requestSelect =
            document.getElementById("requestId");

        requestSelect.innerHTML =
            '<option value="">Select Request</option>';

        requests
            .filter(r =>
                !assignedRequestIds.includes(
                    Number(r.request_id)
                )
            )
            .forEach(r => {
                requestSelect.innerHTML += `
                    <option value="${r.request_id}">
                        #${r.request_id} - ${r.full_name || "Unknown"}
                    </option>
                `;
            });

    } catch (error) {
        console.error(
            "Failed to load requests",
            error
        );
    }
}

/* ===========================
   SAVE
=========================== */
if (saveDistribution) {
    saveDistribution.addEventListener("click", async () => {

        const requestId = document.getElementById("requestId").value.trim();
        const resourceId = document.getElementById("resource").value;
        const staffId = document.getElementById("staff").value;
        const quantity = document.getElementById("quantity").value;

        if (!requestId || !resourceId || !staffId || !quantity) {
            alert("Please complete all fields.");
            return;
        }

        const originalText = saveDistribution.textContent;
        saveDistribution.disabled = true;
        saveDistribution.textContent = "Saving...";

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
document.getElementById("distributionSearch")?.addEventListener("keyup", () => {
    const value = document.getElementById("distributionSearch").value.toLowerCase();
    const filtered = allDistributions.filter(d => JSON.stringify(d).toLowerCase().includes(value));
    renderTable(filtered);
});

document.getElementById("statusFilter")?.addEventListener("change", () => {
    const status = document.getElementById("statusFilter").value;
    renderTable(status === "all" ? allDistributions : allDistributions);
    // All distributions currently show as "Assigned" — filter is for future status extension
});

/* ===========================
   POPULATE RESOURCES + STAFF DROPDOWNS
=========================== */
async function loadResources() {
    try {
        const resources = await (await fetch(`${API_BASE}/resources/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        })).json();
        const resourceSel = document.getElementById("resource");
        resourceSel.innerHTML = '<option value="">Select Resource</option>';
        resources.forEach(r => {
            resourceSel.innerHTML += `<option value="${r.resource_id}">${r.resource_name} (${r.quantity_available} ${r.unit})</option>`;
        });
    } catch (e) { console.error("Failed to load resources", e); }
}

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
loadResources();
loadRequests();
loadStaff();
loadDistributions();
