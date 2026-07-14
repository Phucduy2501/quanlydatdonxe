const API_URL = "http://localhost:3000/api";

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

        if (
            endpoint !== "auth/login" &&
            window.location.pathname !== "/login"
        ) {
            window.location.href = "/login";
        }

        throw new Error(
            data && data.message ?
            data.message :
            "Email hoặc mật khẩu không chính xác"
        );
    }

    if (!response.ok) {
        throw new Error(
            data && data.message ?
            data.message :
            `Lỗi server ${response.status}`
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

// ================= CRUD =================

export async function apiGet(module, params = {}) {
    const queryString = new URLSearchParams(params).toString();

    const endpoint = queryString ?
        `${module}?${queryString}` :
        module;

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

// ================= DASHBOARD =================

export async function apiGetDashboardSummary() {
    return request("dashboard/summary", {
        method: "GET",
    });
}

// ================= TRIPS =================

export async function apiSearchTrips(params = {}) {
    const queryString = new URLSearchParams(params).toString();

    const endpoint = queryString ?
        `trips/search/available?${queryString}` :
        "trips/search/available";

    return request(endpoint, {
        method: "GET",
    });
}

export async function apiGetAvailableSeats(tripId) {
    return request(`trips/${tripId}/available-seats`, {
        method: "GET",
    });
}

// ================= BOOKINGS =================

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

// ================= TICKETS =================

export async function apiCheckInTicket(id) {
    return request(`tickets/${id}/check-in`, {
        method: "PATCH",
    });
}

export { API_URL };