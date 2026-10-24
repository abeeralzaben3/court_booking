
function initializeNavbar(root = document) {
  const toggle = root.querySelector(".navbar-toggle");
  const menu = root.querySelector(".navbar-menu");

  if (!toggle || !menu) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");

    toggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu"
    );

    toggle.textContent = isOpen ? "✕" : "☰";
  });
}

// Initialize when opening navbar.html directly
document.addEventListener("DOMContentLoaded", () => {
  initializeNavbar();
});

// Reuse navbar inside other pages
async function loadNavbar(containerId = "navbar-root") {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error("Navbar container not found");
  }

  const response = await fetch(
    "/shared/components/navbar.html"
  );

  if (!response.ok) {
    throw new Error("Failed to load navbar");
  }

  const html = await response.text();

  const parsed = new DOMParser().parseFromString(
    html,
    "text/html"
  );

  const navbar = parsed.querySelector(".navbar");

  if (!navbar) {
    throw new Error("Navbar element not found");
  }

  container.replaceChildren(navbar);
  initializeNavbar(container);
}

window.loadNavbar = loadNavbar;


