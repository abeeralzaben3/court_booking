
"use strict";

// =========================================
// COURTBOOK - PLAYER HOME
// =========================================

const COURTS_API_URL =
  "/court_booking/back_end/courts/index.php";

const COURT_DETAILS_API_URL =
  "/court_booking/back_end/courts/show.php";

const IMAGES_PATH =
  "/court_booking/front_end/assets/images/";

const HOME_URL =
  "/court_booking/front_end/pages/player/home/home.html";

const COURTS_URL = HOME_URL + "#explore-courts";

const BOOKING_URL =
  "/court_booking/front_end/pages/player/booking/booking.html";

const LOGIN_URL =
  "/court_booking/front_end/pages/auth/login/login.html";

// =========================================
// COURT IMAGES
// =========================================

const COURT_IMAGES_BY_ID = {
  1: "tennis 1.png",
  2: "tennis 2.png",
  3: "badminton1.png",
  4: "badminton2.png",
  5: "pasket1.png",
  6: "tennis 3.png"
};

const COURT_IMAGES_BY_NAME = {
  "tennis court 1": "tennis 1.png",
  "tennis court 2": "tennis 2.png",
  "tennis court 3": "tennis 3.png",
  "updated tennis court": "tennis 3.png",

  "basketball court 1": "pasket1.png",
  "basketball court 2": "pasket 2.png",
  "basketball court 3": "pasket3.png",

  "badminton court 1": "badminton1.png",
  "badminton court 2": "badminton2.png",
  "badminton court 3": "badminton 3.png"
};

// =========================================
// DOM ELEMENTS
// =========================================

const courtsGrid =
  document.getElementById("courts-grid");

const courtsMessage =
  document.getElementById("courts-message");

const courtCount =
  document.getElementById("court-count");

const searchInput =
  document.getElementById("court-search");

const filterButtons =
  document.querySelectorAll(".filter-button");

const detailsDialog =
  document.getElementById("court-details-dialog");

const detailsContent =
  document.getElementById("details-content");

let allCourts = [];
let selectedSport = "all";

// =========================================
// SHARED NAVBAR / FOOTER
// =========================================

async function loadSharedComponents() {
  const tasks = [];

  if (typeof window.loadNavbar === "function") {
    tasks.push(window.loadNavbar());
  }

  if (typeof window.loadFooter === "function") {
    tasks.push(window.loadFooter());
  }

  await Promise.allSettled(tasks);

  fixSharedNavigation();
}

function fixSharedNavigation() {
  for (const id of ["navbar-root", "footer-root"]) {
    const root = document.getElementById(id);

    if (!root) {
      continue;
    }

    root.querySelectorAll("a").forEach((link) => {
      const label = normalizeText(link.textContent);

      if (
        label === "courts" ||
        label === "explore courts"
      ) {
        link.href = COURTS_URL;
      }

      if (label === "home") {
        link.href = HOME_URL;
      }
    });
  }
}

// Watch for shared components being inserted.
for (const id of ["navbar-root", "footer-root"]) {
  const root = document.getElementById(id);

  if (!root) {
    continue;
  }

  new MutationObserver(fixSharedNavigation).observe(
    root,
    { childList: true }
  );
}

// =========================================
// HELPERS
// =========================================

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function formatSport(value) {
  const names = {
    tennis: "Tennis",
    basketball: "Basketball",
    badminton: "Badminton"
  };

  return (
    names[normalizeText(value)] ||
    String(value || "Sport")
  );
}

function formatPrice(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(2)
    : "N/A";
}

function getCourtImage(court) {
  const id = Number(court.id);
  const name = normalizeText(court.name);

  let filename =
    COURT_IMAGES_BY_NAME[name] ||
    COURT_IMAGES_BY_ID[id];

  if (!filename) {
    const match = name.match(/\bcourt\s+([1-3])$/);

    if (match) {
      const imagesBySport = {
        tennis: [
          "tennis 1.png",
          "tennis 2.png",
          "tennis 3.png"
        ],
        basketball: [
          "pasket1.png",
          "pasket 2.png",
          "pasket3.png"
        ],
        badminton: [
          "badminton1.png",
          "badminton2.png",
          "badminton 3.png"
        ]
      };

      filename =
        imagesBySport[
          normalizeText(court.sport)
        ]?.[Number(match[1]) - 1];
    }
  }

  return filename
    ? IMAGES_PATH + encodeURIComponent(filename)
    : null;
}

function isMaintenance(court) {
  return normalizeText(court.status) === "maintenance";
}

function isCourtAvailable(court) {
  return normalizeText(court.status) === "active";
}

function makeElement(tag, className = "", text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createCourtImage(court, className) {
  const imageUrl = getCourtImage(court);

  if (!imageUrl) {
    return makeElement(
      "div",
      "court-image-placeholder",
      "Court image coming soon"
    );
  }

  const image = document.createElement("img");

  image.className = className;
  image.src = imageUrl;
  image.alt = String(court.name || "Sports court");
  image.loading = "lazy";

  image.addEventListener(
    "error",
    () => {
      image.replaceWith(
        makeElement(
          "div",
          "court-image-placeholder",
          "Court image unavailable"
        )
      );
    },
    { once: true }
  );

  return image;
}

// =========================================
// BOOKING NAVIGATION
// =========================================

function getBookingUrl(courtId) {
  const id = Number(courtId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return (
    BOOKING_URL +
    "?court_id=" +
    encodeURIComponent(id)
  );
}

function goToBooking(court) {
  // Don't allow booking unavailable courts.
  if (!isCourtAvailable(court)) {
    return;
  }

  const bookingUrl = getBookingUrl(court.id);

  if (!bookingUrl) {
    return;
  }

  // Frontend login indicator only.
  // Actual authorization is handled by PHP.
  const loggedIn =
    sessionStorage.getItem(
      "courtbook_login_success"
    ) === "true";

  if (!loggedIn) {
    const params = new URLSearchParams({
      next: bookingUrl
    });

    window.location.assign(
      LOGIN_URL + "?" + params.toString()
    );

    return;
  }

  window.location.assign(bookingUrl);
}

function createBookButton(
  court,
  className = "book-button"
) {
  const available = isCourtAvailable(court);

  const button = makeElement(
    "button",
    className,
    available ? "Book Now" : "Unavailable"
  );

  button.type = "button";
  button.disabled = !available;

  if (!available) {
    button.title =
      "This court is currently unavailable";
  }

  button.style.cssText = [
    "border:0",
    "border-radius:10px",
    "padding:11px 17px",
    "font:inherit",
    "font-weight:700",
    "background:#FF7F50",
    "color:#fff",
    "cursor:pointer",
    "transition:transform .2s ease,opacity .2s ease"
  ].join(";");

  if (!available) {
    button.style.background = "#D1D5DB";
    button.style.color = "#4B5563";
    button.style.cursor = "not-allowed";
  }

  button.addEventListener("click", () => {
    goToBooking(court);
  });

  return button;
}

// =========================================
// COURT CARD
// =========================================

function createCourtCard(court) {
  const maintenance = isMaintenance(court);

  const card = makeElement(
    "article",
    "court-card"
  );

  if (maintenance) {
    card.classList.add("is-maintenance");
  }

  const imageWrapper = makeElement(
    "div",
    "court-image-wrapper"
  );

  imageWrapper.appendChild(
    createCourtImage(court, "court-image")
  );

  const statusBadge = makeElement(
    "span",
    maintenance
      ? "court-status court-status-maintenance"
      : "court-status court-status-active",
    maintenance
      ? "Under Maintenance"
      : "Available"
  );

  imageWrapper.appendChild(statusBadge);

  const body = makeElement(
    "div",
    "court-card-body"
  );

  const sportBadge = makeElement(
    "span",
    "court-sport",
    formatSport(court.sport)
  );

  const title = makeElement(
    "h3",
    "",
    String(court.name || "Court")
  );

  const bottom = makeElement(
    "div",
    "court-card-bottom"
  );

  const priceWrapper =
    document.createElement("div");

  priceWrapper.append(
    makeElement(
      "span",
      "price-label",
      "Price per hour"
    ),
    makeElement(
      "span",
      "court-price",
      formatPrice(court.price_per_hour)
    ),
    makeElement(
      "span",
      "price-unit",
      " / hour"
    )
  );

  const detailsButton = makeElement(
    "button",
    "details-button",
    "View Details →"
  );

  detailsButton.type = "button";

  detailsButton.addEventListener("click", () => {
    loadCourtDetails(court.id);
  });

  const actions = makeElement(
    "div",
    "court-card-actions"
  );

  actions.style.cssText = [
    "display:flex",
    "flex-wrap:wrap",
    "gap:10px",
    "align-items:center",
    "justify-content:flex-end"
  ].join(";");

  actions.append(
    detailsButton,
    createBookButton(court)
  );

  bottom.append(
    priceWrapper,
    actions
  );

  body.append(
    sportBadge,
    title,
    bottom
  );

  card.append(
    imageWrapper,
    body
  );

  return card;
}

// =========================================
// RENDER COURTS
// =========================================

function renderCourts() {
  if (
    !courtsGrid ||
    !courtsMessage ||
    !courtCount
  ) {
    return;
  }

  const searchTerm = normalizeText(
    searchInput?.value
  );

  const filteredCourts = allCourts.filter(
    (court) => {
      const name = normalizeText(court.name);
      const sport = normalizeText(court.sport);

      const matchesSearch =
        name.includes(searchTerm) ||
        sport.includes(searchTerm);

      const matchesSport =
        selectedSport === "all" ||
        sport === selectedSport;

      return matchesSearch && matchesSport;
    }
  );

  courtsGrid.replaceChildren();

  courtCount.textContent =
    filteredCourts.length === 1
      ? "1 court found"
      : `${filteredCourts.length} courts found`;

  if (filteredCourts.length === 0) {
    courtsMessage.hidden = false;

    courtsMessage.textContent =
      "No courts found. Try another search or sport.";

    return;
  }

  courtsMessage.hidden = true;

  const fragment =
    document.createDocumentFragment();

  filteredCourts.forEach((court) => {
    fragment.appendChild(
      createCourtCard(court)
    );
  });

  courtsGrid.appendChild(fragment);
}

// =========================================
// FETCH COURTS
// =========================================

async function loadCourts() {
  if (
    !courtsGrid ||
    !courtsMessage ||
    !courtCount
  ) {
    return;
  }

  courtsMessage.hidden = false;
  courtsMessage.textContent = "Loading courts...";

  try {
    const response = await fetch(
      COURTS_API_URL,
      {
        method: "GET",
        credentials: "include"
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (
      data.success !== true ||
      !Array.isArray(data.courts)
    ) {
      throw new Error(
        "Invalid courts API response."
      );
    }

    allCourts = data.courts;

    renderCourts();

  } catch (error) {
    console.error(
      "Courts loading error:",
      error
    );

    allCourts = [];
    courtsGrid.replaceChildren();
    courtCount.textContent = "";

    courtsMessage.hidden = false;
    courtsMessage.textContent =
      "Unable to load courts. Please check XAMPP and try again.";
  }
}

// =========================================
// DETAILS MODAL
// =========================================

function closeDetails() {
  if (detailsDialog?.open) {
    detailsDialog.close();
  }
}

function renderCourtDetails(court) {
  if (!detailsContent || !detailsDialog) {
    return;
  }

  detailsContent.replaceChildren();

  const maintenance = isMaintenance(court);

  const panel = makeElement(
    "div",
    "details-panel"
  );

  const imageWrapper = makeElement(
    "div",
    "details-image-wrapper"
  );

  imageWrapper.appendChild(
    createCourtImage(court, "details-image")
  );

  const closeButton = makeElement(
    "button",
    "details-close",
    "×"
  );

  closeButton.type = "button";

  closeButton.setAttribute(
    "aria-label",
    "Close details"
  );

  closeButton.addEventListener(
    "click",
    closeDetails
  );

  const sportBadge = makeElement(
    "span",
    "court-sport",
    formatSport(court.sport)
  );

  const title = makeElement(
    "h2",
    "",
    String(court.name || "Court")
  );

  title.id = "details-title";

  const info = makeElement(
    "div",
    "details-info"
  );

  const sportInfo =
    document.createElement("p");

  sportInfo.append(
    makeElement(
      "strong",
      "",
      "Sport: "
    ),
    document.createTextNode(
      formatSport(court.sport)
    )
  );

  const priceInfo =
    document.createElement("p");

  priceInfo.append(
    makeElement(
      "strong",
      "",
      "Price per hour: "
    ),
    document.createTextNode(
      formatPrice(court.price_per_hour)
    )
  );

  const statusInfo =
    document.createElement("p");

  statusInfo.append(
    makeElement(
      "strong",
      "",
      "Status: "
    ),
    makeElement(
      "span",
      maintenance
        ? "details-status-maintenance"
        : "details-status-active",
      maintenance
        ? "Under Maintenance"
        : "Available"
    )
  );

  info.append(
    sportInfo,
    priceInfo,
    statusInfo
  );

  const note = makeElement(
    "p",
    maintenance
      ? "details-note details-note-maintenance"
      : "details-note",
    maintenance
      ? "This court is currently under maintenance and cannot be booked."
      : "Choose Book Now to select your booking date and time."
  );

  const actions = makeElement(
    "div",
    "details-actions"
  );

  actions.style.cssText = [
    "display:flex",
    "justify-content:flex-end",
    "gap:12px",
    "margin-top:20px"
  ].join(";");

  actions.appendChild(
    createBookButton(
      court,
      "details-book-button"
    )
  );

  panel.append(
    imageWrapper,
    closeButton,
    sportBadge,
    title,
    info,
    note,
    actions
  );

  detailsContent.appendChild(panel);

  if (!detailsDialog.open) {
    detailsDialog.showModal();
  }
}

// =========================================
// LOAD COURT DETAILS
// =========================================

async function loadCourtDetails(courtId) {
  const id = Number(courtId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return;
  }

  try {
    const response = await fetch(
      COURT_DETAILS_API_URL +
        "?court_id=" +
        encodeURIComponent(id),
      {
        method: "GET",
        credentials: "include"
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      data.success !== true ||
      !data.court
    ) {
      throw new Error(
        data.message ||
        "Could not load court details."
      );
    }

    const existingCourt = allCourts.find(
      (item) =>
        String(item.id) === String(id)
    );

    renderCourtDetails({
      ...(existingCourt || {}),
      ...data.court,
      id
    });

  } catch (error) {
    console.error(
      "Court details error:",
      error
    );

    const court = allCourts.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (court) {
      renderCourtDetails(court);
    } else {
      alert(
        "Unable to load court details."
      );
    }
  }
}

// =========================================
// EVENTS
// =========================================

if (detailsDialog) {
  detailsDialog.addEventListener(
    "click",
    (event) => {
      if (event.target === detailsDialog) {
        closeDetails();
      }
    }
  );
}

if (searchInput) {
  searchInput.addEventListener(
    "input",
    renderCourts
  );
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedSport =
      button.dataset.sport || "all";

    filterButtons.forEach((item) => {
      const active = item === button;

      item.classList.toggle(
        "is-active",
        active
      );

      item.setAttribute(
        "aria-pressed",
        String(active)
      );
    });

    renderCourts();
  });
});

// =========================================
// INITIALIZE
// =========================================

loadSharedComponents();
loadCourts();
