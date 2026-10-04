// Core logic and operations for admin-dashboard
const API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

const API_URL = API_BASE_URL;

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardStats();
    loadPriorityRequests();
    loadResourceAlerts();
    loadActiveDistributions();
    loadRecentRequests();
    loadRecentActivity();
});

/* =========================
   DASHBOARD STATS
========================= */
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        document.getElementById("totalRequests").textContent = data.total_requests || 0;
        document.getElementById("pendingRequests").textContent = data.pending_requests || 0;
        document.getElementById("availableResources").textContent = data.available_resources || 0;
        document.getElementById("activeDistributions").textContent = data.processing_requests || 0;

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
    }
}

/* =========================
   PRIORITY REQUESTS
========================= */
async function loadPriorityRequests() {
    try {
        const res = await fetch(`${API_URL}/requests/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const requests = await res.json();

        const high = requests.filter(r => (r.priority_level || "").toLowerCase() === "high").length;
        const medium = requests.filter(r => (r.priority_level || "").toLowerCase() === "medium").length;
        const low = requests.filter(r => (r.priority_level || "").toLowerCase() === "low").length;

        document.getElementById("highPriorityCount").textContent = high;
        document.getElementById("mediumPriorityCount").textContent = medium;
        document.getElementById("lowPriorityCount").textContent = low;

    } catch (error) {
        console.error("Priority Error:", error);
    }
}

/* =========================
   RESOURCE ALERTS
========================= */
async function loadResourceAlerts() {
    try {
        const res = await fetch(`${API_URL}/resources/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const resources = await res.json();
        const container = document.getElementById("resourceAlerts");
        if (!container) return;

        const lowStock = resources.filter(r => {
            const qty = parseInt(r.quantity_available) || 0;
            const maxStock = parseInt(r.max_stock) || 100;

            const stockPercentage =
                maxStock > 0
                    ? (qty / maxStock) * 100
                    : 0;

            return qty > 0 && stockPercentage <= 30;
        });

        const depleted = resources.filter(
            r => (parseInt(r.quantity_available) || 0) <= 0
        );

        if (lowStock.length === 0) {
            container.innerHTML = `<div class="alert-item">✅ All resources sufficiently stocked</div>`;
            return;
        }

        container.innerHTML = "";
        if (!lowStock || lowStock.length === 0) {
            if ((container.tagName === "TBODY" || container.tagName === "TABLE" || "container".toLowerCase().includes("table") || "container".toLowerCase().includes("body"))) {
                container.innerHTML = `<tr><td colspan='100%' style='text-align:center;color:#9ca3af;padding:20px;'>No data yet</td></tr>`;
            } else {
                container.innerHTML = `<div style='text-align:center;color:#9ca3af;padding:20px;'>No data yet</div>`;
            }
            return;
        }
        lowStock.forEach(r => {
            container.innerHTML += `
        <div class="alert-item">
            ⚠ ${r.resource_name} is running low
            (${r.quantity_available}/${r.max_stock} ${r.unit || "units"})
        </div>
    `;
        });

        depleted.forEach(r => {
            container.innerHTML += `
        <div class="alert-item">
            ❌ ${r.resource_name} is depleted
        </div>
    `;
        });

    } catch (error) {
        console.error("Resource Alert Error:", error);
    }
}

/* =========================
   ACTIVE DISTRIBUTIONS
========================= */
async function loadActiveDistributions() {
    try {
        const res = await fetch(`${API_URL}/distributions/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const distributions = await res.json();

        
        const tbody = document.getElementById("activeDistributionsBody");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (distributions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px;">No data yet</td></tr>`;
            return;
        }

        distributions.slice(0, 8).forEach(d => {
            const date = d.distribution_date
                ? new Date(d.distribution_date).toLocaleDateString("en-PH")
                : "—";

            tbody.innerHTML += `
                <tr>
                    <td><strong>#${d.distribution_id}</strong></td>
                    <td>#${d.request_id}</td>
                    <td>${d.resource_name || "—"}</td>
                    <td>${d.staff_name || "—"}</td>
                    <td>${d.quantity_given}</td>
                    <td>${date}</td>
                </tr>`;
        });

    } catch (error) {
        console.error("Failed to load distributions:", error);
    }
}

/* =========================
   RECENT REQUESTS
========================= */
async function loadRecentRequests() {
    try {
        const res = await fetch(`${API_URL}/requests/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const requests = await res.json();
        const tbody = document.getElementById("recentRequestsBody");
        if (!tbody) return;

        tbody.innerHTML = "";
        if (!requests || requests.length === 0) {
            if ((tbody.tagName === "TBODY" || tbody.tagName === "TABLE" || "tbody".toLowerCase().includes("table") || "tbody".toLowerCase().includes("body"))) {
                tbody.innerHTML = `<tr><td colspan='100%' style='text-align:center;color:#9ca3af;padding:20px;'>No data yet</td></tr>`;
            } else {
                tbody.innerHTML = `<div style='text-align:center;color:#9ca3af;padding:20px;'>No data yet</div>`;
            }
            return;
        }

        requests.slice(0, 5).forEach(r => {
            const status = (r.status || "pending").toUpperCase();
            const priority = (r.priority_level || "medium").toUpperCase();

            tbody.innerHTML += `
                <tr>
                    <td><strong>#${r.request_id}</strong></td>
                    <td>${r.full_name || "—"}</td>
                    <td>${r.category_name || "—"}</td>
                    <td><span class="rq-badge rq-badge-${priority}">${priority.toUpperCase()}</span></td>
                    <td><span class="rq-badge rq-badge-${status}">${r.status}</span></td>
                </tr>`;
        });

    } catch (error) {
        console.error("Recent Requests Error:", error);
    }
}

/* =========================
   RECENT ACTIVITY
========================= */
async function loadRecentActivity() {
    const activityList = document.getElementById("activityList");
    if (!activityList) return;

    try {
        const res = await fetch(`${API_URL}/requests/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const requests = await res.json();

        activityList.innerHTML = "";

        if (requests.length === 0) {
            activityList.innerHTML = `<div class="activity-item">No data yet</div>`;
            return;
        }

        requests.slice(0, 5).forEach(r => {
            activityList.innerHTML += `
                <div class="activity-item">
                    Request <strong>#${r.request_id}</strong> from <strong>${r.full_name || "Unknown"}</strong>
                    is <strong>${r.status}</strong>.
                </div>`;
        });

    } catch (error) {
        activityList.innerHTML = `<div class="activity-item">No data yet</div>`;
    }
}
