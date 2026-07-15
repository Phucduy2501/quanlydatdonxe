const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("token");
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("Lỗi kết nối backend:", error);
    throw new Error("Không thể kết nối tới backend");
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // Không tự văng về login khi API con lỗi 401
  if (response.status === 401) {
    console.log("API bị 401:", endpoint, data);

    if (endpoint === "auth/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      throw new Error(data?.message || "Email hoặc mật khẩu không chính xác");
    }

    throw new Error(
      data?.message || "Bạn chưa có quyền hoặc API chưa cấu hình đúng"
    );
  }

  if (!response.ok) {
    console.log("API lỗi:", endpoint, response.status, data);

    throw new Error(data?.message || `Lỗi server ${response.status}`);
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
  return request(`payments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ================= ORDERS / DỰ PHÒNG FILE CŨ =================

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