// ================= ADMIN LOGIN =================

const loginForm = document.getElementById("adminLoginForm");

const loginMessage = document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");

const passwordInput =
    document.getElementById("password");


// ================= SHOW / HIDE PASSWORD =================

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.classList.remove("fa-eye");

        togglePassword.classList.add("fa-eye-slash");

    } else {

        passwordInput.type = "password";

        togglePassword.classList.remove("fa-eye-slash");

        togglePassword.classList.add("fa-eye");

    }

});


// ================= LOGIN FORM =================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    const loginButton =
        loginForm.querySelector(".login-btn");


    // Clear previous message

    loginMessage.style.display = "none";

    loginMessage.textContent = "";


    // Disable login button

    loginButton.disabled = true;

    loginButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Logging in...';


    try {

        const response = await fetch(
            "/api/admin/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        // Login failed

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Invalid email or password."
            );

        }


        // Login successful

        loginMessage.style.display = "block";

        loginMessage.style.background = "#e8f5e9";

        loginMessage.style.color = "#2e7d32";

        loginMessage.textContent =
            "Login successful! Opening dashboard...";


        // Go to dashboard

        setTimeout(() => {

            window.location.href = "/admin";

        }, 800);


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        loginMessage.style.display = "block";

        loginMessage.style.background = "#ffebee";

        loginMessage.style.color = "#c62828";

        loginMessage.textContent =
            error.message;


        // Enable button again

        loginButton.disabled = false;

        loginButton.innerHTML =
            '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';

    }

});