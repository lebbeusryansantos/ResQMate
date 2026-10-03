var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
/* ============================================================
   staff-distributions.js  — READ ONLY for staff
   Per the defined flow, only Admin creates distributions.
   Staff only views what has been assigned to them.
   The "New Distribution" button has been removed from the HTML.
   ============================================================ */

var API_URL = API_BASE_URL;

document.addEventListener("DOMContentLoaded", () => {
    loadDistributions();

    document.getElementById("searchInput")
        ?.addEventListener("keyup", filterDistributions);
});

async function loadDistributions() {

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const staffId = user ? user.user_id : null;

        const response = await fetch(`${API_URL}/distributions/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Failed to fetch distributions.");

        let distributions = await response.json();

        // If staff is logged in, only show their own assigned distributions
        if (staffId) {
            distributions = distributions.filter(d => d.staff_id === staffId);
        }

        renderDistributions(distributions);

    } catch (error) {
        console.error(error);
        showMessage("Failed to load distributions. Is the backend running?", false);
    }
}

function renderDistributions(distributions) {

    const table = document.getElementById("distributionTableBody");
    table.innerHTML = "";

    if (distributions.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 30px; color: #6b7280;">No data yet</td>
            </tr>`;
        return;
    }

    distributions.forEach(d => {
        const date = d.distribution_date
            ? new Date(d.distribution_date).toLocaleDateString("en-PH")
            : "—";

        table.innerHTML += `
            <tr>
                <td>${d.distribution_id}</td>
                <td>#${String(d.request_id).padStart(4, "0")}</td>
                <td>${d.resource_name || "—"}</td>
                <td>${d.staff_name || "—"}</td>
                <td>${d.quantity_given}</td>
                <td>${date}</td>
            </tr>`;
    });
}

function filterDistributions() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#distributionTableBody tr");

    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? "" : "none";
    });
}

function showMessage(message, success) {
    const box = document.getElementById("messageBox");
    if (!box) return;
    box.textContent = message;
    box.className = success ? "success-message" : "error-message";
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 3000);
}
