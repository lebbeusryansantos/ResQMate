let locations = [
{
location_id: 1,
location_name: "QC Warehouse",
barangay: "Bagong Pag-asa",
city: "Quezon City",
province: "Metro Manila"
},
{
location_id: 2,
location_name: "Pasig Hub",
barangay: "San Antonio",
city: "Pasig",
province: "Metro Manila"
},
{
location_id: 3,
location_name: "Marikina Depot",
barangay: "Concepcion Uno",
city: "Marikina",
province: "Metro Manila"
}
];

let editingLocationId = null;
let deletingLocationId = null;

const tableBody =
document.getElementById("locationsTableBody");

const message =
document.getElementById("locationMessage");

const searchInput =
document.getElementById("locationSearch");

const locationForm =
document.getElementById("locationForm");

const locationModalElement =
document.getElementById("locationModal");

const deleteModalElement =
document.getElementById("deleteLocationModal");

const locationModal =
new bootstrap.Modal(locationModalElement);

const deleteModal =
new bootstrap.Modal(deleteModalElement);

function displayLocations() {

const searchTerm =
    searchInput.value.trim().toLowerCase();


const filteredLocations =
    locations.filter(location => {

        const searchableText = [

            location.location_id,
            location.location_name,
            location.barangay,
            location.city,
            location.province

        ].join(" ").toLowerCase();


        return searchableText.includes(searchTerm);

    });


tableBody.innerHTML = "";


if (filteredLocations.length === 0) {

    message.classList.add("show");

    return;

}


message.classList.remove("show");


filteredLocations.forEach(location => {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td class="location-id">
            #${location.location_id}
        </td>

        <td class="location-name">
            ${escapeHtml(location.location_name)}
        </td>

        <td>
            ${escapeHtml(location.barangay)}
        </td>

        <td>
            ${escapeHtml(location.city)}
        </td>

        <td>
            ${escapeHtml(location.province)}
        </td>

        <td class="text-end">

            <button
                type="button"
                class="btn btn-sm btn-outline-primary location-action me-1"
                title="Edit"
                onclick="openEditLocation(${location.location_id})">

                <i class="bi bi-pencil"></i>

            </button>


            <button
                type="button"
                class="btn btn-sm btn-outline-danger location-action"
                title="Delete"
                onclick="openDeleteLocation(${location.location_id})">

                <i class="bi bi-trash"></i>

            </button>

        </td>

    `;


    tableBody.appendChild(row);

});

}

function openAddLocationModal() {

editingLocationId = null;

document.getElementById("locationModalTitle").textContent =
    "Add Location";

document.getElementById("locationId").value =
    "";

document.getElementById("locationName").value =
    "";

document.getElementById("barangay").value =
    "";

document.getElementById("city").value =
    "";

document.getElementById("province").value =
    "";


locationModal.show();

}

function openEditLocation(locationId) {

const location =
    locations.find(
        item => item.location_id === locationId
    );


if (!location) {
    return;
}


editingLocationId =
    locationId;


document.getElementById("locationModalTitle").textContent =
    "Edit Location";

document.getElementById("locationId").value =
    location.location_id;

document.getElementById("locationName").value =
    location.location_name;

document.getElementById("barangay").value =
    location.barangay;

document.getElementById("city").value =
    location.city;

document.getElementById("province").value =
    location.province;


locationModal.show();

}

locationForm.addEventListener("submit", function (event) {

event.preventDefault();


const locationName =
    document.getElementById("locationName")
        .value.trim();

const barangay =
    document.getElementById("barangay")
        .value.trim();

const city =
    document.getElementById("city")
        .value.trim();

const province =
    document.getElementById("province")
        .value.trim();


if (
    !locationName ||
    !barangay ||
    !city ||
    !province
) {

    return;

}

if (editingLocationId !== null) {

    const location =
        locations.find(
            item =>
                item.location_id === editingLocationId
        );


    if (location) {

        location.location_name =
            locationName;

        location.barangay =
            barangay;

        location.city =
            city;

        location.province =
            province;

    }

}

else {

    const newId =
        locations.length > 0
            ? Math.max(
                ...locations.map(
                    item => item.location_id
                )
            ) + 1
            : 1;


    locations.push({

        location_id: newId,

        location_name:
            locationName,

        barangay:
            barangay,

        city:
            city,

        province:
            province

    });

}


locationModal.hide();

displayLocations();

});

function openDeleteLocation(locationId) {

const location =
    locations.find(
        item => item.location_id === locationId
    );


if (!location) {
    return;
}


deletingLocationId =
    locationId;


document.getElementById("deleteLocationText")
    .textContent =
    `Delete "${location.location_name}"? This action cannot be undone.`;


deleteModal.show();

}

document
.getElementById("confirmDeleteButton")
.addEventListener("click", function () {

    if (deletingLocationId === null) {
        return;
    }


    locations =
        locations.filter(
            location =>
                location.location_id !==
                deletingLocationId
        );


    deletingLocationId = null;


    deleteModal.hide();

    displayLocations();

});

searchInput.addEventListener(
"input",
displayLocations
);

function escapeHtml(value) {

return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

document.addEventListener("DOMContentLoaded", () => {

displayLocations();

});