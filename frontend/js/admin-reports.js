// Core logic and operations for admin-reports
var API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

var API_URL = `${API_BASE_URL}/reports`;

/* ===========================
   LOAD REPORTS
=========================== */

async function loadReports() {

    try {

        const response =
            await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

        const data =
            await response.json();

        document.getElementById(
            "totalRequests"
        ).textContent =
            data.total_requests || 0;

        document.getElementById(
            "completedRequests"
        ).textContent =
            data.completed || 0;

        document.getElementById(
            "pendingRequests"
        ).textContent =
            data.pending || 0;

        document.getElementById(
            "processingRequests"
        ).textContent =
            data.processing || 0;

        updateStatusBreakdown(data);

    } catch (error) {

        console.error(
            "Failed to load reports",
            error
        );

    }
}

/* ===========================
   STATUS BREAKDOWN
=========================== */

// Handles updateStatusBreakdown logic and operations
function updateStatusBreakdown(data) {

    const total =
        Number(data.total_requests) || 0;

    if (total === 0) return;

    const completedPercent =
        Math.round(
            (data.completed / total) * 100
        );

    const pendingPercent =
        Math.round(
            (data.pending / total) * 100
        );

    const processingPercent =
        Math.round(
            (data.processing / total) * 100
        );

    document.getElementById(
        "completedPercent"
    ).textContent =
        completedPercent + "%";

    document.getElementById(
        "pendingPercent"
    ).textContent =
        pendingPercent + "%";

    document.getElementById(
        "processingPercent"
    ).textContent =
        processingPercent + "%";

    document.getElementById(
        "completedBar"
    ).style.width =
        completedPercent + "%";

    document.getElementById(
        "pendingBar"
    ).style.width =
        pendingPercent + "%";

    document.getElementById(
        "processingBar"
    ).style.width =
        processingPercent + "%";
}

async function loadMonthlyChart() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/reports/monthly`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

        if (!response.ok) throw new Error("Monthly fetch failed");

        const data =
            await response.json();

        const max =
            Math.max(...Object.values(data), 1);

        document.getElementById("barApr").style.height =
            `${(data.Apr / max) * 100}%`;

        document.getElementById("barMay").style.height =
            `${(data.May / max) * 100}%`;

        document.getElementById("barJun").style.height =
            `${(data.Jun / max) * 100}%`;

        document.getElementById("barJul").style.height =
            `${(data.Jul / max) * 100}%`;

        document.getElementById("barAug").style.height =
            `${(data.Aug / max) * 100}%`;

        document.getElementById("barSep").style.height =
            `${(data.Sep / max) * 100}%`;

    } catch (error) {
        console.error("Failed to load monthly chart", error);
    }
}

/* ===========================
   EXPORT CSV
=========================== */

// Handles exportCSV logic and operations
function exportCSV() {

    alert(
        "CSV export coming soon."
    );

}

/* ===========================
   INITIAL LOAD
=========================== */

document.addEventListener("DOMContentLoaded", () => {
    loadReports();
    loadMonthlyChart();
});