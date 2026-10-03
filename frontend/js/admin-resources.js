var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
var API_URL = `${API_BASE_URL}/resources/`;

const resourceTableBody = document.querySelector("#resourcesTable tbody");
const resourceForm = document.getElementById("resourceForm");
const resourceModal = document.getElementById("resourceModal");
const modalTitle = document.getElementById("modalTitle");
const locationSelect = document.getElementById("resourceLocation");
const customLocation = document.getElementById("customLocation");

let editingResourceId = null;

/* ==================================
   LOAD RESOURCES
================================== */
async function loadResources() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const resources = await response.json();
        updateStats(resources);
        renderTable(resources);
    } catch (error) {
        console.error("Failed to load resources", error);
    }
}

/* ==================================
   RENDER TABLE
================================== */
function renderTable(resources) {

    resourceTableBody.innerHTML = "";

    if (resources.length === 0) {
        resourceTableBody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;padding:30px;color:#9ca3af;">No data yet</td></tr>`;
        return;
    }

    resources.forEach(resource => {

        const qty = parseInt(resource.quantity_available) || 0;
        const badge = qty <= 0 ? "rq-badge-inactive" : qty <= 50 ? "rq-badge-medium" : "rq-badge-active";
        const statusTxt = qty <= 0 ? "Depleted" : qty <= 50 ? "Low Stock" : "Available";

        resourceTableBody.innerHTML += `
            <tr data-id="${resource.resource_id}">
                <td><strong>#${resource.resource_id}</strong></td>
                <td>${resource.resource_name}</td>
                <td>${resource.category || "General"}</td>
                <td>${qty} ${resource.unit || ""}</td>
                <td>${resource.location || "—"}</td>
                <td><span class="rq-badge ${badge}">${statusTxt}</span></td>
                <td>
                    <button class="action-btn edit-btn"
                        onclick="editResource(
                            ${resource.resource_id},
                            '${(resource.resource_name || "").replace(/'/g, "\\'")}',
                            '${resource.category || "General"}',
                            ${qty},
                            '${resource.unit || "units"}',
                            '${(resource.location || "").replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn"
                        onclick="deleteResource(${resource.resource_id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

/* ==================================
   UPDATE STATS
================================== */
function updateStats(resources) {
    const total = resources.length;
    const avail = resources.filter(r => parseInt(r.quantity_available) > 50).length;
    const low = resources.filter(r => parseInt(r.quantity_available) > 0 && parseInt(r.quantity_available) <= 50).length;
    const depleted = resources.filter(r => parseInt(r.quantity_available) <= 0).length;

    document.getElementById("totalResources").textContent = total;
    document.getElementById("availableResources").textContent = avail;
    document.getElementById("lowStockResources").textContent = low;
    document.getElementById("depletedResources").textContent = depleted;
}

/* ==================================
   OPEN ADD MODAL
================================== */
document.getElementById("addResourceBtn").addEventListener("click", () => {
    editingResourceId = null;
    modalTitle.textContent = "Add Resource";
    resourceForm.reset();
    customLocation.style.display = "none";
    resourceModal.classList.add("show");
});

/* ==================================
   LOCATION DROPDOWN
================================== */
if (locationSelect) {
    locationSelect.addEventListener("change", () => {
        const isOther = locationSelect.value === "other";
        customLocation.style.display = isOther ? "block" : "none";
        customLocation.required = isOther;
        if (!isOther) customLocation.value = "";
    });
}

/* ==================================
   SAVE RESOURCE
================================== */
resourceForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const resource_name = document.getElementById("resourceName").value.trim();
    const category = document.getElementById("resourceCategory").value;
    const quantity_available = parseInt(document.getElementById("resourceQty").value);
    const unit = document.getElementById("resourceUnit")?.value.trim() || "units";
    let location = locationSelect.value === "other"
        ? customLocation.value.trim()
        : locationSelect.value;

    if (!resource_name || isNaN(quantity_available)) {
        alert("Please fill in Resource Name and Quantity.");
        return;
    }

    const submitBtn = resourceForm.querySelector('button[type="submit"]');
    let originalText = "Save";
    if (submitBtn) {
        originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";
    }

    try {
        if (editingResourceId === null) {
            // CREATE
            const url = `${API_URL}/create?resource_name=${encodeURIComponent(resource_name)}&category=${encodeURIComponent(category)}&quantity_available=${quantity_available}&unit=${encodeURIComponent(unit)}&location=${encodeURIComponent(location)}`;
            const res = await fetch(url, {
                method: "POST", headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) { const err = await res.json(); alert(err.detail || "Failed to add resource."); return; }

        } else {
            // UPDATE
            const url = `${API_URL}/${editingResourceId}?resource_name=${encodeURIComponent(resource_name)}&category=${encodeURIComponent(category)}&quantity_available=${quantity_available}&unit=${encodeURIComponent(unit)}&location=${encodeURIComponent(location)}`;
            const res = await fetch(url, {
                method: "PUT", headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) { const err = await res.json(); alert(err.detail || "Failed to update resource."); return; }
        }

        resourceModal.classList.remove("show");
        loadResources();

    } catch (error) {
        console.error(error);
        alert("Request failed. Is the backend running?");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
});

/* ==================================
   EDIT RESOURCE
================================== */
window.editResource = function (id, name, category, quantity, unit, location) {
    editingResourceId = id;
    modalTitle.textContent = "Edit Resource";

    document.getElementById("resourceName").value = name;
    document.getElementById("resourceCategory").value = category;
    document.getElementById("resourceQty").value = quantity;
    if (document.getElementById("resourceUnit")) document.getElementById("resourceUnit").value = unit;

    const presets = ["QC Warehouse", "Pasig Hub", "Marikina Depot"];
    if (presets.includes(location)) {
        locationSelect.value = location;
        customLocation.style.display = "none";
    } else {
        locationSelect.value = "other";
        customLocation.style.display = "block";
        customLocation.value = location;
    }

    resourceModal.classList.add("show");
};

/* ==================================
   DELETE RESOURCE
================================== */
window.deleteResource = async function (id) {
    const deleteModal = document.getElementById("deleteModal");
    if (deleteModal) {
        // Use the proper delete modal from the HTML
        deleteModal._targetId = id;
        deleteModal.classList.add("show");
    } else {
        if (!confirm("Delete this resource? This cannot be undone.")) return;
        await doDeleteResource(id);
    }
};

async function doDeleteResource(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "DELETE", headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) { const err = await res.json(); alert(err.detail || "Delete failed."); return; }
        loadResources();
    } catch (error) {
        console.error(error);
    }
}

/* ==================================
   DELETE MODAL BUTTONS
================================== */
document.getElementById("confirmDelete")?.addEventListener("click", async () => {
    const deleteModal = document.getElementById("deleteModal");
    await doDeleteResource(deleteModal._targetId);
    deleteModal.classList.remove("show");
});

document.getElementById("cancelDelete")?.addEventListener("click", () => {
    document.getElementById("deleteModal")?.classList.remove("show");
});

/* ==================================
   CLOSE MODAL
================================== */
document.getElementById("closeModal")?.addEventListener("click", () => resourceModal.classList.remove("show"));
document.getElementById("cancelModal")?.addEventListener("click", () => resourceModal.classList.remove("show"));

/* ==================================
   SEARCH + CATEGORY FILTER
================================== */
document.getElementById("resourceSearch")?.addEventListener("input", () => {
    const v = document.getElementById("resourceSearch").value.toLowerCase();
    document.querySelectorAll("#resourcesTable tbody tr").forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(v) ? "" : "none";
    });
});

document.getElementById("categoryFilter")?.addEventListener("change", () => {
    const cat = document.getElementById("categoryFilter").value.toLowerCase();
    document.querySelectorAll("#resourcesTable tbody tr").forEach(row => {
        row.style.display = (cat === "all" || row.textContent.toLowerCase().includes(cat)) ? "" : "none";
    });
});

/* ==================================
   INITIAL LOAD
================================== */
loadResources();
