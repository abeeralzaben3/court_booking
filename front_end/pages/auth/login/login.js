
"use strict";

// =====================================
// CourtBook - Login
// =====================================

// Existing PHP API
const LOGIN_API_URL =
  "/court_booking/back_end/auth/login.php";

// Page URLs
const PLAYER_HOME_URL =
  "/court_booking/front_end/pages/player/home/home.html";

// Set this when the Admin Dashboard is ready.
const ADMIN_DASHBOARD_URL = "";

// =====================================
// Elements
// =====================================

const loginForm =
  document.getElementById("login-form");

const emailInput =
  document.getElementById("login-email");

const passwordInput =
  document.getElementById("login-password");

const togglePasswordButton =
  document.getElementById("toggle-password");

const loginError =
  document.getElementById("login-error");

const submitButton =
  document.getElementById("login-submit");

const submitText =
  document.getElementById("login-button-text");

const spinner =
  document.getElementById("login-spinner");

// =====================================
// Show / Hide Password
// =====================================

togglePasswordButton.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";

  passwordInput.type = isHidden
    ? "text"
    : "password";

  togglePasswordButton.textContent = isHidden
    ? "Hide"
    : "Show";

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
// Safe Return URL
// =====================================

// The user may arrive here after clicking
// Book Now on a court.
//
// Example:
// login.html?next=/court_booking/front_end/
// pages/player/booking/booking.html?court_id=1
//
// Only allow local CourtBook frontend paths.

function getSafeReturnUrl() {
  const params = new URLSearchParams(
    window.location.search
  );

  const next = params.get("next");

  if (!next) {
    return null;
  }

  try {
    const url = new URL(next, window.location.origin);

    // Never redirect to another website.
    if (url.origin !== window.location.origin) {
      return null;
    }

    // Only allow pages inside CourtBook frontend.
    if (
      !url.pathname.startsWith(
        "/court_booking/front_end/"
      )
    ) {
      return null;
    }

    // Block encoded or unusual path traversal.
    const segments = url.pathname.split("/");

    if (
      segments.includes(".") ||
      segments.includes("..") ||
      url.pathname.includes("\\")
    ) {
      return null;
    }

    // Do not redirect back to the login page.
    if (
      url.pathname ===
      "/court_booking/front_end/pages/auth/login/login.html"
    ) {
      return null;
    }

    return url.pathname + url.search + url.hash;

  } catch (error) {
    console.warn("Invalid return URL:", error);
    return null;
  }
}

// =====================================
// Redirect After Login
// =====================================

function redirectAfterLogin(user) {
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  // PLAYER
  if (role === "player") {

    // If user clicked Book Now before login,
    // send them back to the selected court.
    const returnUrl = getSafeReturnUrl();

    if (returnUrl) {
      window.location.replace(returnUrl);
      return true;
    }

    // Normal login goes to Home.
    window.location.replace(PLAYER_HOME_URL);
    return true;
  }

  // ADMIN
  if (role === "admin") {
    if (ADMIN_DASHBOARD_URL) {
      window.location.replace(ADMIN_DASHBOARD_URL);
      return true;
    }

    showLoginError(
      "Admin login successful, but the Admin Dashboard " +
      "has not been connected yet."
    );

    return false;
  }

  showLoginError(
    "Login successful, but your account role is not recognized."
  );

  return false;
}

// =====================================
// Submit Login
// =====================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearLoginError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const validationError = validateLogin(
    email,
    password
  );

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

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    if (!response.ok || data.success !== true) {
      showLoginError(
        data.message ||
        "Login failed. Please try again."
      );

      return;
    }

    // =====================================
    // Successful Login
    // =====================================

    // PHP has already created the session.
    // This value is only for frontend UI display.
    sessionStorage.setItem(
      "courtbook_login_success",
      "true"
    );

    if (typeof window.showAlert === "function") {
      window.showAlert(
        data.message || "Login successful!",
        "success"
      );
    }

    console.log("Login successful");
    console.log("User role:", data.user?.role);

    // Player:
    // - Return to booking if coming from Book Now
    // - Otherwise go to Home
    //
    // Admin:
    // - Go to dashboard when available
    redirectAfterLogin(data.user);

  } catch (error) {
    console.error("Login request failed:", error);

    showLoginError(
      error.message ===
      "The server returned an invalid response."
        ? error.message
        : "Could not connect to the server. Please check XAMPP."
    );

  } finally {
    setLoading(false);
  }
});

// =====================================
// Clear Errors When Editing
// =====================================

emailInput.addEventListener(
  "input",
  clearLoginError
);

passwordInput.addEventListener(
  "input",
  clearLoginError
);
