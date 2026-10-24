
export const API_BASE_URL =
  "http://localhost/court_booking/back_end";

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login.php",
    register: "/auth/register.php",
    logout: "/auth/logout.php"
  },

  courts: {
    index: "/courts/index.php",
    show: "/courts/show.php",
    create: "/courts/create.php",
    update: "/courts/update.php"
  },

  bookings: {
    index: "/bookings/index.php",
    create: "/bookings/create.php",
    cancel: "/bookings/cancel.php",
    availability: "/bookings/availability.php"
  },

  payments: {
    create: "/payments/create.php",
    show: "/payments/show.php",
    confirm: "/payments/confirm.php"
  }
};
