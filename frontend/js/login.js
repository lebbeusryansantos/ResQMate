const API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

const API_URL = API_BASE_URL;
const loginForm = document.getElementById("loginForm");

let lockoutInterval = null;

window.checkLockoutState = function() {
    const lockoutExpirationStr = localStorage.getItem("lockoutExpiration");
    if (!lockoutExpirationStr) return;

    const expirationTime = parseInt(lockoutExpirationStr, 10);
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const loginError = document.getElementById("loginError");

    if (lockoutInterval) {
        clearInterval(lockoutInterval);
    }

    if (expirationTime > Date.now()) {
        const updateTimer = () => {
            const currentNow = Date.now();
            if (expirationTime > currentNow) {
                const remaining = Math.ceil((expirationTime - currentNow) / 1000);
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = `Locked (${remaining}s)`;
                }
                if (loginError) {
                    loginError.textContent = `Too many failed attempts. Account locked. Try again in ${remaining}s.`;
                    loginError.classList.add("show");
                }
            } else {
                clearInterval(lockoutInterval);
                lockoutInterval = null;
                localStorage.removeItem("lockoutExpiration");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Login";
                }
                if (loginError) {
                    loginError.classList.remove("show");
                    loginError.textContent = "";
                }
            }
        };

        updateTimer();
        lockoutInterval = setInterval(updateTimer, 1000);
    } else {
        localStorage.removeItem("lockoutExpiration");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
        if (loginError) {
            loginError.classList.remove("show");
            loginError.textContent = "";
        }
    }
}

// Global Check
window.checkLockoutState();

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email.includes(" ")) {
        const errEl = document.getElementById("loginError");
        if (errEl) {
            errEl.textContent = "Email address must not contain spaces.";
            errEl.classList.add("show");
        }
        return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/users/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            let errorMsg = "Invalid username or password";
            if (data.detail) {
                if (data.detail.error) {
                    if (data.detail.locked_until) {
                        let lu = data.detail.locked_until;
                        if (!lu.endsWith("Z")) lu += "Z";
                        const lockedUntilDate = new Date(lu);
                        const remaining_seconds = (lockedUntilDate.getTime() - Date.now()) / 1000;
                        const expirationTime = Date.now() + (remaining_seconds * 1000);
                        localStorage.setItem("lockoutExpiration", expirationTime);
                        window.checkLockoutState();
                        return;
                    }
                    errorMsg = data.detail.error;
                    if (data.detail.attempts_remaining !== undefined) {
                        errorMsg += ` (${data.detail.attempts_remaining} attempts remaining)`;
                    }
                } else if (typeof data.detail === "string") {
                    errorMsg = data.detail;
                }
            }
            
            const errEl = document.getElementById("loginError");
            if (errEl) {
                errEl.textContent = errorMsg;
                errEl.classList.add("show");
            }

            if (submitBtn && !localStorage.getItem("lockoutExpiration")) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Login";
            }

            return;
        }

        const errEl = document.getElementById("loginError");
        if (errEl) errEl.classList.remove("show");

        localStorage.setItem(
            "user",
            JSON.stringify(data)
        );
        console.log("TOKEN FROM API:", data.token);

        localStorage.setItem("token", data.token);

        console.log(
            "TOKEN AFTER SAVE:",
            localStorage.getItem("token")
        );

        alert("Login Successful");

        if (data.role === "admin") {
            window.location.href = "admin/dashboard.html";
        }
        else if (data.role === "staff") {
            window.location.href = "staff/dashboard.html";
        }
        else {
            window.location.href = "customer/dashboard.html";
        }

    }
    catch (error) {
        console.error(error);
        alert("Cannot connect to server.");
    } finally {
        if (submitBtn && !localStorage.getItem("lockoutExpiration")) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    }
});