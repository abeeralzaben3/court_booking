
"use strict";

// =====================================
// CourtBook - Shared Footer
// =====================================

function initializeFooter(root = document) {
  const yearElement = root.querySelector("#footer-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Initialize when opening footer.html directly
document.addEventListener("DOMContentLoaded", () => {
  initializeFooter();
});

// =====================================
// Load Footer Inside Other Pages
// =====================================

async function loadFooter(containerId = "footer-root") {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error("Footer container not found");
  }

  const response = await fetch(
    "/court_booking/front_end/shared/components/footer.html"
  );

  if (!response.ok) {
    throw new Error("Failed to load footer");
  }

  const html = await response.text();

  const parsed = new DOMParser().parseFromString(
    html,
    "text/html"
  );

  const footer = parsed.querySelector(".footer");

  if (!footer) {
    throw new Error("Footer element not found");
  }

  container.replaceChildren(footer);

  initializeFooter(container);
}

// Make function available globally
window.loadFooter = loadFooter;
