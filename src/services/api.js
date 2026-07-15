const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

// ================= REQUEST CHUNG =================

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  let response;

  try {
    response = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("Không kết nối được backend:", error);

    throw new Error(
      "Không thể kết nối tới backend. Kiểm tra Docker backend có đang chạy không."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.log("API lỗi:", {
      endpoint,
      status: response.status,
      data,
    });

    throw new Error(
      data?.message || data?.error || `Lỗi server ${response.status}`
    );
  }

  return data;
}

// ================= AUTH =================

export async function apiLogin(email, password) {
  return request("auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}

export async function apiGetCurrentUser() {
  return request("auth/me", {
    method: "GET",
  });
}

export function apiLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ================= CRUD CHUNG =================

export async function apiGet(module, params = {}) {
  const queryString = new URLSearchParams(params).toString();

  const endpoint = queryString ? `${module}?${queryString}` : module;

  return request(endpoint, {
    method: "GET",
  });
}

export async function apiGetById(module, id) {
  return request(`${module}/${id}`, {
    method: "GET",
  });
}

export async function apiCreate(module, data) {
  return request(module, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdate(module, id, data) {
  return request(`${module}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiPatch(module, id, data) {
  return request(`${module}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDelete(module, id) {
  return request(`${module}/${id}`, {
    method: "DELETE",
  });
}

// ================= DASHBOARD =================

export async function apiGetDashboardSummary() {
  return request("dashboard/summary", {
    method: "GET",
  });
}

// ================= TRIPS / CHUYẾN XE =================

export async function apiSearchTrips(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  const endpoint = queryString
    ? `trips/search/available?${queryString}`
    : "trips/search/available";

  return request(endpoint, {
    method: "GET",
  });
}

export async function apiGetAvailableSeats(tripId) {
  return request(`trips/${tripId}/available-seats`, {
    method: "GET",
  });
}

// ================= BOOKINGS / ĐẶT VÉ =================

export async function apiCreateFullBooking(data) {
  return request("bookings/create-full", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiGetBookingDetail(id) {
  return request(`bookings/${id}/detail`, {
    method: "GET",
  });
}

export async function apiUpdateBookingStatus(id, data) {
  return request(`bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ================= TICKETS / VÉ =================

export async function apiCheckInTicket(id) {
  return request(`tickets/${id}/check-in`, {
    method: "PATCH",
  });
}

// ================= PAYMENTS / THANH TOÁN =================

export async function apiCreatePayment(data) {
  return request("payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdatePaymentStatus(id, data) {
  return request(`payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ================= FILE CŨ DỰ PHÒNG =================

export async function apiCreateFullOrder(data) {
  return request("orders/create-full", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateFullOrder(id, data) {
  return request(`orders/${id}/update-full`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export { API_URL };