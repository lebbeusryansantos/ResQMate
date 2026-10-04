const LOCATION_API_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

const regionSelect = document.getElementById("region");
const provinceSelect = document.getElementById("province");
const citySelect = document.getElementById("city");
const barangaySelect = document.getElementById("barangay");

document.addEventListener("DOMContentLoaded", () => {
    provinceSelect.disabled = true;
    citySelect.disabled = true;
    barangaySelect.disabled = true;
    loadRegions();
});

function decodeText(text) {
    try {
        return decodeURIComponent(escape(text));
    } catch {
        return text;
    }
}

function getToken() {
    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    return user.token || "";
}

function getHeaders() {
    return {
        Authorization: `Bearer ${getToken()}`
    };
}

/* ==========================
   LOAD REGIONS
========================== */
async function loadRegions() {

    try {

        const response = await fetch(
            `${LOCATION_API_URL}/locations/regions`,
            {
                headers: getHeaders()
            }
        );

        const result = await response.json();

        console.log("Regions:", result);

        const regions = result.data || result;

        if (!Array.isArray(regions)) {
            console.error("Invalid regions data:", result);
            return;
        }

        regionSelect.innerHTML =
            '<option value="">Select Region</option>';

        regions.forEach(region => {

            regionSelect.innerHTML += `
                <option value="${region.code}">
                    ${decodeText(region.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error(
            "Failed to load regions",
            error
        );

    }

}

/* ==========================
   REGION CHANGE
========================== */
regionSelect.addEventListener(
    "change",
    async () => {

        const regionCode =
            regionSelect.value;

        const selectedText =
            regionSelect.options[
                regionSelect.selectedIndex
            ].text;

        provinceSelect.innerHTML =
            '<option value="">Select Province</option>';

        citySelect.innerHTML =
            '<option value="">Select City</option>';

        barangaySelect.innerHTML =
            '<option value="">Select Barangay</option>';

        if (!regionCode) {
            provinceSelect.disabled = true;
            citySelect.disabled = true;
            barangaySelect.disabled = true;
            return;
        }

        if (
            regionCode === "1300000000" ||
            selectedText.includes("NCR") ||
            selectedText.includes("Metro Manila") ||
            selectedText.includes("National Capital Region")
        ) {

            provinceSelect.innerHTML = `
                <option value="1300000000">
                    Metro Manila
                </option>
            `;
            
            provinceSelect.disabled = false;

            loadCities("1300000000");
            return;
        }

        provinceSelect.disabled = false;
        citySelect.disabled = true;
        barangaySelect.disabled = true;

        try {

            const response = await fetch(
                `${LOCATION_API_URL}/locations/regions/${regionCode}/provinces`,
                {
                    headers: getHeaders()
                }
            );

            const result =
                await response.json();

            const provinces =
                result.data || result;

            if (!Array.isArray(provinces))
                return;

            provinces.forEach(province => {

                provinceSelect.innerHTML += `
                    <option value="${province.code}">
                        ${decodeText(province.name)}
                    </option>
                `;

            });

        } catch (error) {

            console.error(
                "Failed to load provinces",
                error
            );

        }

    }
);

/* ==========================
   PROVINCE CHANGE
========================== */
provinceSelect.addEventListener(
    "change",
    () => {

        loadCities(
            provinceSelect.value
        );

    }
);

/* ==========================
   LOAD CITIES
========================== */
async function loadCities(
    codeToFetch
) {

    citySelect.innerHTML =
        '<option value="">Select City</option>';

    barangaySelect.innerHTML =
        '<option value="">Select Barangay</option>';

    if (!codeToFetch) {
        citySelect.disabled = true;
        barangaySelect.disabled = true;
        return;
    }

    citySelect.disabled = false;
    barangaySelect.disabled = true;

    try {

        const endpoint =
            (
                codeToFetch === "1300000000" ||
                regionSelect.value === "1300000000"
            )
                ? `${LOCATION_API_URL}/locations/regions/1300000000/cities-municipalities`
                : `${LOCATION_API_URL}/locations/provinces/${codeToFetch}/cities`;

        const response =
            await fetch(
                endpoint,
                {
                    headers: getHeaders()
                }
            );

        const result =
            await response.json();

        const cities =
            result.data || result;

        if (!Array.isArray(cities))
            return;

        cities.forEach(city => {

            citySelect.innerHTML += `
                <option value="${city.code}">
                    ${decodeText(city.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error(
            "Failed to load cities",
            error
        );

    }

}

/* ==========================
   CITY CHANGE
========================== */
citySelect.addEventListener(
    "change",
    async () => {

        const cityCode =
            citySelect.value;

        barangaySelect.innerHTML =
            '<option value="">Select Barangay</option>';

        if (!cityCode) {
            barangaySelect.disabled = true;
            return;
        }

        barangaySelect.disabled = false;

        try {

            const response =
                await fetch(
                    `${LOCATION_API_URL}/locations/cities/${cityCode}/barangays`,
                    {
                        headers: getHeaders()
                    }
                );

            const result =
                await response.json();

            const barangays =
                result.data || result;

            if (!Array.isArray(barangays))
                return;

            barangays.forEach(barangay => {

                barangaySelect.innerHTML += `
                    <option value="${barangay.code}">
                        ${decodeText(barangay.name)}
                    </option>
                `;

            });

        } catch (error) {

            console.error(
                "Failed to load barangays",
                error
            );

        }

    }
);