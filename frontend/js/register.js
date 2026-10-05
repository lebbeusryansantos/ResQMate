var API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? "http://127.0.0.1:8000" : "https://resqmate-backend.onrender.com";
const registerForm =
    document.getElementById("registerForm");

document.addEventListener("DOMContentLoaded", () => {
    const dobInput = document.getElementById("registerDob");
    if (dobInput) {
        const today = new Date().toISOString().split('T')[0];
        dobInput.max = today;
    }

    const phoneInput = document.getElementById("registerPhone");
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            this.value = this.value.replace(/\D/g, '');
            if (this.value.length < 11) {
                this.setCustomValidity('Phone number must be exactly 11 digits.');
            } else {
                this.setCustomValidity('');
            }
        });
    }

    const registerBtn = document.getElementById("registerBtn");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const passwordInput = document.getElementById("registerPassword");
    const registerInputs = registerForm.querySelectorAll("input");

    let isPasswordSecure = false;

    function validateForm() {
        const isFormValid = registerForm.checkValidity();
        const doPasswordsMatch = passwordInput.value === confirmPasswordInput.value && passwordInput.value.length > 0;

        if (isFormValid && doPasswordsMatch && isPasswordSecure) {
            registerBtn.disabled = false;
        } else {
            registerBtn.disabled = true;
        }
    }

    const validateConfirmPassword = () => {
        if (confirmPasswordInput.value !== passwordInput.value && confirmPasswordInput.value.length > 0) {
            confirmPasswordInput.setCustomValidity("Passwords do not match.");
        } else {
            confirmPasswordInput.setCustomValidity("");
        }
    };

    const validatePasswordRequirements = () => {
        const val = passwordInput.value;
        const reqLength = document.getElementById("req-length");
        const reqComplex = document.getElementById("req-complex");
        const reqUpper = document.getElementById("req-upper");
        const reqLower = document.getElementById("req-lower");
        const reqNum = document.getElementById("req-num");
        const reqSym = document.getElementById("req-sym");

        let lengthValid = val.length >= 8;

        let hasUpper = /[A-Z]/.test(val);
        let hasLower = /[a-z]/.test(val);
        let hasNum = /[0-9]/.test(val);
        let hasSym = /[^A-Za-z0-9]/.test(val);

        let conditionsMet = [hasUpper, hasLower, hasNum, hasSym].filter(Boolean).length;
        let complexValid = conditionsMet >= 3;

        if (reqLength) {
            reqLength.className = lengthValid ? "req-item req-valid" : "req-item req-invalid";
            reqLength.innerHTML = lengthValid
                ? `<i class="fa-solid fa-check"></i> At least 8 characters long`
                : `<i class="fa-solid fa-xmark"></i> At least 8 characters long`;
        }

        if (reqComplex) {
            reqComplex.className = complexValid ? "req-item req-valid" : "req-item req-invalid";
            reqComplex.innerHTML = complexValid
                ? `<i class="fa-solid fa-check"></i> At least 3 of the following:`
                : `<i class="fa-solid fa-xmark"></i> At least 3 of the following:`;
        }

        if (reqUpper) reqUpper.className = hasUpper ? "met" : "";
        if (reqLower) reqLower.className = hasLower ? "met" : "";
        if (reqNum) reqNum.className = hasNum ? "met" : "";
        if (reqSym) reqSym.className = hasSym ? "met" : "";

        isPasswordSecure = lengthValid && complexValid;
        if (!isPasswordSecure && val.length > 0) {
            passwordInput.setCustomValidity("Password does not meet requirements.");
        } else {
            passwordInput.setCustomValidity("");
        }
    };

    passwordInput.addEventListener("input", validatePasswordRequirements);
    passwordInput.addEventListener("input", validateConfirmPassword);
    confirmPasswordInput.addEventListener("input", validateConfirmPassword);

    const emailInput = document.getElementById("registerEmail");
    if (emailInput) {
        emailInput.addEventListener("input", function () {
            if (this.value.includes(" ")) {
                this.setCustomValidity("Email address must not contain spaces.");
            } else {
                this.setCustomValidity("");
            }
            validateSingleInput(this);
        });
    }

    function validateSingleInput(input) {
        let errorMsg = "";

        if (!input.validity.valid) {
            if (input.validity.valueMissing) {
                errorMsg = "please fill up this part";
            } else if (input.validity.customError) {
                errorMsg = input.validationMessage;
            } else if (input.validity.typeMismatch || input.validity.patternMismatch) {
                if (input.type === "email") errorMsg = "Please enter a valid email address.";
                else errorMsg = "Invalid format.";
            } else if (input.validity.tooShort) {
                errorMsg = `Must be at least ${input.minLength} characters.`;
            } else {
                errorMsg = input.validationMessage || "Invalid input.";
            }
        }

        let parentToAppendTo = input;
        if (input.parentElement.classList.contains('register-password-group')) {
            parentToAppendTo = input.parentElement;
        }

        let errorEl = parentToAppendTo.nextElementSibling;

        if (!errorEl || !errorEl.classList.contains("field-error-msg")) {
            errorEl = document.createElement("span");
            errorEl.className = "field-error-msg";
            parentToAppendTo.insertAdjacentElement("afterend", errorEl);
        }

        if (errorMsg) {
            input.classList.add("input-error");
            errorEl.textContent = errorMsg;
            errorEl.style.display = "block";
        } else {
            input.classList.remove("input-error");
            errorEl.style.display = "none";
        }
    }

    registerInputs.forEach(input => {
        input.addEventListener("blur", () => {
            validateSingleInput(input);
        });
        input.addEventListener("input", () => {
            if (input.classList.contains("input-error")) {
                validateSingleInput(input);
            }
            validateForm();
        });
    });

    registerForm.addEventListener("reset", (e) => {
        if (!confirm("Are you sure you want to clear all data?")) {
            e.preventDefault();
            return;
        }
        registerInputs.forEach(input => {
            input.classList.remove("input-error");
            let parentToAppendTo = input;
            if (input.parentElement.classList.contains('register-password-group')) {
                parentToAppendTo = input.parentElement;
            }
            let errorEl = parentToAppendTo.nextElementSibling;
            if (errorEl && errorEl.classList.contains("field-error-msg")) {
                errorEl.style.display = "none";
            }
        });
        setTimeout(validateForm, 0);
    });
});

registerForm.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();

        const first_name =
            document.getElementById("firstName").value;

        const last_name =
            document.getElementById("lastName").value;

        const email =
            document.getElementById("registerEmail").value;

        if (email.includes(" ")) {
            const emailInput = document.getElementById("registerEmail");
            if (emailInput) {
                emailInput.setCustomValidity("Email address must not contain spaces.");
                emailInput.dispatchEvent(new Event("input"));
                emailInput.focus();
            } else {
                alert("Email address must not contain spaces.");
            }
            return;
        }

        const phone_number =
            document.getElementById("registerPhone").value;

        const dob =
            document.getElementById("registerDob").value;

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {

            alert("Passwords do not match");
            return;
        }

        const registerBtn = document.getElementById("registerBtn");
        registerBtn.disabled = true;
        registerBtn.textContent = "Registering...";

        try {

            const response = await fetch(
                `${API_BASE_URL}/users/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        dob,
                        password
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                if (data.detail === "Email already registered") {
                    const emailInput = document.getElementById("registerEmail");
                    if (emailInput) {
                        emailInput.setCustomValidity("Email already registered.");
                        emailInput.dispatchEvent(new Event("input"));
                        emailInput.focus();
                    } else {
                        alert(data.detail);
                    }
                } else {
                    alert(data.detail || "Registration failed.");
                }
                return;
            }

            alert("Registration Successful! Please login.");

            document.getElementById("registerForm").reset();

            // Close Register Modal
            document
                .getElementById("registerModal")
                .classList.remove("show");

            // Open Login Modal
            document
                .getElementById("loginModal")
                .classList.add("show");

        }

        catch (error) {

            console.error(error);

            alert(
                "Cannot connect to server."
            );
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = "Register";
        }

    }
);