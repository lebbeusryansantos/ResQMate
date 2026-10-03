var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
var API_URL =
    API_BASE_URL;

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadResources();

        document
            .getElementById("refreshBtn")
            .addEventListener(
                "click",
                loadResources
            );

    }
);

async function loadResources() {

    try {

        const response =
            await fetch(
                `${API_URL}/resources/`
                , {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

        if (!response.ok) {
            console.error("Failed to load resources:", await response.text());
            return;
        }

        const resources =
            await response.json();

        renderResources(
            resources
        );

    }
    catch (error) {

        console.error(
            error
        );

    }

}

function renderResources(
    resources
) {

    const tbody =
        document.getElementById(
            "resourcesTableBody"
        );

    const emptyState = document.getElementById("emptyState");

    tbody.innerHTML = "";

    if (resources.length === 0) {
        if (emptyState) emptyState.style.display = "block";
    } else {
        if (emptyState) emptyState.style.display = "none";
    }

    let available = 0;
    let low = 0;
    let depleted = 0;

    resources.forEach(resource => {

        const quantity =
            parseInt(
                resource.quantity_available
            ) || 0;

        let status =
            "AVAILABLE";

        let badge =
            "rq-badge-active";

        if (quantity === 0) {

            status =
                "DEPLETED";

            badge =
                "rq-badge-inactive";

            depleted++;

        }
        else if (quantity <= 20) {

            status =
                "LOW STOCK";

            badge =
                "rq-badge-medium";

            low++;

        }
        else {

            available++;

        }

        tbody.innerHTML += `
            <tr>

                <td>
                    #R${String(resource.resource_id).padStart(3, "0")}
                </td>

                <td>
                    ${resource.resource_name}
                </td>

                <td>
                    ${(resource.category || "-").toUpperCase()}
                </td>

                <td>
                    ${quantity}
                </td>

                <td>
                    <span class="rq-badge ${badge}">
                        ${status}
                    </span>
                </td>

            </tr>
        `;
    });

    document.getElementById(
        "totalResources"
    ).textContent =
        resources.length;

    document.getElementById(
        "availableResources"
    ).textContent =
        available;

    document.getElementById(
        "lowStockResources"
    ).textContent =
        low;

    document.getElementById(
        "depletedResources"
    ).textContent =
        depleted;
}