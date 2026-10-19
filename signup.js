const form = document.getElementById("signupForm");
const message = document.getElementById("signupMessage");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:3000/api/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.error || "Could not create account.";
            return;
        }

        message.textContent = "Account created! You can now log in.";
        form.reset();

    } catch (error) {
        message.textContent =
            "Could not connect to the server. Is it running?";
    }
});