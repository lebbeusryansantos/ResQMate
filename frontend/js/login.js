const API_BASE_URL =
    window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
        ? "http://127.0.0.1:8000"
        : "https://resqmate-backend.onrender.com";

const API_URL = API_BASE_URL;
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

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
                    errorMsg = data.detail.error;
                    if (data.detail.attempts_remaining !== undefined) {
                        errorMsg += ` (${data.detail.attempts_remaining} attempts remaining)`;
                    }
                } else if (typeof data.detail === "string") {
                    errorMsg = data.detail;
                }
            }
            
            loginError.textContent = errorMsg;

            loginError.classList.add("show");

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Login";
            }

            return;
        }

        loginError.classList.remove("show");

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
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    }

});