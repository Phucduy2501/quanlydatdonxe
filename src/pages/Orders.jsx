import { useEffect, useState } from "react";
import {
  apiGet,
  apiDelete,
  apiGetBookingDetail,
  apiUpdateBookingStatus,
  apiCheckInTicket,
} from "../services/api";

export default function Orders() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  function toArray(response) {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }

  async function fetchData() {
    try {
      setLoading(true);

      const [
        bookingResponse,
        customerResponse,
        tripResponse,
        routeResponse,
      ] = await Promise.all([
        apiGet("bookings"),
        apiGet("customers"),
        apiGet("trips"),
        apiGet("routes"),
      ]);

      setBookings(toArray(bookingResponse));
      setCustomers(toArray(customerResponse));
      setTrips(toArray(tripResponse));
      setRoutes(toArray(routeResponse));
    } catch (error) {
      console.error("Lỗi tải dữ liệu đặt vé:", error);

      alert(
        error.message ||
          "Không tải được danh sách đặt vé"
      );

      setBookings([]);
      setCustomers([]);
      setTrips([]);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  function getCustomer(customerId) {
    return customers.find(
      (customer) =>
        String(customer.id) === String(customerId)
    );
  }

  function getTrip(tripId) {
    return trips.find(
      (trip) =>
        String(trip.id) === String(tripId)
    );
  }

  function getRoute(routeId) {
    return routes.find(
      (route) =>
        String(route.id) === String(routeId)
    );
  }

  function formatMoney(value) {
    return (
      Number(value || 0).toLocaleString("vi-VN") +
      " đ"
    );
  }

  function formatDateTime(value) {
    if (!value) {
      return "Chưa xác định";
    }

    return new Date(value).toLocaleString("vi-VN");
  }

  function getBookingStatusLabel(status) {
    const statusMap = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Đã hoàn thành",
      cancelled: "Đã hủy",
    };

    return statusMap[status] || status || "Chưa xác định";
  }

  function getPaymentStatusLabel(status) {
    const statusMap = {
      unpaid: "Chưa thanh toán",
      paid: "Đã thanh toán",
      refunded: "Đã hoàn tiền",
    };

    return statusMap[status] || status || "Chưa xác định";
  }

  function getPaymentMethodLabel(method) {
    const methodMap = {
      cash: "Tiền mặt",
      bank_transfer: "Chuyển khoản",
      bank: "Chuyển khoản",
      momo: "MoMo",
      vnpay: "VNPay",
      zalopay: "ZaloPay",
    };

    return methodMap[method] || method || "Chưa xác định";
  }

  function getBookingStatusStyle(status) {
    const styles = {
      pending: {
        background: "#fef3c7",
        color: "#92400e",
      },
      confirmed: {
        background: "#dcfce7",
        color: "#166534",
      },
      completed: {
        background: "#dbeafe",
        color: "#1e40af",
      },
      cancelled: {
        background: "#fee2e2",
        color: "#991b1b",
      },
    };

    return styles[status] || {
      background: "#f3f4f6",
      color: "#374151",
    };
  }

  function getPaymentStatusStyle(status) {
    const styles = {
      unpaid: {
        background: "#fee2e2",
        color: "#991b1b",
      },
      paid: {
        background: "#dcfce7",
        color: "#166534",
      },
      refunded: {
        background: "#e0e7ff",
        color: "#3730a3",
      },
    };

    return styles[status] || {
      background: "#f3f4f6",
      color: "#374151",
    };
  }

  async function handleView(booking) {
    try {
      setSelected(booking);
      setDetail(null);
      setLoadingDetail(true);

      const response = await apiGetBookingDetail(
        booking.id
      );

      setDetail(response);
    } catch (error) {
      console.error(
        "Lỗi lấy chi tiết đặt vé:",
        error
      );

      alert(
        error.message ||
          "Không tải được chi tiết đặt vé"
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleConfirm(booking) {
    if (
      !window.confirm(
        `Xác nhận đặt vé ${booking.booking_code}?`
      )
    ) {
      return;
    }

    try {
      await apiUpdateBookingStatus(booking.id, {
        bookingStatus: "confirmed",
      });

      alert("Đã xác nhận đặt vé");

      await fetchData();
      await handleView(booking);
    } catch (error) {
      console.error(
        "Lỗi xác nhận đặt vé:",
        error
      );

      alert(
        error.message ||
          "Không thể xác nhận đặt vé"
      );
    }
  }

  async function handleCancel(booking) {
    if (
      !window.confirm(
        `Bạn có chắc muốn hủy đặt vé ${booking.booking_code}?`
      )
    ) {
      return;
    }

    try {
      await apiUpdateBookingStatus(booking.id, {
        bookingStatus: "cancelled",
      });

      alert("Đã hủy đặt vé");

      setSelected(null);
      setDetail(null);

      await fetchData();
    } catch (error) {
      console.error("Lỗi hủy đặt vé:", error);

      alert(
        error.message ||
          "Không thể hủy đặt vé"
      );
    }
  }

  async function handleMarkPaid(booking) {
    if (
      !window.confirm(
        `Xác nhận booking ${booking.booking_code} đã thanh toán?`
      )
    ) {
      return;
    }

    try {
      await apiUpdateBookingStatus(booking.id, {
        bookingStatus: "confirmed",
        paymentStatus: "paid",
      });

      alert("Đã cập nhật thanh toán");

      await fetchData();
      await handleView(booking);
    } catch (error) {
      console.error(
        "Lỗi cập nhật thanh toán:",
        error
      );

      alert(
        error.message ||
          "Không thể cập nhật thanh toán"
      );
    }
  }

  async function handleCheckIn(ticket) {
    if (
      !window.confirm(
        `Check-in vé ${ticket.ticket_code}?`
      )
    ) {
      return;
    }

    try {
      await apiCheckInTicket(ticket.id);

      alert("Check-in vé thành công");

      if (selected) {
        await handleView(selected);
      }
    } catch (error) {
      console.error("Lỗi check-in:", error);

      alert(
        error.message ||
          "Không thể check-in vé"
      );
    }
  }

  async function handleDelete(booking) {
    if (
      !window.confirm(
        `Xóa hoàn toàn booking ${booking.booking_code}?`
      )
    ) {
      return;
    }

    try {
      await apiDelete("bookings", booking.id);

      alert("Đã xóa đặt vé");

      setSelected(null);
      setDetail(null);

      await fetchData();
    } catch (error) {
      console.error("Lỗi xóa đặt vé:", error);

      alert(
        error.message ||
          "Không thể xóa vì booking đang có vé hoặc thanh toán liên quan"
      );
    }
  }

  function handlePrint() {
    if (!detail || !detail.booking) {
      return;
    }

    const booking = detail.booking;
    const tickets = detail.tickets || [];
    const payments = detail.payments || [];

    const payment = payments[0] || {};

    const popup = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!popup) {
      alert(
        "Trình duyệt đang chặn cửa sổ in"
      );
      return;
    }

    popup.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <title>Vé xe TransitGo</title>

          <style>
            @page {
              size: A4;
              margin: 15mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              color: #111827;
            }

            .ticket-wrapper {
              max-width: 850px;
              margin: auto;
              border: 2px solid #2563eb;
              border-radius: 16px;
              overflow: hidden;
            }

            .ticket-header {
              padding: 22px;
              background: #2563eb;
              color: white;
              text-align: center;
            }

            .ticket-header h1 {
              margin: 0;
              font-size: 30px;
            }

            .ticket-header p {
              margin: 8px 0 0;
            }

            .ticket-body {
              padding: 24px;
            }

            .booking-code {
              padding: 14px;
              margin-bottom: 20px;
              text-align: center;
              background: #eff6ff;
              border-radius: 10px;
              font-size: 22px;
              font-weight: bold;
              color: #1d4ed8;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px 30px;
              margin-bottom: 24px;
            }

            .info-item {
              border-bottom: 1px dashed #d1d5db;
              padding-bottom: 8px;
            }

            .label {
              display: block;
              color: #6b7280;
              font-size: 13px;
              margin-bottom: 5px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #eff6ff;
            }

            .summary {
              margin-top: 20px;
              display: flex;
              justify-content: flex-end;
            }

            .summary-box {
              width: 340px;
              background: #f8fafc;
              border-radius: 10px;
              padding: 14px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }

            .total {
              margin-top: 8px;
              padding-top: 10px;
              border-top: 1px solid #d1d5db;
              font-size: 18px;
              font-weight: bold;
              color: #1d4ed8;
            }

            .footer {
              margin-top: 25px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="ticket-wrapper">
            <div class="ticket-header">
              <h1>🚌 TRANSITGO</h1>
              <p>Hệ thống đặt vé xe buýt và quản lý tuyến đường</p>
            </div>

            <div class="ticket-body">
              <div class="booking-code">
                MÃ ĐẶT VÉ: ${booking.booking_code || booking.id}
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Hành khách</span>
                  <strong>${booking.passenger_name || ""}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Số điện thoại</span>
                  <strong>${booking.passenger_phone || ""}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Tuyến xe</span>
                  <strong>${booking.route_name || booking.route_code || ""}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Mã chuyến</span>
                  <strong>${booking.trip_code || ""}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Điểm đi</span>
                  <strong>${booking.departure_station_name || ""}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Điểm đến</span>
                  <strong>${booking.arrival_station_name || ""}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Khởi hành</span>
                  <strong>${formatDateTime(booking.departure_time)}</strong>
                </div>

                <div class="info-item">
                  <span class="label">Trạng thái</span>
                  <strong>${getBookingStatusLabel(
                    booking.booking_status
                  )}</strong>
                </div>
              </div>

              <h3>Danh sách vé</h3>

              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã vé</th>
                    <th>Ghế</th>
                    <th>Hành khách</th>
                    <th>Giá vé</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  ${
                    tickets.length > 0
                      ? tickets
                          .map(
                            (ticket, index) => `
                              <tr>
                                <td>${index + 1}</td>
                                <td>${ticket.ticket_code || ""}</td>
                                <td>${ticket.seat_number || "Chưa xếp ghế"}</td>
                                <td>${ticket.passenger_name || ""}</td>
                                <td>${formatMoney(ticket.price)}</td>
                                <td>${ticket.ticket_status || ""}</td>
                              </tr>
                            `
                          )
                          .join("")
                      : `
                        <tr>
                          <td colspan="6" style="text-align:center">
                            Chưa có vé
                          </td>
                        </tr>
                      `
                  }
                </tbody>
              </table>

              <div class="summary">
                <div class="summary-box">
                  <div class="summary-row">
                    <span>Phương thức</span>
                    <strong>${getPaymentMethodLabel(
                      payment.payment_method
                    )}</strong>
                  </div>

                  <div class="summary-row">
                    <span>Thanh toán</span>
                    <strong>${getPaymentStatusLabel(
                      booking.payment_status
                    )}</strong>
                  </div>

                  <div class="summary-row total">
                    <span>Tổng tiền</span>
                    <strong>${formatMoney(
                      booking.total_amount
                    )}</strong>
                  </div>
                </div>
              </div>

              <div class="footer">
                Cảm ơn quý khách đã sử dụng dịch vụ TransitGo!
              </div>
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  const filteredBookings = bookings.filter(
    (booking) => {
      const customer = getCustomer(
        booking.customer_id
      );

      const trip = getTrip(booking.trip_id);
      const route = trip
        ? getRoute(trip.route_id)
        : null;

      const text = [
        booking.id,
        booking.booking_code,
        booking.passenger_name,
        booking.passenger_phone,
        booking.passenger_email,
        booking.booking_status,
        booking.payment_status,
        customer && customer.name,
        customer && customer.phone,
        trip && trip.code,
        route && route.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    }
  );

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>
            🎫 Quản lý đặt vé
          </h2>

          <p style={descriptionStyle}>
            Theo dõi booking, vé xe, thanh toán và check-in
            hành khách.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          style={reloadButtonStyle}
          disabled={loading}
        >
          {loading
            ? "Đang tải..."
            : "⟳ Tải lại"}
        </button>
      </div>

      <div style={searchBarStyle}>
        <input
          type="text"
          placeholder="🔍 Tìm mã booking, hành khách, số điện thoại..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          style={searchInputStyle}
        />

        <div style={countStyle}>
          Tổng:{" "}
          <strong>
            {filteredBookings.length}
          </strong>{" "}
          booking
        </div>
      </div>

      <div style={mainGridStyle}>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>
                  Mã booking
                </th>

                <th style={tableHeaderStyle}>
                  Hành khách
                </th>

                <th style={tableHeaderStyle}>
                  Chuyến xe
                </th>

                <th style={tableHeaderStyle}>
                  Tổng tiền
                </th>

                <th style={tableHeaderStyle}>
                  Đặt vé
                </th>

                <th style={tableHeaderStyle}>
                  Thanh toán
                </th>

                <th style={tableHeaderStyle}>
                  Ngày đặt
                </th>

                <th style={tableHeaderStyle}>
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map(
                (booking) => {
                  const trip = getTrip(
                    booking.trip_id
                  );

                  const route = trip
                    ? getRoute(trip.route_id)
                    : null;

                  return (
                    <tr key={booking.id}>
                      <td style={tableCellStyle}>
                        <strong>
                          {booking.booking_code ||
                            `BK-${booking.id}`}
                        </strong>
                      </td>

                      <td style={tableCellStyle}>
                        <strong>
                          {booking.passenger_name ||
                            "Chưa có tên"}
                        </strong>

                        <br />

                        <small style={mutedStyle}>
                          {booking.passenger_phone ||
                            ""}
                        </small>
                      </td>

                      <td style={tableCellStyle}>
                        {trip
                          ? trip.code ||
                            `Chuyến #${trip.id}`
                          : `Chuyến #${booking.trip_id}`}

                        <br />

                        <small style={mutedStyle}>
                          {route
                            ? route.name
                            : ""}
                        </small>
                      </td>

                      <td style={tableCellStyle}>
                        <strong>
                          {formatMoney(
                            booking.total_amount
                          )}
                        </strong>
                      </td>

                      <td style={tableCellStyle}>
                        <span
                          style={{
                            ...statusStyle,
                            ...getBookingStatusStyle(
                              booking.booking_status
                            ),
                          }}
                        >
                          {getBookingStatusLabel(
                            booking.booking_status
                          )}
                        </span>
                      </td>

                      <td style={tableCellStyle}>
                        <span
                          style={{
                            ...statusStyle,
                            ...getPaymentStatusStyle(
                              booking.payment_status
                            ),
                          }}
                        >
                          {getPaymentStatusLabel(
                            booking.payment_status
                          )}
                        </span>
                      </td>

                      <td style={tableCellStyle}>
                        {formatDateTime(
                          booking.booking_time ||
                            booking.created_at
                        )}
                      </td>

                      <td style={tableCellStyle}>
                        <div style={actionStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              handleView(booking)
                            }
                            style={viewButtonStyle}
                            title="Xem chi tiết"
                          >
                            👁
                          </button>

                          {booking.booking_status ===
                            "pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleConfirm(
                                  booking
                                )
                              }
                              style={
                                confirmButtonStyle
                              }
                              title="Xác nhận"
                            >
                              ✓
                            </button>
                          )}

                          {booking.payment_status ===
                            "unpaid" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkPaid(
                                  booking
                                )
                              }
                              style={paidButtonStyle}
                              title="Đã thanh toán"
                            >
                              💳
                            </button>
                          )}

                          {booking.booking_status !==
                            "cancelled" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancel(
                                  booking
                                )
                              }
                              style={
                                cancelButtonStyle
                              }
                              title="Hủy vé"
                            >
                              ✕
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(booking)
                            }
                            style={deleteButtonStyle}
                            title="Xóa"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}

              {filteredBookings.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    style={emptyTableStyle}
                  >
                    Chưa có đặt vé hoặc không tìm thấy dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={detailBoxStyle}>
          <div style={detailHeaderStyle}>
            <h3 style={{ margin: 0 }}>
              Chi tiết đặt vé
            </h3>

            {selected && detail && (
              <button
                type="button"
                onClick={handlePrint}
                style={printButtonStyle}
              >
                🖨 In vé
              </button>
            )}
          </div>

          {!selected && (
            <div style={emptyDetailStyle}>
              Chọn biểu tượng 👁 để xem chi tiết booking
            </div>
          )}

          {selected && loadingDetail && (
            <div style={emptyDetailStyle}>
              Đang tải chi tiết...
            </div>
          )}

          {selected &&
            !loadingDetail &&
            detail && (
              <>
                <div style={bookingCodeStyle}>
                  {detail.booking.booking_code ||
                    `BK-${detail.booking.id}`}
                </div>

                <div style={detailItemStyle}>
                  <span style={detailLabelStyle}>
                    Hành khách
                  </span>

                  <strong>
                    {detail.booking.passenger_name}
                  </strong>
                </div>

                <div style={detailItemStyle}>
                  <span style={detailLabelStyle}>
                    Điện thoại
                  </span>

                  <strong>
                    {detail.booking.passenger_phone}
                  </strong>
                </div>

                <div style={detailItemStyle}>
                  <span style={detailLabelStyle}>
                    Email
                  </span>

                  <strong>
                    {detail.booking.passenger_email ||
                      "Không có"}
                  </strong>
                </div>

                <div style={detailItemStyle}>
                  <span style={detailLabelStyle}>
                    Tuyến xe
                  </span>

                  <strong>
                    {detail.booking.route_name ||
                      detail.booking.route_code ||
                      ""}
                  </strong>
                </div>

                <div style={detailItemStyle}>
                  <span style={detailLabelStyle}>
                    Khởi hành
                  </span>

                  <strong>
                    {formatDateTime(
                      detail.booking.departure_time
                    )}
                  </strong>
                </div>

                <div style={detailItemStyle}>
                  <span style={detailLabelStyle}>
                    Tổng tiền
                  </span>

                  <strong style={{ color: "#2563eb" }}>
                    {formatMoney(
                      detail.booking.total_amount
                    )}
                  </strong>
                </div>

                <h4 style={sectionTitleStyle}>
                  Danh sách vé
                </h4>

                {detail.tickets &&
                detail.tickets.length > 0 ? (
                  detail.tickets.map(
                    (ticket) => (
                      <div
                        key={ticket.id}
                        style={ticketCardStyle}
                      >
                        <div>
                          <strong>
                            Ghế{" "}
                            {ticket.seat_number ||
                              "Chưa xác định"}
                          </strong>

                          <div style={ticketCodeStyle}>
                            {ticket.ticket_code}
                          </div>

                          <small style={mutedStyle}>
                            {formatMoney(
                              ticket.price
                            )}
                          </small>
                        </div>

                        <div>
                          <span
                            style={{
                              ...statusStyle,
                              background:
                                ticket.ticket_status ===
                                "used"
                                  ? "#dbeafe"
                                  : ticket.ticket_status ===
                                    "cancelled"
                                  ? "#fee2e2"
                                  : "#dcfce7",

                              color:
                                ticket.ticket_status ===
                                "used"
                                  ? "#1e40af"
                                  : ticket.ticket_status ===
                                    "cancelled"
                                  ? "#991b1b"
                                  : "#166534",
                            }}
                          >
                            {ticket.ticket_status ===
                            "used"
                              ? "Đã sử dụng"
                              : ticket.ticket_status ===
                                "cancelled"
                              ? "Đã hủy"
                              : "Hợp lệ"}
                          </span>

                          {ticket.ticket_status ===
                            "valid" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCheckIn(
                                  ticket
                                )
                              }
                              style={
                                checkInButtonStyle
                              }
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <p style={mutedStyle}>
                    Booking chưa có vé
                  </p>
                )}

                <h4 style={sectionTitleStyle}>
                  Thanh toán
                </h4>

                {detail.payments &&
                detail.payments.length > 0 ? (
                  detail.payments.map(
                    (payment) => (
                      <div
                        key={payment.id}
                        style={paymentCardStyle}
                      >
                        <div>
                          <strong>
                            {formatMoney(
                              payment.amount
                            )}
                          </strong>

                          <div style={mutedStyle}>
                            {getPaymentMethodLabel(
                              payment.payment_method
                            )}
                          </div>
                        </div>

                        <span
                          style={{
                            ...statusStyle,
                            background:
                              payment.payment_status ===
                              "success"
                                ? "#dcfce7"
                                : "#fef3c7",

                            color:
                              payment.payment_status ===
                              "success"
                                ? "#166534"
                                : "#92400e",
                          }}
                        >
                          {payment.payment_status ===
                          "success"
                            ? "Thành công"
                            : "Đang xử lý"}
                        </span>
                      </div>
                    )
                  )
                ) : (
                  <p style={mutedStyle}>
                    Chưa có giao dịch thanh toán
                  </p>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const pageStyle = {
  minHeight: "100vh",
  padding: 22,
  background: "#f4f7fb",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  marginBottom: 18,
};

const descriptionStyle = {
  margin: "6px 0 0",
  color: "#6b7280",
};

const reloadButtonStyle = {
  padding: "10px 15px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#ffffff",
  cursor: "pointer",
};

const searchBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  padding: 14,
  marginBottom: 18,
  borderRadius: 12,
  background: "#ffffff",
  boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
};

const searchInputStyle = {
  width: 420,
  maxWidth: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  outline: "none",
};

const countStyle = {
  color: "#4b5563",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 360px",
  gap: 18,
  alignItems: "start",
};

const tableWrapperStyle = {
  overflowX: "auto",
  borderRadius: 12,
  background: "#ffffff",
  boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
};

const tableStyle = {
  width: "100%",
  minWidth: 1050,
  borderCollapse: "collapse",
};

const tableHeaderStyle = {
  padding: 12,
  background: "#263b91",
  color: "#ffffff",
  textAlign: "left",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const tableCellStyle = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "middle",
  fontSize: 14,
};

const mutedStyle = {
  color: "#6b7280",
  fontSize: 13,
};

const statusStyle = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const actionStyle = {
  display: "flex",
  alignItems: "center",
  gap: 5,
};

const commonActionButton = {
  width: 32,
  height: 32,
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
};

const viewButtonStyle = {
  ...commonActionButton,
  background: "#dbeafe",
};

const confirmButtonStyle = {
  ...commonActionButton,
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 700,
};

const paidButtonStyle = {
  ...commonActionButton,
  background: "#e0e7ff",
};

const cancelButtonStyle = {
  ...commonActionButton,
  background: "#fef3c7",
  color: "#92400e",
};

const deleteButtonStyle = {
  ...commonActionButton,
  background: "#fee2e2",
};

const emptyTableStyle = {
  padding: 35,
  textAlign: "center",
  color: "#6b7280",
};

const detailBoxStyle = {
  padding: 17,
  borderRadius: 12,
  background: "#ffffff",
  boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
  position: "sticky",
  top: 15,
};

const detailHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 15,
};

const printButtonStyle = {
  padding: "8px 11px",
  border: "none",
  borderRadius: 7,
  background: "#263b91",
  color: "#ffffff",
  cursor: "pointer",
};

const emptyDetailStyle = {
  padding: 25,
  textAlign: "center",
  color: "#6b7280",
  background: "#f9fafb",
  borderRadius: 9,
};

const bookingCodeStyle = {
  padding: 12,
  marginBottom: 14,
  borderRadius: 9,
  background: "#eff6ff",
  color: "#1d4ed8",
  textAlign: "center",
  fontWeight: 800,
};

const detailItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
  padding: "9px 0",
  borderBottom: "1px solid #f0f0f0",
};

const detailLabelStyle = {
  color: "#6b7280",
};

const sectionTitleStyle = {
  margin: "20px 0 10px",
};

const ticketCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 12,
  marginBottom: 9,
  border: "1px solid #e5e7eb",
  borderRadius: 9,
};

const ticketCodeStyle = {
  margin: "4px 0",
  color: "#6b7280",
  fontSize: 12,
};

const checkInButtonStyle = {
  display: "block",
  marginTop: 7,
  padding: "6px 9px",
  border: "none",
  borderRadius: 6,
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
};

const paymentCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 12,
  marginBottom: 9,
  borderRadius: 9,
  background: "#f8fafc",
};