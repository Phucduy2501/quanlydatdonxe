const API_URL =
  import.meta.env.VITE_API_URL || "https://defeat-crown-tariff-ending.trycloudflare.com/api";

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

  const res = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Lỗi API");
  }

  return data;
}

export async function apiGet(module) {
  return request(module, {
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

// THÊM HÀM NÀY ĐỂ SalesMulti.jsx DÙNG
export async function apiCreateFullOrder(data) {
  return request("orders/create-full", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Dùng sau này nếu cần sửa đơn đầy đủ
export async function apiUpdateFullOrder(id, data) {
  return request(`orders/${id}/update-full`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}