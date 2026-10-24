
const ALERT_TYPES = {
  success: {
    title: "Success!",
    icon: "✓"
  },
  error: {
    title: "Error!",
    icon: "!"
  },
  info: {
    title: "Information",
    icon: "i"
  }
};

function createAlertContainer() {
  let container = document.getElementById(
    "alert-container"
  );

  if (!container) {
    container = document.createElement("div");

    container.id = "alert-container";
    container.className = "alert-container";

    container.setAttribute("role", "region");
    container.setAttribute(
      "aria-label",
      "Notifications"
    );

    document.body.appendChild(container);
  }

  return container;
}

function showAlert(message, type = "info", duration = 4000) {
  const container = createAlertContainer();

  const safeType = Object.hasOwn(ALERT_TYPES, type)
    ? type
    : "info";

  const config = ALERT_TYPES[safeType];

  // Create alert
  const alert = document.createElement("div");

  alert.className = `alert alert-${safeType}`;
  alert.setAttribute(
    "role",
    safeType === "error" ? "alert" : "status"
  );

  // Icon
  const icon = document.createElement("span");

  icon.className = "alert-icon";
  icon.textContent = config.icon;
  icon.setAttribute("aria-hidden", "true");

  // Content
  const content = document.createElement("div");
  content.className = "alert-content";

  const title = document.createElement("h3");
  title.className = "alert-title";
  title.textContent = config.title;

  const description = document.createElement("p");
  description.className = "alert-message";
  description.textContent = String(message);

  content.appendChild(title);
  content.appendChild(description);

  // Close button
  const closeButton = document.createElement("button");

  closeButton.type = "button";
  closeButton.className = "alert-close";
  closeButton.textContent = "×";
  closeButton.setAttribute(
    "aria-label",
    "Close notification"
  );

  alert.appendChild(icon);
  alert.appendChild(content);
  alert.appendChild(closeButton);

  container.appendChild(alert);

  let timeoutId = null;
  let isRemoving = false;

  function removeAlert() {
    if (isRemoving) {
      return;
    }

    isRemoving = true;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    alert.classList.add("alert-removing");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      alert.remove();
      return;
    }

    alert.addEventListener(
      "animationend",
      () => {
        alert.remove();
      },
      { once: true }
    );

    // Fallback if animationend doesn't fire
    setTimeout(() => {
      alert.remove();
    }, 350);
  }

  closeButton.addEventListener("click", removeAlert);

  if (duration > 0) {
    timeoutId = setTimeout(removeAlert, duration);
  }

  return alert;
}

// Make function available to other pages
window.showAlert = showAlert;

// Demo buttons (only present in alert.html)
document.addEventListener("DOMContentLoaded", () => {
  const successButton = document.getElementById(
    "test-success"
  );

  const errorButton = document.getElementById(
    "test-error"
  );

  const infoButton = document.getElementById(
    "test-info"
  );

  successButton?.addEventListener("click", () => {
    showAlert(
      "Your booking has been created successfully!",
      "success"
    );
  });

  errorButton?.addEventListener("click", () => {
    showAlert(
      "Something went wrong. Please try again.",
      "error"
    );
  });

  infoButton?.addEventListener("click", () => {
    showAlert(
      "Please select a date and time to continue.",
      "info"
    );
  });
});
