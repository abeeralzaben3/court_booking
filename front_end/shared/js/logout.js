
"use strict";

// =====================================
// CourtBook - Logout
// =====================================

// Existing PHP Logout API
const LOGOUT_API_URL =
  "/court_booking/back_end/auth/logout.php";

// Login Page
const LOGIN_PAGE_URL =
  "/court_booking/front_end/pages/auth/login/login.html";

let logoutInProgress = false;

// =====================================
// Logout Function
// =====================================

async function logout() {
  if (logoutInProgress) {
    return;
  }

  logoutInProgress = true;

  // Find all Logout buttons
  const logoutButtons = document.querySelectorAll(
    '[data-action="logout"], #logout-btn, #logout-button'
  );

  // Disable buttons while logging out
  logoutButtons.forEach((button) => {
    button.setAttribute("aria-disabled", "true");

    if ("disabled" in button) {
      button.disabled = true;
    }
  });

  try {
    // Send POST request to PHP
    const response = await fetch(LOGOUT_API_URL, {
      method: "POST",
      credentials: "include"
    });

    const data = await response.json();

    // Check if Logout was successful
    if (!response.ok || data.success !== true) {
      throw new Error(
        data.message || "Logout failed. Please try again."
      );
    }

    // =====================================
    // Successful Logout
    // =====================================

    // PHP has destroyed the session successfully.

    // Remove the frontend login state
    sessionStorage.removeItem(
      "courtbook_login_success"
    );

    // Redirect to Sign In page
    window.location.replace(LOGIN_PAGE_URL);

  } catch (error) {
    console.error("Logout error:", error);

    alert(
      "Could not log out. Please try again."
    );

    // Re-enable Logout buttons if request fails
    logoutButtons.forEach((button) => {
      button.removeAttribute("aria-disabled");

      if ("disabled" in button) {
        button.disabled = false;
      }
    });

  } finally {
    logoutInProgress = false;
  }
}

// =====================================
// Handle Logout Clicks
// Works with dynamically loaded Navbar
// =====================================

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const logoutButton = target.closest(
    '[data-action="logout"], #logout-btn, #logout-button'
  );

  if (!logoutButton) {
    return;
  }

  event.preventDefault();

  logout();
});
