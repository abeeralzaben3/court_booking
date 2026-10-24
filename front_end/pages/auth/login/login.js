
// =====================================
// CourtBook - Login
// =====================================

// Existing PHP API
const LOGIN_API_URL =
  "/court_booking/back_end/auth/login.php";

// Elements
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const togglePasswordButton = document.getElementById("toggle-password");

const loginError = document.getElementById("login-error");
const submitButton = document.getElementById("login-submit");
const submitText = document.getElementById("login-button-text");
const spinner = document.getElementById("login-spinner");

// =====================================
// Show / Hide Password
// =====================================

togglePasswordButton.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";

  passwordInput.type = isHidden ? "text" : "password";
  togglePasswordButton.textContent = isHidden ? "Hide" : "Show";
  togglePasswordButton.setAttribute(
    "aria-label",
    isHidden ? "Hide password" : "Show password"
  );
  togglePasswordButton.setAttribute(
    "aria-pressed",
    String(isHidden)
  );
});

// =====================================
// Error Helpers
// =====================================

function showLoginError(message) {
  loginError.textContent = message;
  loginError.hidden = false;
}

function clearLoginError() {
  loginError.textContent = "";
  loginError.hidden = true;

  emailInput.classList.remove("input-invalid");
  passwordInput.classList.remove("input-invalid");
}

// =====================================
// Loading State
// =====================================

function setLoading(isLoading) {
  submitButton.disabled = isLoading;

  submitText.textContent = isLoading
    ? "Signing In..."
    : "Sign In";

  spinner.hidden = !isLoading;
}

// =====================================
// Validate Inputs
// =====================================

function validateLogin(email, password) {
  if (!email || !password) {
    if (!email) {
      emailInput.classList.add("input-invalid");
    }

    if (!password) {
      passwordInput.classList.add("input-invalid");
    }

    return "Please enter your email and password.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    emailInput.classList.add("input-invalid");
    return "Please enter a valid email address.";
  }

  return null;
}

// =====================================
// Submit Login
// =====================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearLoginError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const validationError = validateLogin(email, password);

  if (validationError) {
    showLoginError(validationError);
    return;
  }

  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  setLoading(true);

  try {
    const response = await fetch(LOGIN_API_URL, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showLoginError(
        data.message || "Login failed. Please try again."
      );
      return;
    }

    // Successful login
    if (typeof window.showAlert === "function") {
      window.showAlert(
        data.message || "Login successful!",
        "success"
      );
    }

    console.log("Login successful");
    console.log("User role:", data.user?.role);

    // Redirect will be added when player/admin
    // pages are ready.

  } catch (error) {
    console.error("Login request failed:", error);

    showLoginError(
      "Could not connect to the server. Please check XAMPP."
    );

  } finally {
    setLoading(false);
  }
});

// Clear errors when user edits inputs
emailInput.addEventListener("input", clearLoginError);
passwordInput.addEventListener("input", clearLoginError);
