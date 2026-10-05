const API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

const API_URL = API_BASE_URL;
async function loadModals() {

    // Login Modal
    const loginResponse = await fetch("components/login-modal.html");
    const loginHtml = await loginResponse.text();
    document.body.insertAdjacentHTML("beforeend", loginHtml);

    // Register Modal
    const registerResponse = await fetch("components/register-modal.html");
    const registerHtml = await registerResponse.text();
    document.body.insertAdjacentHTML("beforeend", registerHtml);


    initializeModals();
}

function initializeModals() {

    const loginBtn = document.querySelector(".login-btn");
    const signupBtn = document.querySelector(".signup-btn");
    const requestBtn = document.getElementById("requestAssistanceBtn");
    const learnMoreBtn = document.getElementById("learnMoreBtn");

    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");

    const closeLogin = document.querySelector(".close-btn");
    const closeRegister = document.querySelector(".close-register");

    // Open Login
    loginBtn.addEventListener("click", () => {

        loginModal.classList.add("show");
        if (typeof window.checkLockoutState === "function") window.checkLockoutState();

        const loginError =
            document.getElementById("loginError");

        loginError.classList.remove("show");
    });

    if (requestBtn) {

        requestBtn.addEventListener("click", () => {

            loginModal.classList.add("show");
        if (typeof window.checkLockoutState === "function") window.checkLockoutState();

            const loginError =
                document.getElementById("loginError");

            if (loginError) {
                loginError.classList.remove("show");
            }

        });

    }

    if (learnMoreBtn) {

        learnMoreBtn.addEventListener("click", () => {

            document
                .getElementById("featuresSection")
                .scrollIntoView({
                    behavior: "smooth"
                });

        });

    }

    // Open Register
    signupBtn.addEventListener("click", () => {
        const dobInput = document.getElementById("registerDob");
        if (dobInput) {
            dobInput.max = new Date().toISOString().split('T')[0];
        }
        registerModal.classList.add("show");
    });

    function resetLoginModal() {
        const loginForm = document.getElementById("loginForm");
        if (loginForm) loginForm.reset();

        const loginError = document.getElementById("loginError");
        if (loginError) loginError.classList.remove("show");

        document.querySelectorAll("#loginForm input").forEach(input => {
            input.classList.remove("input-error");
        });

        const loginBtn = document.getElementById("loginBtn");
        if (loginBtn) loginBtn.disabled = true;
    }

    function resetRegisterModal() {
        const registerForm = document.getElementById("registerForm");
        if (registerForm) registerForm.reset();

        const registerError = document.getElementById("registerError");
        if (registerError) {
            registerError.classList.remove("show");
            registerError.classList.remove("success-alert");
        }

        document.querySelectorAll("#registerForm input").forEach(input => {
            input.classList.remove("input-error");
        });

        const registerBtn = document.getElementById("registerBtn");
        if (registerBtn) registerBtn.disabled = true;
    }

    // Close Login
    closeLogin.addEventListener("click", () => {
        loginModal.classList.remove("show");
        resetLoginModal();
    });

    // Close Register
    closeRegister.addEventListener("click", () => {
        registerModal.classList.remove("show");
        resetRegisterModal();
    });

    // Click Outside Modal
    window.addEventListener("click", (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove("show");
            resetLoginModal();
        }

        if (e.target === registerModal) {
            registerModal.classList.remove("show");
            resetRegisterModal();
        }
    });

    // Escape Key to Close
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (loginModal && loginModal.classList.contains("show")) {
                loginModal.classList.remove("show");
                resetLoginModal();
            }
            if (registerModal && registerModal.classList.contains("show")) {
                registerModal.classList.remove("show");
                resetRegisterModal();
            }
        }
    });

    // Register -> Login
    const openLoginLink =
        document.getElementById("openLoginLink");

    if (openLoginLink) {
        openLoginLink.addEventListener(
            "click",
            (e) => {
                e.preventDefault();
                registerModal.classList.remove("show");
                resetRegisterModal();
                loginModal.classList.add("show");
        if (typeof window.checkLockoutState === "function") window.checkLockoutState();
            }
        );
    }

    // Login -> Register
    const openRegisterLink =
        document.getElementById("openRegisterLink");

    if (openRegisterLink) {
        openRegisterLink.addEventListener(
            "click",
            (e) => {
                e.preventDefault();
                loginModal.classList.remove("show");
                resetLoginModal();

                const dobInput = document.getElementById("registerDob");
                if (dobInput) {
                    dobInput.max = new Date().toISOString().split('T')[0];
                }

                registerModal.classList.add("show");
            }
        );
    }

    // ==========================
    // REGISTER
    // ==========================

    const phoneInput = document.getElementById("registerPhone");
    if (phoneInput) {
        phoneInput.addEventListener('input', async function (e) {
            // 1. Strip all non-numeric characters immediately
            this.value = this.value.replace(/\D/g, '');

            // 2. Force a hard cap of 11 digits so it never breaks the layout
            if (this.value.length > 11) {
                this.value = this.value.slice(0, 11);
            }

            // 3. Strict prefix and length validation
            if (this.value.length === 11 && !this.value.startsWith('09')) {
                this.setCustomValidity('<span style="color: #f59e0b">Maximum of 11 characters reached.</span><br>Phone number must start with 09.');
            } else if (this.value.length > 0 && this.value[0] !== '0') {
                this.setCustomValidity('Phone number must start with 09.');
            } else if (this.value.length > 1 && this.value[1] !== '9') {
                this.setCustomValidity('Phone number must start with 09.');
            } else if (this.value.length > 0 && this.value.length < 11) {
                this.setCustomValidity('Phone number must be exactly 11 digits.');
            } else {
                this.setCustomValidity(''); // Clear errors if perfectly valid so far
            }

            // 4. ONLY check the database if it is exactly 11 digits AND starts with 09
            if (this.value.length === 11 && this.value.startsWith('09')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/users/check-phone?phone_number=${encodeURIComponent(this.value)}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.exists) {
                            this.setCustomValidity('<span style="color: #f59e0b">Maximum of 11 characters reached.</span><br>Phone number already registered.');
                        }
                    }
                } catch (err) {
                    console.error("Error checking phone", err);
                }
            }

            // 5. Update the UI error message
            if (typeof validateSingleInput === 'function') {
                validateSingleInput(this);
            }
        });
    }

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {
        const registerBtn = document.getElementById("registerBtn");
        const clearBtn = document.getElementById("clearBtn");
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

            let hasInput = false;
            registerInputs.forEach(input => {
                if (input.value.trim() !== '') {
                    hasInput = true;
                }
            });
            clearBtn.disabled = !hasInput;
        }

        const validateConfirmPassword = () => {
            if (confirmPasswordInput.value !== passwordInput.value && confirmPasswordInput.value.length > 0) {
                confirmPasswordInput.setCustomValidity("Passwords do not match.");
            } else {
                confirmPasswordInput.setCustomValidity("");
            }

            // Only update the UI if the user has already interacted with it or if there's an active error to clear
            if (confirmPasswordInput.classList.contains("input-error") || confirmPasswordInput.value.length > 0) {
                validateSingleInput(confirmPasswordInput);
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
            let complexValid = conditionsMet >= 4;

            if (reqLength) {
                reqLength.className = lengthValid ? "req-item req-valid" : "req-item req-invalid";
                reqLength.innerHTML = lengthValid
                    ? `<i class="fa-solid fa-check"></i> At least 8 characters long`
                    : `<i class="fa-solid fa-xmark"></i> At least 8 characters long`;
            }

            if (reqComplex) {
                reqComplex.className = complexValid ? "req-item req-valid" : "req-item req-invalid";
                reqComplex.innerHTML = complexValid
                    ? `<i class="fa-solid fa-check"></i> Must contain all of the following:`
                    : `<i class="fa-solid fa-xmark"></i> Must contain all of the following:`;
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
                if (this.validity.customError) {
                    this.setCustomValidity("");
                    validateSingleInput(this);
                }
            });
            emailInput.addEventListener("blur", async function () {
                if (this.value && !this.validity.typeMismatch && !this.validity.valueMissing) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/users/check-email?email=${encodeURIComponent(this.value)}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.exists) {
                                this.setCustomValidity("Email already registered.");
                            } else {
                                this.setCustomValidity("");
                            }
                            validateSingleInput(this);
                            validateForm();
                        }
                    } catch (e) {
                        console.error("Failed to check email", e);
                    }
                }
            });
        }

        function validateSingleInput(input) {
            let errorMsg = "";
            let isMaxCharWarning = false;

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
            } else if (input.maxLength > 0 && input.value.length >= input.maxLength) {
                errorMsg = `Maximum of ${input.maxLength} characters reached.`;
                isMaxCharWarning = true;
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
                if (!isMaxCharWarning) {
                    input.classList.add("input-error");
                    errorEl.style.color = "";
                } else {
                    input.classList.remove("input-error");
                    errorEl.style.color = "#f59e0b"; // amber for warning
                }
                errorEl.innerHTML = errorMsg;
                errorEl.style.display = "block";
            } else {
                input.classList.remove("input-error");
                errorEl.style.color = "";
                errorEl.style.display = "none";
            }
        }

        registerInputs.forEach(input => {
            input.addEventListener("blur", () => {
                validateSingleInput(input);
            });
            input.addEventListener("input", () => {
                let parentToAppendTo = input;
                if (input.parentElement.classList.contains('register-password-group')) {
                    parentToAppendTo = input.parentElement;
                }
                let errorEl = parentToAppendTo.nextElementSibling;
                let isErrorVisible = errorEl && errorEl.style.display === "block";

                if (isErrorVisible || (input.maxLength > 0 && input.value.length >= input.maxLength)) {
                    validateSingleInput(input);
                }
                validateForm();
            });
        });

        registerForm.addEventListener("reset", () => {
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

                const password =
                    document.getElementById("registerPassword").value;

                const phone_number =
                    document.getElementById("registerPhone").value;

                const dob =
                    document.getElementById("registerDob").value;

                const confirmPassword =
                    document.getElementById("confirmPassword").value;

                const registerError =
                    document.getElementById("registerError");

                if (!registerForm.checkValidity()) {
                    registerError.textContent = "Please ensure all fields are filled, emails are valid, and passwords are at least 8 characters.";
                    registerError.classList.add("show");
                    return;
                }

                if (password !== confirmPassword) {

                    registerError.textContent =
                        "Passwords do not match.";

                    registerError.classList.add("show");

                    return;
                }

                const registerBtn = document.getElementById("registerBtn");
                const originalText = registerBtn.textContent;
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
                                password,
                                phone_number,
                                dob
                            })
                        }
                    );

                    const data =
                        await response.json();

                    const registerError =
                        document.getElementById("registerError");

                    if (!response.ok) {
                        if (data.detail === "Email already registered") {
                            const emailInput = document.getElementById("registerEmail");
                            if (emailInput) {
                                emailInput.setCustomValidity("Email already registered.");
                                emailInput.dispatchEvent(new Event("input"));
                                emailInput.focus();
                            } else {
                                registerError.textContent = data.detail;
                                registerError.classList.add("show");
                            }
                        } else {
                            registerError.textContent = data.detail || "Registration failed.";
                            registerError.classList.add("show");
                        }
                        return;
                    }

                    registerError.classList.remove("show");

                    registerForm.reset();

                    registerModal.classList.remove("show");
                    loginModal.classList.add("show");
        if (typeof window.checkLockoutState === "function") window.checkLockoutState();

                    alert(
                        "Registration Successful! Please login."
                    );

                }

                catch (error) {

                    console.error(error);

                    alert(
                        "Cannot connect to server."
                    );

                } finally {
                    const registerBtn = document.getElementById("registerBtn");
                    if (registerBtn) {
                        registerBtn.disabled = false;
                        registerBtn.textContent = "Register";
                    }
                }

            }
        );

    }

    const registerBackToTopBtn = document.getElementById("registerBackToTopBtn");
    if (registerBackToTopBtn) {
        registerBackToTopBtn.addEventListener("click", () => {
            const registerRight = document.querySelector(".register-right");
            if (registerRight) {
                registerRight.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    const loginBackToTopBtn = document.getElementById("loginBackToTopBtn");
    if (loginBackToTopBtn) {
        loginBackToTopBtn.addEventListener("click", () => {
            const loginRight = document.querySelector(".login-right");
            if (loginRight) {
                loginRight.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ==========================
    // LOGIN
    // ==========================

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {
        const loginBtn = document.getElementById("loginBtn");
        const loginInputs = loginForm.querySelectorAll("input");

        function validateLoginForm() {
            if (loginForm.checkValidity()) {
                loginBtn.disabled = false;
            } else {
                loginBtn.disabled = true;
            }
        }

        function validateSingleLoginInput(input) {
            let errorMsg = "";

            if (!input.validity.valid) {
                if (input.validity.valueMissing) {
                    errorMsg = "please fill up this part";
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
            if (input.parentElement.classList.contains('login-password-group')) {
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

        loginInputs.forEach(input => {
            input.addEventListener("blur", () => {
                validateSingleLoginInput(input);
            });
            input.addEventListener("input", () => {
                if (input.classList.contains("input-error")) {
                    validateSingleLoginInput(input);
                }
                validateLoginForm();
            });
        });

        loginForm.addEventListener("reset", () => {
            loginInputs.forEach(input => {
                input.classList.remove("input-error");
                let parentToAppendTo = input;
                if (input.parentElement.classList.contains('login-password-group')) {
                    parentToAppendTo = input.parentElement;
                }
                let errorEl = parentToAppendTo.nextElementSibling;
                if (errorEl && errorEl.classList.contains("field-error-msg")) {
                    errorEl.style.display = "none";
                }
            });
            setTimeout(validateLoginForm, 0);
        });

        loginForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();

                const loginError =
                    document.getElementById("loginError");

                if (!loginForm.checkValidity()) {
                    loginError.textContent = "Please provide a valid email and password (min 8 characters).";
                    loginError.classList.add("show");
                    return;
                }

                const email =
                    document.getElementById("email").value;

                const password =
                    document.getElementById("password").value;

                const loginBtn = document.getElementById("loginBtn");
                const originalText = loginBtn.textContent;
                loginBtn.disabled = true;
                loginBtn.textContent = "Logging in...";

                try {

                    const response = await fetch(
                        `${API_BASE_URL}/users/login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );

                    const data = await response.json();

                    const loginError =
                        document.getElementById("loginError");

                    if (!response.ok) {
                        if (window.lockoutInterval) clearInterval(window.lockoutInterval);
                        let errorMsg = "Invalid Credentials";
                        if (data && data.detail) {
                            if (typeof data.detail === 'string') {
                                errorMsg = data.detail;
                            } else if (data.detail.error) {
                                if (data.detail.attempts_remaining !== undefined && data.detail.attempts_remaining > 0) {
                                    errorMsg = `Invalid credentials. You have ${data.detail.attempts_remaining} attempts remaining before temporary lockout.`;
                                } else if (data.detail.locked_until) {
                                    const lockedUntil = new Date(data.detail.locked_until + "Z");
                                    const updateTimer = () => {
                                        const seconds = Math.ceil((lockedUntil - new Date()) / 1000);
                                        if (seconds > 0) {
                                            loginError.textContent = `Account locked. Try again in ${seconds} seconds.`;
                                            const btn = document.getElementById("loginBtn");
                                            if (btn) btn.disabled = true;
                                        } else {
                                            loginError.textContent = "Lockout ended. You may try again.";
                                            const btn = document.getElementById("loginBtn");
                                            if (btn) btn.disabled = false;
                                            clearInterval(window.lockoutInterval);
                                            window.isLockedOut = false;
                                        }
                                    };
                                    window.isLockedOut = true;
                                    updateTimer();
                                    window.lockoutInterval = setInterval(updateTimer, 1000);
                                    loginError.classList.add("show");
                                    return;
                                } else {
                                    errorMsg = data.detail.error;
                                }
                            }
                        }

                        loginError.textContent = errorMsg;
                        loginError.classList.add("show");
                        return;
                    }

                    loginError.classList.remove("show");

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data)
                    );

                    localStorage.setItem(
                        "token",
                        data.token
                    );

                    console.log("TOKEN:", data.token);

                    if (data.role === "admin") {

                        window.location.href =
                            "admin/dashboard.html";
                    }

                    else if (data.role === "staff") {

                        window.location.href =
                            "staff/dashboard.html";
                    }

                    else {

                        window.location.href =
                            "customer/dashboard.html";
                    }

                }

                catch (error) {

                    console.error(error);

                    alert(
                        "Cannot connect to server."
                    );

                } finally {
                    const loginBtn = document.getElementById("loginBtn");
                    if (loginBtn) {
                        loginBtn.textContent = "Login";
                        if (!window.isLockedOut) {
                            loginBtn.disabled = false;
                        }
                    }
                }

            }
        );

    }

    document.querySelectorAll(".toggle-password")
        .forEach(icon => {

            icon.addEventListener("click", () => {

                const input =
                    document.getElementById(
                        icon.dataset.target
                    );

                if (input.type === "password") {

                    input.type = "text";
                    icon.classList.replace(
                        "fa-eye",
                        "fa-eye-slash"
                    );

                } else {

                    input.type = "password";
                    icon.classList.replace(
                        "fa-eye-slash",
                        "fa-eye"
                    );

                }

            });

        });

}

loadModals();