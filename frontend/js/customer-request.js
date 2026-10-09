var API_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

const requestForm = document.getElementById("requestForm");
const assistanceTypeInput = document.getElementById("assistanceType");
const regionInput = document.getElementById("region");
const provinceInput = document.getElementById("province");
const cityInput = document.getElementById("city");
const barangayInput = document.getElementById("barangay");
const detailsInput = document.getElementById("details");
const priorityInput = document.getElementById("priority");
const calamityTypeInput = document.getElementById("calamityType");
const specificAddressInput = document.getElementById("specificAddress");
const characterCount = document.getElementById("characterCount");
const cancelButton = document.getElementById("cancelButton");
const assistanceOptions = document.querySelectorAll(".assistance-option");
const submitButton = document.querySelector(".submit-button");
const confirmationCheckbox = document.getElementById("confirmationCheckbox");

if (submitButton) {
    submitButton.disabled = true;
}

// 1. Handle Region Change (Detects NCR / Metro Manila vs Regular Provinces)
if (regionInput) {
    regionInput.addEventListener("change", function () {
        const selectedOption = this.options[this.selectedIndex];
        const selectedText = selectedOption.text;
        const selectedValue = this.value;

        // Reset lower fields when region changes
        if (cityInput) {
            cityInput.disabled = true;
            cityInput.value = "";
        }
        if (barangayInput) {
            barangayInput.disabled = true;
            barangayInput.value = "";
        }
        if (provinceInput) {
            provinceInput.value = "";
        }

        if (selectedValue) {
            // If NCR is selected, skip province and unlock City immediately!
            if (selectedText.includes("NCR") || selectedText.includes("National Capital Region") || selectedText.includes("Metro Manila")) {
                if (provinceInput) {
                    provinceInput.required = false; // Province isn't strictly needed for NCR
                    provinceInput.disabled = true;  // Keep province disabled so they don't get stuck
                }
                if (cityInput) {
                    cityInput.disabled = false; // Unlock city directly!
                }
            } else {
                // For other regions, enable the province dropdown
                if (provinceInput) {
                    provinceInput.required = true;
                    provinceInput.disabled = false;
                }
            }
        } else {
            if (provinceInput) provinceInput.disabled = true;
        }
        checkFormProgression();
    });
}

// 2. Handle Province Change (For non-NCR regions)
if (provinceInput) {
    provinceInput.addEventListener("change", function () {
        if (this.value) {
            if (cityInput) {
                cityInput.disabled = false;
            }
        } else {
            if (cityInput) {
                cityInput.disabled = true;
                cityInput.value = "";
            }
            if (barangayInput) {
                barangayInput.disabled = true;
                barangayInput.value = "";
            }
        }
        checkFormProgression();
    });
}

// 3. Handle City Change -> Unlocks Barangay
if (cityInput) {
    cityInput.addEventListener("change", function () {
        if (this.value) {
            if (barangayInput) barangayInput.disabled = false;
        } else {
            if (barangayInput) {
                barangayInput.disabled = true;
                barangayInput.value = "";
            }
        }
        checkFormProgression();
    });
}

if (barangayInput) {
    barangayInput.addEventListener("change", checkFormProgression);
}

if (specificAddressInput) {
    specificAddressInput.addEventListener("input", checkFormProgression);
}

if (calamityTypeInput) {
    calamityTypeInput.addEventListener("change", checkFormProgression);
}

if (detailsInput) {
    detailsInput.addEventListener("input", checkFormProgression);
}

if (priorityInput) {
    priorityInput.addEventListener("change", checkFormProgression);
}

function checkFormProgression() {
    let hasAssistance = false;
    assistanceOptions.forEach(option => {
        if (option.classList.contains("active")) {
            const qtyInput = option.querySelector('.cart-qty');
            if (qtyInput && parseInt(qtyInput.value) > 0) {
                hasAssistance = true;
            }
        }
    });

    const locationHelperText = document.getElementById("locationHelperText");
    if (hasAssistance) {
        if (locationHelperText) locationHelperText.style.display = "none";
        if (regionInput) regionInput.disabled = false;
    } else {
        if (locationHelperText) locationHelperText.style.display = "block";
        if (regionInput) {
            regionInput.disabled = true;
            regionInput.value = "";
        }
        if (provinceInput) {
            provinceInput.disabled = true;
            provinceInput.value = "";
        }
        if (cityInput) {
            cityInput.disabled = true;
            cityInput.value = "";
        }
        if (barangayInput) {
            barangayInput.disabled = true;
            barangayInput.value = "";
        }
    }

    const hasBarangay = barangayInput && barangayInput.value !== "";
    if (hasBarangay) {
        if (specificAddressInput) specificAddressInput.disabled = false;
        const landmarkInput = document.getElementById("landmark");
        if (landmarkInput) landmarkInput.disabled = false;
    } else {
        if (specificAddressInput) {
            specificAddressInput.disabled = true;
            specificAddressInput.value = "";
        }
        const landmarkInput = document.getElementById("landmark");
        if (landmarkInput) {
            landmarkInput.disabled = true;
            landmarkInput.value = "";
        }
    }

    const hasSpecificAddress = specificAddressInput && specificAddressInput.value.trim().length >= 5;
    if (hasSpecificAddress) {
        if (calamityTypeInput) calamityTypeInput.disabled = false;
    } else {
        if (calamityTypeInput) {
            calamityTypeInput.disabled = true;
            calamityTypeInput.value = "";
        }
    }

    const hasCalamity = calamityTypeInput && calamityTypeInput.value !== "";
    if (hasCalamity) {
        if (detailsInput) detailsInput.disabled = false;
    } else {
        if (detailsInput) {
            detailsInput.disabled = true;
            detailsInput.value = "";
        }
        if (characterCount) characterCount.textContent = "0";
    }

    const detailsLen = detailsInput ? detailsInput.value.trim().length : 0;
    const detailsHelperText = document.getElementById("detailsHelperText");
    if (detailsLen >= 30) {
        if (detailsHelperText) detailsHelperText.style.color = "green";
        if (priorityInput) priorityInput.disabled = false;
    } else {
        if (detailsHelperText) detailsHelperText.style.color = "#ef4444";
        if (priorityInput) {
            priorityInput.disabled = true;
            priorityInput.value = "";
        }
    }

    const hasPriority = priorityInput && priorityInput.value !== "";
    if (hasPriority) {
        if (confirmationCheckbox) confirmationCheckbox.disabled = false;
    } else {
        if (confirmationCheckbox) {
            confirmationCheckbox.disabled = true;
            confirmationCheckbox.checked = false;
        }
    }

    if (requestForm && submitButton) {
        if (requestForm.checkValidity() && confirmationCheckbox && confirmationCheckbox.checked) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }
}

if (confirmationCheckbox) {
    confirmationCheckbox.addEventListener("change", checkFormProgression);
}

assistanceOptions.forEach(option => {
    option.addEventListener("click", function () {
        this.classList.toggle("active");
        
        const inputsDiv = this.querySelector('.cart-inputs');
        if (inputsDiv) {
            if (this.classList.contains("active")) {
                inputsDiv.style.display = "block";
            } else {
                inputsDiv.style.display = "none";
            }
        }
        
        // Let assistanceType be "Multiple" always if anything is selected, or keep it generic
        assistanceTypeInput.value = "Other"; // Use Other as a fallback category, since we now rely on requested_items_summary
        
        checkFormProgression();
    });
});

document.querySelectorAll('.cart-qty, .cart-unit').forEach(input => {
    input.addEventListener("change", checkFormProgression);
    input.addEventListener("input", checkFormProgression);
});

if (detailsInput && characterCount) {
    detailsInput.addEventListener("input", function () {
        characterCount.textContent = this.value.length;
    });
}

if (cancelButton) {
    cancelButton.addEventListener("click", function (e) {
        if (!confirm("Are you sure you want to clear all data?")) {
            e.preventDefault();
            return;
        }
        requestForm.reset();

        assistanceTypeInput.value = "Other";

        assistanceOptions.forEach(option => {
            option.classList.remove("active");
            const inputsDiv = option.querySelector('.cart-inputs');
            if (inputsDiv) inputsDiv.style.display = "none";
            
            const qtyInput = option.querySelector('.cart-qty');
            if (qtyInput) qtyInput.value = "1";
        });

        if (characterCount) {
            characterCount.textContent = "0";
        }
        
        setTimeout(checkFormProgression, 50); // Small delay to let reset() finish
    });
}

document.addEventListener("DOMContentLoaded", function() {
    checkFormProgression();
});

if (requestForm) {
    requestForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("Form submission triggered!");

        const requestError = document.getElementById("requestError");

        if (!requestForm.checkValidity()) {
            if (requestError) {
                requestError.textContent = "Please complete all required fields.";
                requestError.style.display = "block";
            }
            return;
        } else if (requestError) {
            requestError.style.display = "none";
        }

        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            alert("You are not logged in. Please log in first.");
            return;
        }

        let user;

        try {
            user = JSON.parse(storedUser);
        } catch (error) {
            alert("Invalid user information. Please log in again.");
            return;
        }

        if (!user.user_id) {
            alert("User ID was not found. Please log in again.");
            return;
        }

        const assistanceType = assistanceTypeInput.value.trim();
        console.log("Region:", regionInput.value);
        console.log("Province:", provinceInput.value);
        console.log("City:", cityInput.value);
        console.log("Barangay:", barangayInput.value);
        console.log("Priority:", priorityInput.value);
        console.log("Details:", detailsInput.value);

        // --- CAPTURE TEXT NAMES PROPERLY FOR SUBMISSION ---
        const regionSelectedOption = regionInput ? regionInput.options[regionInput.selectedIndex] : null;
        const regionText = regionSelectedOption ? regionSelectedOption.text : "";

        let provinceText = "";
        if (provinceInput && !provinceInput.disabled && provinceInput.selectedIndex > 0) {
            provinceText = provinceInput.options[provinceInput.selectedIndex].text;
        } else if (regionText.includes("NCR") || regionText.includes("National Capital Region") || regionText.includes("Metro Manila")) {
            provinceText = "Metro Manila";
        }

        const cityText = cityInput && cityInput.selectedIndex > 0
            ? cityInput.options[cityInput.selectedIndex].text
            : "";

        const barangayText = barangayInput && barangayInput.selectedIndex > 0
            ? barangayInput.options[barangayInput.selectedIndex].text
            : "";

        // Smart fallback for Metro Manila / NCR
        if (
            regionText.includes("NCR") ||
            regionText.includes("National Capital Region") ||
            regionText.includes("Metro Manila")
        ) {
            provinceText = "Metro Manila";
        }
        // ----------------------------------------------

        const details = detailsInput.value.trim();
        const priority = priorityInput.value;
        const calamityType = calamityTypeInput ? calamityTypeInput.value.trim() : "";
        const specificAddress = specificAddressInput ? specificAddressInput.value.trim() : "";

        // Build requested_items_summary
        let requestedItemsArr = [];
        assistanceOptions.forEach(option => {
            if (option.classList.contains("active")) {
                const typeName = option.getAttribute("data-type");
                const qtyInput = option.querySelector('.cart-qty');
                const unitSelect = option.querySelector('.cart-unit');
                
                let qty = qtyInput ? qtyInput.value : "1";
                let unit = unitSelect ? unitSelect.value : "";
                
                requestedItemsArr.push(`${typeName}: ${qty} ${unit}`.trim());
            }
        });
        const requestedItemsSummary = requestedItemsArr.join(" | ");

        console.log("assistanceType =", assistanceType);
        console.log("barangayText =", barangayText);
        console.log("cityText =", cityText);
        console.log("details =", details);
        console.log("priority =", priority);

        if (!assistanceType || !barangayText || !cityText || !details || !priority || !calamityType || !specificAddress) {
            if (requestError) {
                requestError.textContent = "Please complete all required fields.";
                requestError.style.display = "block";
            } else {
                alert("Please complete all required fields.");
            }
            return;
        }

        const submitButton = requestForm.querySelector(".submit-button");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
        }

        try {
            const userData = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            const token = userData.token;

            console.log("Submitting to:", `${API_URL}/requests/create`);
            const response = await fetch(
                `${API_URL}/requests/create`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: user.user_id,
                        assistance_type: assistanceType,
                        barangay: barangayText,
                        city: cityText,
                        province: provinceText,
                        region: regionText,
                        request_details: details,
                        priority: priority,
                        calamity_type: calamityType,
                        specific_address: specificAddress,
                        requested_items_summary: requestedItemsSummary || "None specified"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Failed to submit request."
                );
            }

            alert("Your assistance request has been submitted successfully.");
            window.location.href = "requests.html";

            requestForm.reset();
            assistanceTypeInput.value = "Food";

            assistanceOptions.forEach(option => {
                option.classList.remove("active");

                if (option.getAttribute("data-type") === "Food") {
                    option.classList.add("active");
                }
            });

            if (characterCount) {
                characterCount.textContent = "0";
            }

        } catch (error) {
            console.error(error);
            alert(`Failed to submit request.\n\n${error.message}`);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Submit Request";
            }
        }
    });
}