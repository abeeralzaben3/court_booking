
// ======================================
// Button Loader
// ======================================

const buttonLoaderStates = new WeakMap();

function showButtonLoader(button, loadingText = "Loading...") {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  // Prevent starting loading twice
  if (buttonLoaderStates.has(button)) {
    return;
  }

  // Save original button state
  buttonLoaderStates.set(button, {
    html: button.innerHTML,
    disabled: button.disabled
  });

  button.disabled = true;
  button.classList.add("is-loading");
  button.setAttribute("aria-busy", "true");

  // Build loading content
  const content = document.createElement("span");
  content.className = "loader-button-content";

  const spinner = document.createElement("span");
  spinner.className = "loader-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.textContent = loadingText;

  content.appendChild(spinner);
  content.appendChild(text);

  button.replaceChildren(content);
}

function hideButtonLoader(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const originalState = buttonLoaderStates.get(button);

  if (!originalState) {
    return;
  }

  button.innerHTML = originalState.html;
  button.disabled = originalState.disabled;

  button.classList.remove("is-loading");
  button.removeAttribute("aria-busy");

  buttonLoaderStates.delete(button);
}

// ======================================
// Page Loader
// ======================================

function getPageLoader() {
  let loader = document.getElementById("page-loader");

  if (!loader) {
    loader = document.createElement("div");

    loader.id = "page-loader";
    loader.className = "page-loader";
    loader.hidden = true;

    loader.setAttribute("role", "status");
    loader.setAttribute("aria-label", "Loading");
    loader.setAttribute("aria-live", "polite");

    const content = document.createElement("div");
    content.className = "page-loader-content";

    const spinner = document.createElement("span");
    spinner.className = "loader-spinner loader-spinner-large";
    spinner.setAttribute("aria-hidden", "true");

    const message = document.createElement("p");
    message.className = "page-loader-text";
    message.textContent = "Loading, please wait...";

    content.appendChild(spinner);
    content.appendChild(message);

    loader.appendChild(content);
    document.body.appendChild(loader);
  }

  return loader;
}

function showLoader(message = "Loading, please wait...") {
  const loader = getPageLoader();

  const messageElement = loader.querySelector(
    ".page-loader-text"
  );

  if (messageElement) {
    messageElement.textContent = message;
  }

  loader.hidden = false;
  document.body.setAttribute("aria-busy", "true");
}

function hideLoader() {
  const loader = document.getElementById("page-loader");

  if (loader) {
    loader.hidden = true;
  }

  document.body.removeAttribute("aria-busy");
}

// ======================================
// Make Functions Global
// ======================================

window.showButtonLoader = showButtonLoader;
window.hideButtonLoader = hideButtonLoader;

window.showLoader = showLoader;
window.hideLoader = hideLoader;

// ======================================
// Demo Buttons
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const buttonDemo = document.getElementById(
    "test-button-loader"
  );

  const pageDemo = document.getElementById(
    "test-page-loader"
  );

  buttonDemo?.addEventListener("click", () => {
    showButtonLoader(buttonDemo, "Processing...");

    setTimeout(() => {
      hideButtonLoader(buttonDemo);
    }, 3000);
  });

  pageDemo?.addEventListener("click", () => {
    showLoader("Loading courts...");

    setTimeout(() => {
      hideLoader();
    }, 3000);
  });
});
