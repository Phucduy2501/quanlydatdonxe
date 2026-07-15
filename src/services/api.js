const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (endpoint !== "auth/login" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }

    throw new Error(
      data?.message || "Email hoặc mật khẩu không chính xác"
    );
  }

  if (!response.ok) {
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

export async function apiDelete(module, id) {
  return request(`${module}/${id}`, {
    method: "DELETE",
  });
}

// ================= ĐƠN HÀNG ĐẦY ĐỦ =================

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

// ================= DASHBOARD =================

export async function apiGetDashboardSummary() {
  return request("dashboard/summary", {
    method: "GET",
  });
}

export { API_URL };