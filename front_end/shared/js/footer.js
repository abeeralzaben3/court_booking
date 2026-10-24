
function initializeFooter(root = document) {
  const yearElement = root.querySelector("#footer-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Initialize footer when opened directly
document.addEventListener("DOMContentLoaded", () => {
  initializeFooter();
});

// Load footer inside other pages
async function loadFooter(containerId = "footer-root") {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error("Footer container not found");
  }

  const response = await fetch(
    "/shared/components/footer.html"
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

window.loadFooter = loadFooter;


