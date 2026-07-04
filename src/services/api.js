const API_URL = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function apiGet(module) {
  const res = await fetch(`${API_URL}/${module}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
}

export async function apiCreate(module, data) {
  const res = await fetch(`${API_URL}/${module}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function apiUpdate(module, id, data) {
  const res = await fetch(`${API_URL}/${module}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function apiDelete(module, id) {
  const res = await fetch(`${API_URL}/${module}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.json();
}

export async function apiCreateFullOrder(data) {
  const res = await fetch(`${API_URL}/orders/create-full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function apiUpdateFullOrder(id, data) {
  const res = await fetch(`${API_URL}/orders/${id}/update-full`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}