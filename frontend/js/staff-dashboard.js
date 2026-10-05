var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
/* ============================================================
   staff-dashboard.js
   Loads live stats from the backend matching the correct flow:
   Staff only handles "Processing" → "Completed".
   ============================================================ */

var API_URL = API_BASE_URL;

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardStats();
    loadRecentRequests();
});

async function loadDashboardStats() {

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user ? user.user_id : null;

        const [reqRes, distRes, resRes] = await Promise.all([
            fetch(`${API_URL}/requests/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}/distributions/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}/resources/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        const allRequests = await reqRes.json();
        const allDistributions = await distRes.json();
        const allResources = await resRes.json();

        // Build distribution map keyed by request_id
        const distMap = {};
        allDistributions.forEach(d => { distMap[d.request_id] = d; });

        // Requests assigned to this staff (processing or completed)
        const myRequests = allRequests.filter(r => {
            const status = (r.status || "").toLowerCase();
            const dist = distMap[r.request_id];
            if (!dist) return false;
            if (status !== "processing" && status !== "completed") return false;
            if (staffId) return dist.staff_id === staffId;
            return true;
        });

        const processing = myRequests.filter(r => r.status.toLowerCase() === "processing").length;
        const completed = myRequests.filter(r => r.status.toLowerCase() === "completed").length;

        document.getElementById("totalRequests").textContent = myRequests.length;
        document.getElementById("pendingRequests").textContent = processing;
        document.getElementById("completedDistributions").textContent = completed;
        document.getElementById("totalResources").textContent = allResources.length;

    } catch (err) {
        console.error("Dashboard stats failed:", err);
    }
}

async function loadRecentRequests() {

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user ? user.user_id : null;

        const [reqRes, distRes] = await Promise.all([
            fetch(`${API_URL}/requests/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`${API_URL}/distributions/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        const allRequests = await reqRes.json();
        const allDistributions = await distRes.json();

        const distMap = {};
        allDistributions.forEach(d => { distMap[d.request_id] = d; });

        const myRequests = allRequests.filter(r => {
            const status = (r.status || "").toLowerCase();
            const dist = distMap[r.request_id];
            if (!dist) return false;
            if (status !== "processing" && status !== "completed") return false;
            if (staffId) return dist.staff_id === staffId;
            return true;
        });

        const table = document.getElementById("recentRequestsTable");
        table.innerHTML = "";

        if (myRequests.length === 0) {
            table.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No data yet</td></tr>`;
            return;
        }

        myRequests.slice(0, 5).forEach(r => {
            const status = (r.status || "pending").toLowerCase();
            const priority = (r.priority_level || "medium").toLowerCase();

            table.innerHTML += `
                <tr>
                    <td>#${String(r.request_id).padStart(4, "0")}</td>
                    <td>${r.full_name || "—"}</td>
                    <td><span class="rq-badge rq-badge-${priority}">${priority.toUpperCase()}</span></td>
                    <td><span class="rq-badge rq-badge-${status}">${r.status.replace(/_/g, ' ').toUpperCase()}</span></td>
                </tr>`;
        });

    } catch (err) {
        console.error("Recent requests failed:", err);
    }
}
