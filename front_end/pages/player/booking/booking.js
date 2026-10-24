
"use strict";

// =====================================
// CourtBook - Booking
// =====================================

// Existing PHP APIs - No backend changes
const API = {
  court: "/court_booking/back_end/courts/show.php",
  availability: "/court_booking/back_end/bookings/availability.php",
  create: "/court_booking/back_end/bookings/create.php"
};

// Page URLs
const BOOKING_LOGIN_URL =
  "/court_booking/front_end/pages/auth/login/login.html";

// =====================================
// Court Images
// =====================================

const IMAGE_ROOT =
  "/court_booking/front_end/assets/images/";

const IMAGE_BY_NAME = {
  "tennis court 1": "tennis 1.png",
  "tennis court 2": "tennis 2.png",
  "updated tennis court": "tennis 3.png",
  "tennis court 3": "tennis 3.png",
  "basketball court 1": "pasket1.png",
  "basketball court 2": "pasket 2.png",
  "badminton court 1": "badminton1.png",
  "badminton court 2": "badminton2.png",
  "badminton court 3": "badminton 3.png"
};

const IMAGE_BY_ID = {
  1: "tennis 1.png",
  2: "tennis 2.png",
  3: "badminton1.png",
  4: "badminton2.png",
  5: "pasket1.png",
  6: "tennis 3.png"
};

// =====================================
// Elements
// =====================================

const elements = {
  form: document.getElementById("booking-form"),
  date: document.getElementById("booking-date"),
  start: document.getElementById("start-time"),
  end: document.getElementById("end-time"),
  check: document.getElementById("check-availability"),
  confirm: document.getElementById("confirm-booking"),
  result: document.getElementById("availability-result"),
  message: document.getElementById("page-message"),
  duration: document.getElementById("duration-value"),
  rate: document.getElementById("rate-value"),
  total: document.getElementById("total-value"),
  name: document.getElementById("court-heading"),
  sport: document.getElementById("court-sport"),
  price: document.getElementById("court-price"),
  status: document.getElementById("court-status"),
  image: document.getElementById("court-image"),
  success: document.getElementById("success-panel"),
  successMessage: document.getElementById("success-message")
};

// =====================================
// State
// =====================================

let court = null;
let confirmedSelection = null;
let requestVersion = 0;
let isSubmitting = false;
let isRedirectingToLogin = false;

const courtId = Number(
  new URLSearchParams(window.location.search)
    .get("court_id")
);

// =====================================
// Authentication Helpers
// =====================================

// This is only a frontend UI indicator.
// The PHP session remains the authority.

function bookingFrontendLoggedIn() {
  return sessionStorage.getItem(
    "courtbook_login_success"
  ) === "true";
}

// Redirect to login while preserving
// the selected court in the URL.

function redirectBookingToLogin() {
  if (isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;

  sessionStorage.removeItem(
    "courtbook_login_success"
  );

  const returnUrl =
    window.location.pathname +
    window.location.search +
    window.location.hash;

  const params = new URLSearchParams({
    next: returnUrl
  });

  window.location.assign(
    BOOKING_LOGIN_URL + "?" + params.toString()
  );
}

// =====================================
// Helpers
// =====================================

function localDateString(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function minutes(value) {
  const match =
    /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(
      String(value)
    );

  if (!match) {
    return NaN;
  }

  const hours = Number(match[1]);
  const mins = Number(match[2]);

  if (
    hours > 24 ||
    mins > 59 ||
    (hours === 24 && mins !== 0)
  ) {
    return NaN;
  }

  return hours * 60 + mins;
}

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function showMessage(message) {
  elements.message.textContent = message;
  elements.message.hidden = !message;
}

function showAvailability(message, state = "") {
  elements.result.textContent = message;

  elements.result.className =
    `availability-result ${state}`.trim();
}

function selection() {
  return {
    court_id: courtId,
    booking_date: elements.date.value,
    start_time: elements.start.value,
    end_time: elements.end.value
  };
}

function selectionKey(value) {
  return JSON.stringify(value);
}

// =====================================
// Reset Availability
// =====================================

function resetAvailability() {
  requestVersion += 1;

  confirmedSelection = null;

  elements.confirm.disabled = true;

  elements.check.disabled =
    !court || court.status !== "active";

  showAvailability(
    "Select a date and time to check availability."
  );
}

// =====================================
// Populate Time Options
// =====================================

function populateTimes() {
  for (
    let minute = 0;
    minute <= 23 * 60 + 30;
    minute += 30
  ) {
    const time =
      `${String(
        Math.floor(minute / 60)
      ).padStart(2, "0")}:` +
      `${String(
        minute % 60
      ).padStart(2, "0")}`;

    for (const select of [
      elements.start,
      elements.end
    ]) {
      const option =
        document.createElement("option");

      option.value = time;
      option.textContent = time;

      select.appendChild(option);
    }
  }

  // Preserve the original end-of-day option.
  // Final validation is done by PHP.
  const midnight =
    document.createElement("option");

  midnight.value = "24:00";
  midnight.textContent = "24:00 (midnight)";

  elements.end.appendChild(midnight);
}

// =====================================
// Validate Booking Selection
// =====================================

function validateSelection() {
  const value = selection();

  if (!court || court.status !== "active") {
    return "This court is not available for booking.";
  }

  if (
    !value.booking_date ||
    !value.start_time ||
    !value.end_time
  ) {
    return (
      "Please select a date, start time, and end time."
    );
  }

  if (
    value.booking_date <
    localDateString(new Date())
  ) {
    return "Please choose today or a future date.";
  }

  const start = minutes(value.start_time);
  const end = minutes(value.end_time);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start
  ) {
    return "End time must be later than start time.";
  }

  if (
    value.booking_date ===
    localDateString(new Date())
  ) {
    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes();

    if (start <= currentMinutes) {
      return "Please choose a future start time.";
    }
  }

  return null;
}

// =====================================
// Calculate Booking Price
// =====================================

function updatePrice() {
  if (!court) {
    return;
  }

  const start = minutes(elements.start.value);
  const end = minutes(elements.end.value);

  const valid =
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start;

  if (!valid) {
    elements.duration.textContent = "—";
    elements.total.textContent = "—";
    return;
  }

  const hours = (end - start) / 60;

  const total =
    hours * Number(court.price_per_hour);

  elements.duration.textContent =
    `${hours} hour(s)`;

  elements.total.textContent = money(total);
}

// =====================================
// API Helper
// =====================================

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  // IMPORTANT:
  // PHP returns 401 if login is required.
  // Redirect back to login instead of
  // showing a generic booking error.

  if (response.status === 401) {
    redirectBookingToLogin();

    const error = new Error(
      "Login required."
    );

    error.isAuthError = true;

    throw error;
  }

  if (!response.ok || data.success !== true) {
    throw new Error(
      data.message ||
      `Request failed (HTTP ${response.status}).`
    );
  }

  return data;
}

// =====================================
// Court Image
// =====================================

function imageForCourt(details) {
  const name = String(details.name || "")
    .trim()
    .toLowerCase();

  const filename =
    IMAGE_BY_NAME[name] ||
    IMAGE_BY_ID[Number(details.id)] ||
    "tennis 1.png";

  return (
    IMAGE_ROOT +
    encodeURIComponent(filename)
  );
}

// =====================================
// Load Court Details
// =====================================

async function loadCourt() {
  if (
    !Number.isSafeInteger(courtId) ||
    courtId <= 0
  ) {
    showMessage(
      "No valid court was selected. " +
      "Return to Home and choose a court."
    );

    showAvailability(
      "Choose a court first.",
      "bad"
    );

    return;
  }

  try {
    const data = await requestJson(
      `${API.court}?court_id=${encodeURIComponent(
        courtId
      )}`
    );

    court = data.court;

    if (
      !court ||
      typeof court !== "object"
    ) {
      throw new Error(
        "Court details are missing."
      );
    }

    elements.name.textContent =
      String(court.name || "Court");

    elements.sport.textContent =
      String(court.sport || "Sport");

    elements.price.textContent =
      money(court.price_per_hour);

    elements.rate.textContent =
      money(court.price_per_hour);

    elements.image.src =
      imageForCourt(court);

    elements.image.alt =
      `${court.name || "Sports"} court`;

    const active =
      String(court.status || "")
        .toLowerCase() === "active";

    court.status = active
      ? "active"
      : "maintenance";

    elements.status.textContent = active
      ? "● Available"
      : "● Under Maintenance";

    elements.status.className =
      `status-tag ${court.status}`;

    if (!active) {
      showMessage(
        "This court is currently unavailable " +
        "for booking because it is under maintenance."
      );

      showAvailability(
        "Booking is disabled for this court.",
        "bad"
      );
    } else {
      elements.check.disabled = false;
    }

    updatePrice();

  } catch (error) {
    if (error.isAuthError) {
      return;
    }

    showMessage(
      error.message ||
      "Unable to load court details."
    );

    showAvailability(
      "Court details could not be loaded.",
      "bad"
    );
  }
}

// =====================================
// Normalize Booked Slots
// =====================================

function normalizeBookedSlots(raw) {
  if (!Array.isArray(raw)) {
    throw new Error(
      "Availability data has an unexpected format."
    );
  }

  return raw.map((slot) => {
    let start;
    let end;

    if (
      Array.isArray(slot) &&
      slot.length >= 2
    ) {
      [start, end] = slot;

    } else if (
      slot &&
      typeof slot === "object"
    ) {
      start =
        slot.start_time ?? slot.start;

      end =
        slot.end_time ?? slot.end;
    }

    const from = minutes(start);
    const to = minutes(end);

    if (
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      to <= from
    ) {
      throw new Error(
        "Cannot interpret the booked time slots. " +
        "Please contact support."
      );
    }

    return { from, to };
  });
}

// =====================================
// Check Availability
// =====================================

async function checkAvailability() {
  const error = validateSelection();

  if (error) {
    resetAvailability();
    showAvailability(error, "bad");
    return false;
  }

  const value = selection();
  const key = selectionKey(value);

  const version = ++requestVersion;

  confirmedSelection = null;
  elements.confirm.disabled = true;
  elements.check.disabled = true;

  elements.check.textContent = "Checking...";

  showAvailability(
    "Checking existing bookings..."
  );

  try {
    const params = new URLSearchParams({
      court_id: String(courtId),
      date: value.booking_date
    });

    const data = await requestJson(
      `${API.availability}?${params}`
    );

    // Ignore outdated requests.
    if (
      version !== requestVersion ||
      key !== selectionKey(selection())
    ) {
      return false;
    }

    const slots = normalizeBookedSlots(
      data.booked_slots
    );

    const start = minutes(value.start_time);
    const end = minutes(value.end_time);

    const overlaps = slots.some((slot) => {
      return (
        start < slot.to &&
        end > slot.from
      );
    });

    if (overlaps) {
      showAvailability(
        "This time overlaps an existing booking. " +
        "Please choose another slot.",
        "bad"
      );

      return false;
    }

    confirmedSelection = key;
    elements.confirm.disabled = false;

    showAvailability(
      "✓ This time slot is available! " +
      "You can confirm your booking.",
      "good"
    );

    return true;

  } catch (error) {
    if (error.isAuthError) {
      return false;
    }

    if (version === requestVersion) {
      showAvailability(
        error.message ||
        "Could not check availability.",
        "bad"
      );
    }

    return false;

  } finally {
    if (version === requestVersion) {
      elements.check.disabled =
        !court || court.status !== "active";

      elements.check.textContent =
        "Check Availability ↗";
    }
  }
}

// =====================================
// Confirm Booking
// =====================================

async function submitBooking(event) {
  event.preventDefault();

  if (isSubmitting) {
    return;
  }

  const error = validateSelection();

  if (error) {
    showAvailability(error, "bad");
    return;
  }

  const value = selection();

  if (
    confirmedSelection !==
    selectionKey(value)
  ) {
    showAvailability(
      "Please check availability for your " +
      "selected time first.",
      "bad"
    );

    return;
  }

  // Guests can view court information
  // and check availability.
  // Only booking confirmation requires login.

  if (!bookingFrontendLoggedIn()) {
    redirectBookingToLogin();
    return;
  }

  isSubmitting = true;

  elements.confirm.disabled = true;
  elements.confirm.textContent = "Confirming...";

  showMessage("");

  try {
    const data = await requestJson(
      API.create,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(value)
      }
    );

    // Prevent another submission after success.
    elements.form
      .querySelectorAll("input, select, button")
      .forEach((element) => {
        element.disabled = true;
      });

    elements.successMessage.textContent =
      `Booking #${data.booking_id} confirmed ` +
      `for ${court.name} on ${value.booking_date}, ` +
      `${value.start_time}–${value.end_time}.`;

    elements.success.hidden = false;

    elements.success.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  } catch (error) {
    if (error.isAuthError) {
      return;
    }

    confirmedSelection = null;

    showMessage(
      error.message ||
      "Booking could not be completed. " +
      "Please try again."
    );

    showAvailability(
      "Please check availability again " +
      "before retrying.",
      "bad"
    );

  } finally {
    isSubmitting = false;

    elements.confirm.textContent =
      "Confirm Booking →";
  }
}

// =====================================
// Initialize Booking Page
// =====================================

populateTimes();

elements.date.min =
  localDateString(new Date());

elements.date.value =
  localDateString(new Date());

elements.check.disabled = true;

// Reset availability whenever selection changes.
[
  elements.date,
  elements.start,
  elements.end
].forEach((element) => {
  element.addEventListener("change", () => {
    resetAvailability();
    updatePrice();
    showMessage("");
  });
});

// Button Events
elements.check.addEventListener(
  "click",
  checkAvailability
);

elements.form.addEventListener(
  "submit",
  submitBooking
);

// Load selected court from existing PHP API.
loadCourt();
