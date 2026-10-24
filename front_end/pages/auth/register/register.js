
"use strict";

// =====================================
// CourtBook - Register Page
// =====================================

// PHP Register API
// Use this URL when opening the frontend through XAMPP.
const REGISTER_API_URL =
  "/court_booking/back_end/auth/register.php";

// =====================================
// DOM Elements
// =====================================

const registerForm = document.getElementById("register-form");

const nameInput = document.getElementById("register-name");
const emailInput = document.getElementById("register-email");
const phoneInput = document.getElementById("register-phone");

const passwordInput = document.getElementById("register-password");
const confirmPasswordInput = document.getElementById(
  "register-confirm-password"
);

const registerError = document.getElementById("register-error");

const submitButton = document.getElementById("register-submit");
const submitText = document.getElementById("register-button-text");
const spinner = document.getElementById("register-spinner");

const inputs = [
  nameInput,
  emailInput,
  phoneInput,
  passwordInput,
  confirmPasswordInput
];

// =====================================
// Show / Hide Password
// =====================================

document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);

    if (!input) return;

    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";

    button.setAttribute(
      "aria-label",
      isHidden ? "Hide password" : "Show password"
    );

    button.setAttribute(
      "aria-pressed",
      String(isHidden)
    );
  });
});

// =====================================
// Error Messages
// =====================================

function showError(message, invalidInputs = []) {
  registerError.textContent = message;
  registerError.hidden = false;

  invalidInputs.forEach((input) => {
    input.classList.add("input-invalid");
  });
}

function clearError() {
  registerError.textContent = "";
  registerError.hidden = true;

  inputs.forEach((input) => {
    input.classList.remove("input-invalid");
  });
}

function showSuccess(message) {
  if (typeof window.showAlert === "function") {
    window.showAlert(message, "success");
  } else {
    alert(message);
  }
}

// =====================================
// Loading State
// =====================================

function setLoading(isLoading) {
  submitButton.disabled = isLoading;

  submitText.textContent = isLoading
    ? "Creating Account..."
    : "Create Account";

  spinner.hidden = !isLoading;
}

// =====================================
// Form Validation
// =====================================

function validateForm() {
  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();

  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!fullName) {
    showError("Please enter your full name.", [nameInput]);
    nameInput.focus();
    return false;
  }

  if (fullName.length > 100) {
    showError(
      "Full name must not exceed 100 characters.",
      [nameInput]
    );
    nameInput.focus();
    return false;
  }

  if (!email) {
    showError("Please enter your email address.", [emailInput]);
    emailInput.focus();
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || email.length > 100) {
    showError("Please enter a valid email address.", [emailInput]);
    emailInput.focus();
    return false;
  }

  if (phone.length > 20) {
    showError(
      "Phone number must not exceed 20 characters.",
      [phoneInput]
    );
    phoneInput.focus();
    return false;
  }

  if (!password) {
    showError("Please enter a password.", [passwordInput]);
    passwordInput.focus();
    return false;
  }

  if (password.length < 8) {
    showError(
      "Password must be at least 8 characters long.",
      [passwordInput]
    );
    passwordInput.focus();
    return false;
  }

  if (!confirmPassword) {
    showError(
      "Please confirm your password.",
      [confirmPasswordInput]
    );
    confirmPasswordInput.focus();
    return false;
  }

  if (password !== confirmPassword) {
    showError(
      "Passwords do not match.",
      [passwordInput, confirmPasswordInput]
    );
    confirmPasswordInput.focus();
    return false;
  }

  return true;
}

// =====================================
// Register Form Submit
// =====================================

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearError();

  if (!validateForm()) {
    return;
  }

  // Prepare data for PHP API
  const formData = new FormData();

  formData.append("full_name", nameInput.value.trim());
  formData.append("email", emailInput.value.trim());
  formData.append("phone", phoneInput.value.trim());
  formData.append("password", passwordInput.value);

  // IMPORTANT: register.php requires this field.
  formData.append(
    "confirm_password",
    confirmPasswordInput.value
  );

  setLoading(true);

  try {
    const response = await fetch(REGISTER_API_URL, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Server returned invalid JSON.");
    }

    // Handle API errors
    if (!response.ok || data.success !== true) {
      showError(
        data.message || "Registration failed. Please try again."
      );
      return;
    }

    // Registration successful
    registerForm.reset();
    clearError();

    // Reset password visibility
    document.querySelectorAll(".password-toggle").forEach((button) => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);

      if (input) {
        input.type = "password";
      }

      button.textContent = "Show";
      button.setAttribute("aria-label", "Show password");
      button.setAttribute("aria-pressed", "false");
    });

    showSuccess(
      data.message || "Account created successfully!"
    );

    // Login navigation will be connected later.

  } catch (error) {
    console.error("Registration request failed:", error);

    showError(
      "Could not connect to the server. Please check XAMPP."
    );

  } finally {
    setLoading(false);
  }
});

// =====================================
// Clear Errors While Typing
// =====================================

inputs.forEach((input) => {
  input.addEventListener("input", clearError);
});
