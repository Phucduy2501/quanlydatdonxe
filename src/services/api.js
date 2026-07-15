const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/+$/, "");

// ================= TOKEN =================

function isUserPage() {
    return window.location.pathname.startsWith("/user");
}

function getToken() {
    if (isUserPage()) {
        return localStorage.getItem("customer_token");
    }

    return localStorage.getItem("token");
}

function clearAdminAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

function clearCustomerAuth() {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
}

// ================= UTILS =================

function cleanQueryParams(params) {
    const cleanParams = {};

    Object.entries(params || {}).forEach(function([key, value]) {
        if (value !== undefined && value !== null && value !== "") {
            cleanParams[key] = value;
        }
    });

    return cleanParams;
}

function getErrorMessage(data, fallback) {
    if (data && data.message) {
        return data.message;
    }

    if (data && data.error) {
        return data.error;
    }

    return fallback;
}

// ================= REQUEST CHUNG =================

async function request(endpoint, options) {
    const requestOptions = options || {};
    const token = getToken();

    const normalizedEndpoint = String(endpoint || "").replace(/^\/+/, "");

    const isFormData =
        typeof FormData !== "undefined" &&
        requestOptions.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(requestOptions.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_URL}/${normalizedEndpoint}`, {
            ...requestOptions,
            headers,
        });
    } catch (error) {
        console.error("Không kết nối được backend:", error);

        throw new Error(
            `Không thể kết nối tới backend. API hiện tại: ${API_URL}`
        );
    }

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    try {
        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text ? { message: text } : null;
        }
    } catch (error) {
        console.error("Không đọc được dữ liệu phản hồi:", error);
        data = null;
    }

    // ================= 401 TOKEN =================

    if (response.status === 401) {
        const isLoginRequest = normalizedEndpoint === "auth/login";

        if (isLoginRequest) {
            throw new Error(
                getErrorMessage(data, "Email hoặc mật khẩu không chính xác")
            );
        }

        if (isUserPage()) {
            clearCustomerAuth();

            if (window.location.pathname !== "/user/login") {
                window.location.href = "/user/login";
            }
        } else {
            clearAdminAuth();

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        throw new Error(
            getErrorMessage(data, "Token không hợp lệ hoặc đã hết hạn")
        );
    }

    // ================= ERROR KHÁC =================

    if (!response.ok) {
        console.error("API lỗi:", {
            url: `${API_URL}/${normalizedEndpoint}`,
            endpoint: normalizedEndpoint,
            status: response.status,
            data,
        });

        throw new Error(
            getErrorMessage(
                data,
                `Yêu cầu thất bại. Mã lỗi: ${response.status}`
            )
        );
    }

    return data;
}

// ================= AUTH =================

export async function apiLogin(email, password) {
    return request("auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: String(email || "").trim().toLowerCase(),
            password: String(password || ""),
        }),
    });
}

export async function apiGetCurrentUser() {
    return request("auth/me", {
        method: "GET",
    });
}

export function apiLogout() {
    if (isUserPage()) {
        clearCustomerAuth();
    } else {
        clearAdminAuth();
    }
}

// ================= CRUD CHUNG =================

export async function apiGet(module, params) {
    const queryString = new URLSearchParams(
        cleanQueryParams(params || {})
    ).toString();

    const endpoint = queryString ? `${module}?${queryString}` : module;

    return request(endpoint, {
        method: "GET",
    });
}

export async function apiGetById(module, id) {
    if (id === undefined || id === null || id === "") {
        throw new Error("Thiếu ID dữ liệu.");
    }

    return request(`${module}/${id}`, {
        method: "GET",
    });
}

export async function apiCreate(module, data) {
    return request(module, {
        method: "POST",
        body: JSON.stringify(data || {}),
    });
}

export async function apiUpdate(module, id, data) {
    if (id === undefined || id === null || id === "") {
        throw new Error("Thiếu ID dữ liệu.");
    }

    return request(`${module}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data || {}),
    });
}

export async function apiPatch(module, id, data) {
    if (id === undefined || id === null || id === "") {
        throw new Error("Thiếu ID dữ liệu.");
    }

    return request(`${module}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data || {}),
    });
}

export async function apiDelete(module, id) {
    if (id === undefined || id === null || id === "") {
        throw new Error("Thiếu ID dữ liệu.");
    }

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

export async function apiSearchTrips(params) {
    const queryString = new URLSearchParams(
        cleanQueryParams(params || {})
    ).toString();

    const endpoint = queryString ?
        `trips/search/available?${queryString}` :
        "trips/search/available";

    return request(endpoint, {
        method: "GET",
    });
}

export async function apiGetAvailableSeats(tripId) {
    if (!tripId) {
        throw new Error("Thiếu mã chuyến xe.");
    }

    return request(`trips/${tripId}/available-seats`, {
        method: "GET",
    });
}

// ================= BOOKINGS / ĐẶT VÉ =================

export async function apiCreateFullBooking(data) {
    return request("bookings/create-full", {
        method: "POST",
        body: JSON.stringify(data || {}),
    });
}

export async function apiGetBookingDetail(id) {
    if (!id) {
        throw new Error("Thiếu mã đặt vé.");
    }

    return request(`bookings/${id}/detail`, {
        method: "GET",
    });
}

export async function apiUpdateBookingStatus(id, data) {
    if (!id) {
        throw new Error("Thiếu mã đặt vé.");
    }

    return request(`bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(data || {}),
    });
}

// ================= TICKETS / VÉ =================

export async function apiCheckInTicket(id) {
    if (!id) {
        throw new Error("Thiếu mã vé.");
    }

    return request(`tickets/${id}/check-in`, {
        method: "PATCH",
    });
}

// ================= PAYMENTS / THANH TOÁN =================

export async function apiCreatePayment(data) {
    return request("payments", {
        method: "POST",
        body: JSON.stringify(data || {}),
    });
}

export async function apiUpdatePaymentStatus(id, data) {
    if (!id) {
        throw new Error("Thiếu mã thanh toán.");
    }

    return request(`payments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data || {}),
    });
}

// ================= ORDERS DỰ PHÒNG =================

export async function apiCreateFullOrder(data) {
    return request("orders/create-full", {
        method: "POST",
        body: JSON.stringify(data || {}),
    });
}

export async function apiUpdateFullOrder(id, data) {
    if (!id) {
        throw new Error("Thiếu mã đơn hàng.");
    }

    return request(`orders/${id}/update-full`, {
        method: "PUT",
        body: JSON.stringify(data || {}),
    });
}

export { API_URL };