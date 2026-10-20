const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.error || "Login failed.";
            return;
        }

        sessionStorage.setItem("nutriplanUser", JSON.stringify(data.user));
        window.location.href = "index.html";

    } catch (error) {
        message.textContent = "Could not connect to the server.";
    }
});