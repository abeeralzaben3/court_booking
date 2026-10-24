
"use strict";

// =========================================
// COURTBOOK - SHARED NAVBAR
// =========================================

const NAVBAR_COMPONENT_URL =
  "/court_booking/front_end/shared/components/navbar.html";

const NAVBAR_HOME_URL =
  "/court_booking/front_end/pages/player/home/home.html";

const NAVBAR_COURTS_URL =
  NAVBAR_HOME_URL + "#explore-courts";

const NAVBAR_BOOKINGS_URL =
  "/court_booking/front_end/pages/player/bookings/bookings.html";

const NAVBAR_LOGIN_URL =
  "/court_booking/front_end/pages/auth/login/login.html";

// Change to true when My Bookings is ready.
const NAVBAR_BOOKINGS_READY = false;

let navbarPromise = null;

// =========================================
// FRONTEND LOGIN INDICATOR
// =========================================

// UI only.
// PHP session remains responsible for security.

function isFrontendLoggedIn() {
  return sessionStorage.getItem(
    "courtbook_login_success"
  ) === "true";
}

// =========================================
// UPDATE NAVBAR AUTH
// =========================================

function updateNavbarAuth() {
  const root =
    document.getElementById("navbar-root");

  if (!root) {
    return;
  }

  const guestActions =
    root.querySelector("#nav-guest-actions");

  const userActions =
    root.querySelector("#nav-user-actions");

  const bookingsLink =
    root.querySelector('[data-nav="bookings"]');

  const loggedIn = isFrontendLoggedIn();

  if (guestActions) {
    guestActions.hidden = loggedIn;
  }

  if (userActions) {
    userActions.hidden = !loggedIn;
  }

  if (bookingsLink) {
    bookingsLink.hidden =
      !loggedIn || !NAVBAR_BOOKINGS_READY;
  }
}

// =========================================
// ACTIVE NAVIGATION LINK
// =========================================

function updateNavbarActiveLink() {
  const root =
    document.getElementById("navbar-root");

  if (!root) {
    return;
  }

  const path = window.location.pathname;
  const hash = window.location.hash;

  root.querySelectorAll(".nav-link")
    .forEach((link) => {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    });

  let active = "";

  if (path.includes("/player/bookings/")) {
    active = "bookings";

  } else if (path.includes("/player/home/")) {
    active =
      hash === "#explore-courts"
        ? "courts"
        : "home";
  }

  if (!active) {
    return;
  }

  const activeLink = root.querySelector(
    `[data-nav="${active}"]`
  );

  if (activeLink && !activeLink.hidden) {
    activeLink.classList.add("is-active");
    activeLink.setAttribute(
      "aria-current",
      "page"
    );
  }
}

// =========================================
// MOBILE MENU
// =========================================

function setupNavbarMenu(root) {
  const toggle =
    root.querySelector("#navbar-toggle");

  const menu =
    root.querySelector("#navbar-menu");

  if (!toggle || !menu) {
    return;
  }

  function closeMenu() {
    menu.classList.remove("is-open");

    toggle.setAttribute(
      "aria-expanded",
      "false"
    );

    toggle.setAttribute(
      "aria-label",
      "Open navigation menu"
    );
  }

  toggle.addEventListener("click", () => {
    const isOpen =
      menu.classList.toggle("is-open");

    toggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    toggle.setAttribute(
      "aria-label",
      isOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    );
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 850) {
      closeMenu();
    }
  });
}

// =========================================
// LOAD NAVBAR COMPONENT
// =========================================

function loadNavbar() {
  const root =
    document.getElementById("navbar-root");

  if (!root) {
    return Promise.resolve();
  }

  // Navbar already exists.
  if (root.querySelector(".navbar")) {
    updateNavbarAuth();
    updateNavbarActiveLink();

    return Promise.resolve();
  }

  if (navbarPromise) {
    return navbarPromise;
  }

  navbarPromise = fetch(NAVBAR_COMPONENT_URL, {
    method: "GET",
    cache: "no-cache"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Navbar HTTP ${response.status}`
        );
      }

      return response.text();
    })
    .then((html) => {
      const parsed =
        new DOMParser().parseFromString(
          html,
          "text/html"
        );

      const navbar =
        parsed.querySelector(".navbar");

      if (!navbar) {
        throw new Error(
          "Navbar component was not found."
        );
      }

      root.replaceChildren(navbar);

      setupNavbarMenu(root);

      updateNavbarAuth();
      updateNavbarActiveLink();
    })
    .catch((error) => {
      console.error(
        "Failed to load navbar:",
        error
      );
    })
    .finally(() => {
      navbarPromise = null;
    });

  return navbarPromise;
}

// =========================================
// HANDLE EXPIRED PHP SESSION
// =========================================

// Called when a protected API returns 401.

function handleUnauthorizedUser() {
  sessionStorage.removeItem(
    "courtbook_login_success"
  );

  updateNavbarAuth();

  const destination =
    window.location.pathname +
    window.location.search +
    window.location.hash;

  const params = new URLSearchParams({
    next: destination
  });

  window.location.assign(
    NAVBAR_LOGIN_URL + "?" + params.toString()
  );
}

// =========================================
// EXPOSE SHARED FUNCTIONS
// =========================================

window.loadNavbar = loadNavbar;
window.updateNavbarAuth = updateNavbarAuth;
window.updateNavbarActiveLink =
  updateNavbarActiveLink;
window.isFrontendLoggedIn =
  isFrontendLoggedIn;
window.handleUnauthorizedUser =
  handleUnauthorizedUser;

// =========================================
// INITIALIZATION
// =========================================

window.addEventListener(
  "hashchange",
  updateNavbarActiveLink
);

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    loadNavbar
  );
} else {
  loadNavbar();
}

