import { useEffect, useMemo, useState } from "react";
import {
  apiGet,
  apiGetAvailableSeats,
  apiCreateFullBooking,
} from "../services/api";

export default function SalesMulti() {
  const [trips, setTrips] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [seats, setSeats] = useState([]);

  const [tripId, setTripId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadInitialData();
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

  async function loadInitialData() {
    try {
      setLoading(true);

      const [tripResponse, customerResponse] = await Promise.all([
        apiGet("trips"),
        apiGet("customers"),
      ]);

      setTrips(toArray(tripResponse));
      setCustomers(toArray(customerResponse));
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      alert(error.message || "Không tải được dữ liệu TransitGo");

      setTrips([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSeats(selectedTripId) {
    if (!selectedTripId) {
      setSeats([]);
      setSelectedSeatIds([]);
      return;
    }

    try {
      setLoadingSeats(true);
      setSelectedSeatIds([]);

      const response = await apiGetAvailableSeats(selectedTripId);

      setSeats(toArray(response));
    } catch (error) {
      console.error("Lỗi tải ghế:", error);
      alert(error.message || "Không tải được danh sách ghế");

      setSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  }

  function handleTripChange(event) {
    const value = event.target.value;

    setTripId(value);
    loadSeats(value);
  }

  function handleCustomerChange(event) {
    const value = event.target.value;

    setCustomerId(value);

    const customer = customers.find(
      (item) => Number(item.id) === Number(value)
    );

    if (customer) {
      setPassengerName(customer.name || "");
      setPassengerPhone(customer.phone || "");
      setPassengerEmail(customer.email || "");
    }
  }

  function toggleSeat(seat) {
    const isAvailable =
      seat.is_available === true ||
      seat.is_available === "true";

    if (!isAvailable) {
      return;
    }

    setSelectedSeatIds((previous) => {
      const exists = previous.includes(Number(seat.id));

      if (exists) {
        return previous.filter(
          (seatId) => seatId !== Number(seat.id)
        );
      }

      return [...previous, Number(seat.id)];
    });
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN");
  }

  function formatDateTime(value) {
    if (!value) {
      return "Chưa xác định";
    }

    return new Date(value).toLocaleString("vi-VN");
  }

  const selectedTrip = useMemo(() => {
    return trips.find(
      (trip) => Number(trip.id) === Number(tripId)
    );
  }, [trips, tripId]);

  const ticketPrice = Number(
    selectedTrip ? selectedTrip.ticket_price || 0 : 0
  );

  const totalAmount =
    ticketPrice * selectedSeatIds.length;

  const remainingAmount = Math.max(
    totalAmount - Number(paidAmount || 0),
    0
  );

  const selectedSeats = seats.filter((seat) =>
    selectedSeatIds.includes(Number(seat.id))
  );

  const filteredTrips = trips.filter((trip) => {
    const text = [
      trip.code,
      trip.route_name,
      trip.departure_station_name,
      trip.arrival_station_name,
      trip.license_plate,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  async function createBooking() {
    if (!tripId) {
      alert("Vui lòng chọn chuyến xe");
      return;
    }

    if (!passengerName.trim()) {
      alert("Vui lòng nhập tên hành khách");
      return;
    }

    if (!passengerPhone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    if (selectedSeatIds.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế");
      return;
    }

    if (Number(paidAmount || 0) > totalAmount) {
      alert("Số tiền thanh toán không được lớn hơn tổng tiền");
      return;
    }

    const payload = {
      customerId: customerId ? Number(customerId) : null,
      tripId: Number(tripId),

      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      passengerEmail: passengerEmail.trim() || null,

      seatIds: selectedSeatIds,

      paymentMethod,
      paidAmount: Number(paidAmount || 0),
      note: note.trim(),
    };

    try {
      setLoading(true);

      const response = await apiCreateFullBooking(payload);

      alert(
        response.message ||
          "Đặt vé thành công"
      );

      setCustomerId("");
      setPassengerName("");
      setPassengerPhone("");
      setPassengerEmail("");
      setSelectedSeatIds([]);
      setPaidAmount(0);
      setNote("");

      await loadSeats(tripId);
      await loadInitialData();
    } catch (error) {
      console.error("Lỗi tạo đặt vé:", error);

      alert(
        error.message ||
          "Không thể tạo đặt vé"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>
            🎫 Đặt vé xe buýt
          </h2>

          <p style={descriptionStyle}>
            Chọn chuyến xe, hành khách, ghế ngồi và tạo vé
            TransitGo.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInitialData}
          style={reloadButtonStyle}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "⟳ Tải lại"}
        </button>
      </div>

      <div style={mainGridStyle}>
        {/* CỘT TRÁI */}
        <div style={leftColumnStyle}>
          <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h3 style={{ margin: 0 }}>
                  1. Chọn chuyến xe
                </h3>

                <p style={sectionDescriptionStyle}>
                  Chọn chuyến xe cần đặt vé.
                </p>
              </div>

              <input
                type="text"
                placeholder="Tìm mã chuyến, tuyến xe..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                style={searchInputStyle}
              />
            </div>

            <select
              value={tripId}
              onChange={handleTripChange}
              style={inputStyle}
            >
              <option value="">
                -- Chọn chuyến xe --
              </option>

              {filteredTrips.map((trip) => (
                <option
                  key={trip.id}
                  value={trip.id}
                >
                  {trip.code || `Chuyến #${trip.id}`}
                  {" - "}
                  {trip.route_name || `Tuyến #${trip.route_id}`}
                  {" - "}
                  {formatDateTime(trip.departure_time)}
                </option>
              ))}
            </select>

            {selectedTrip && (
              <div style={tripInformationStyle}>
                <div style={informationItemStyle}>
                  <span style={informationLabelStyle}>
                    Mã chuyến
                  </span>

                  <strong>
                    {selectedTrip.code ||
                      `#${selectedTrip.id}`}
                  </strong>
                </div>

                <div style={informationItemStyle}>
                  <span style={informationLabelStyle}>
                    Giờ khởi hành
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedTrip.departure_time
                    )}
                  </strong>
                </div>

                <div style={informationItemStyle}>
                  <span style={informationLabelStyle}>
                    Giá vé
                  </span>

                  <strong style={{ color: "#2563eb" }}>
                    {formatMoney(ticketPrice)} đ
                  </strong>
                </div>

                <div style={informationItemStyle}>
                  <span style={informationLabelStyle}>
                    Ghế còn lại
                  </span>

                  <strong>
                    {selectedTrip.available_seats || 0}
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h3 style={{ margin: 0 }}>
                  2. Chọn ghế
                </h3>

                <p style={sectionDescriptionStyle}>
                  Màu xanh là ghế đang chọn, màu xám là ghế
                  đã được đặt.
                </p>
              </div>
            </div>

            {!tripId && (
              <div style={emptyStyle}>
                Vui lòng chọn chuyến xe trước
              </div>
            )}

            {tripId && loadingSeats && (
              <div style={emptyStyle}>
                Đang tải danh sách ghế...
              </div>
            )}

            {tripId &&
              !loadingSeats &&
              seats.length === 0 && (
                <div style={emptyStyle}>
                  Chuyến xe chưa có ghế hoặc chưa được gán xe
                  buýt
                </div>
              )}

            {tripId &&
              !loadingSeats &&
              seats.length > 0 && (
                <>
                  <div style={driverAreaStyle}>
                    🚌 Phía trước xe
                  </div>

                  <div style={seatGridStyle}>
                    {seats.map((seat) => {
                      const isAvailable =
                        seat.is_available === true ||
                        seat.is_available === "true";

                      const isSelected =
                        selectedSeatIds.includes(
                          Number(seat.id)
                        );

                      return (
                        <button
                          type="button"
                          key={seat.id}
                          disabled={!isAvailable}
                          onClick={() =>
                            toggleSeat(seat)
                          }
                          style={{
                            ...seatButtonStyle,

                            background: !isAvailable
                              ? "#d1d5db"
                              : isSelected
                              ? "#2563eb"
                              : "#ffffff",

                            color:
                              isSelected && isAvailable
                                ? "#ffffff"
                                : "#111827",

                            borderColor: isSelected
                              ? "#2563eb"
                              : "#d1d5db",

                            cursor: isAvailable
                              ? "pointer"
                              : "not-allowed",
                          }}
                        >
                          {seat.seat_number}
                        </button>
                      );
                    })}
                  </div>

                  <div style={seatLegendStyle}>
                    <span style={legendItemStyle}>
                      <span
                        style={{
                          ...legendColorStyle,
                          background: "#ffffff",
                        }}
                      />
                      Ghế trống
                    </span>

                    <span style={legendItemStyle}>
                      <span
                        style={{
                          ...legendColorStyle,
                          background: "#2563eb",
                        }}
                      />
                      Đang chọn
                    </span>

                    <span style={legendItemStyle}>
                      <span
                        style={{
                          ...legendColorStyle,
                          background: "#d1d5db",
                        }}
                      />
                      Đã đặt
                    </span>
                  </div>
                </>
              )}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div style={rightColumnStyle}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>
              3. Thông tin hành khách
            </h3>

            <label style={labelStyle}>
              Khách hàng có sẵn
            </label>

            <select
              value={customerId}
              onChange={handleCustomerChange}
              style={inputStyle}
            >
              <option value="">
                -- Khách lẻ hoặc chọn khách hàng --
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name}
                  {customer.phone
                    ? ` - ${customer.phone}`
                    : ""}
                </option>
              ))}
            </select>

            <label style={labelStyle}>
              Họ và tên
            </label>

            <input
              type="text"
              value={passengerName}
              onChange={(event) =>
                setPassengerName(event.target.value)
              }
              placeholder="Nhập tên hành khách"
              style={inputStyle}
            />

            <label style={labelStyle}>
              Số điện thoại
            </label>

            <input
              type="text"
              value={passengerPhone}
              onChange={(event) =>
                setPassengerPhone(event.target.value)
              }
              placeholder="Nhập số điện thoại"
              style={inputStyle}
            />

            <label style={labelStyle}>
              Email
            </label>

            <input
              type="email"
              value={passengerEmail}
              onChange={(event) =>
                setPassengerEmail(event.target.value)
              }
              placeholder="Nhập email, không bắt buộc"
              style={inputStyle}
            />
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>
              4. Thanh toán
            </h3>

            <label style={labelStyle}>
              Phương thức thanh toán
            </label>

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              style={inputStyle}
            >
              <option value="cash">
                Tiền mặt
              </option>

              <option value="bank_transfer">
                Chuyển khoản
              </option>

              <option value="momo">
                MoMo
              </option>

              <option value="vnpay">
                VNPay
              </option>

              <option value="zalopay">
                ZaloPay
              </option>
            </select>

            <div style={summaryStyle}>
              <div style={summaryRowStyle}>
                <span>Ghế đã chọn</span>

                <strong>
                  {selectedSeats.length > 0
                    ? selectedSeats
                        .map((seat) => seat.seat_number)
                        .join(", ")
                    : "Chưa chọn"}
                </strong>
              </div>

              <div style={summaryRowStyle}>
                <span>Số lượng vé</span>

                <strong>
                  {selectedSeatIds.length}
                </strong>
              </div>

              <div style={summaryRowStyle}>
                <span>Giá mỗi vé</span>

                <strong>
                  {formatMoney(ticketPrice)} đ
                </strong>
              </div>

              <div style={totalRowStyle}>
                <span>Tổng tiền</span>

                <strong>
                  {formatMoney(totalAmount)} đ
                </strong>
              </div>
            </div>

            <label style={labelStyle}>
              Khách thanh toán
            </label>

            <input
              type="number"
              min="0"
              max={totalAmount}
              value={paidAmount}
              onChange={(event) =>
                setPaidAmount(event.target.value)
              }
              style={inputStyle}
            />

            <div style={remainingStyle}>
              <span>Còn lại</span>

              <strong
                style={{
                  color:
                    remainingAmount > 0
                      ? "#dc2626"
                      : "#16a34a",
                }}
              >
                {formatMoney(remainingAmount)} đ
              </strong>
            </div>

            <label style={labelStyle}>
              Ghi chú
            </label>

            <textarea
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              placeholder="Ghi chú đặt vé..."
              style={textareaStyle}
            />

            <button
              type="button"
              onClick={createBooking}
              disabled={loading}
              style={{
                ...createButtonStyle,
                opacity: loading ? 0.6 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Đang tạo vé..."
                : "🎫 Xác nhận đặt vé"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const pageStyle = {
  minHeight: "100vh",
  padding: 24,
  background: "#f4f7fb",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 20,
};

const descriptionStyle = {
  margin: "6px 0 0",
  color: "#6b7280",
};

const reloadButtonStyle = {
  padding: "10px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 9,
  background: "#ffffff",
  cursor: "pointer",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 420px",
  gap: 20,
  alignItems: "start",
};

const leftColumnStyle = {
  display: "grid",
  gap: 20,
};

const rightColumnStyle = {
  display: "grid",
  gap: 20,
  position: "sticky",
  top: 16,
};

const cardStyle = {
  padding: 18,
  borderRadius: 14,
  background: "#ffffff",
  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 16,
};

const sectionDescriptionStyle = {
  margin: "5px 0 0",
  color: "#6b7280",
  fontSize: 14,
};

const searchInputStyle = {
  width: 260,
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 9,
  outline: "none",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 9,
  outline: "none",
  background: "#ffffff",
  marginBottom: 14,
};

const labelStyle = {
  display: "block",
  marginBottom: 7,
  fontWeight: 600,
  color: "#374151",
};

const tripInformationStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginTop: 6,
};

const informationItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 12,
  borderRadius: 10,
  background: "#f8fafc",
};

const informationLabelStyle = {
  color: "#6b7280",
  fontSize: 13,
};

const driverAreaStyle = {
  width: 180,
  margin: "0 auto 20px",
  padding: "12px 16px",
  borderRadius: 12,
  textAlign: "center",
  background: "#e0e7ff",
  color: "#3730a3",
  fontWeight: 700,
};

const seatGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 58px)",
  justifyContent: "center",
  gap: 14,
};

const seatButtonStyle = {
  width: 58,
  height: 48,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontWeight: 700,
};

const seatLegendStyle = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: 20,
  marginTop: 22,
};

const legendItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  color: "#4b5563",
};

const legendColorStyle = {
  width: 18,
  height: 18,
  border: "1px solid #d1d5db",
  borderRadius: 5,
};

const emptyStyle = {
  padding: 34,
  textAlign: "center",
  color: "#6b7280",
  background: "#f9fafb",
  borderRadius: 12,
};

const summaryStyle = {
  padding: 14,
  marginBottom: 15,
  borderRadius: 10,
  background: "#f8fafc",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "7px 0",
};

const totalRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  paddingTop: 12,
  marginTop: 7,
  borderTop: "1px solid #d1d5db",
  color: "#1d4ed8",
  fontSize: 18,
};

const remainingStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 14,
  padding: "10px 12px",
  borderRadius: 8,
  background: "#f9fafb",
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 80,
  resize: "vertical",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 9,
  outline: "none",
  marginBottom: 14,
};

const createButtonStyle = {
  width: "100%",
  padding: 13,
  border: "none",
  borderRadius: 10,
  background: "#16a34a",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
};