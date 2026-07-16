import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  apiGetById,
  apiGetAvailableSeats,
  apiCreateFullBooking,
} from "../../services/api";
import "./user.css";

function getCustomer() {
  const raw = localStorage.getItem("customer_user");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function UserBooking() {
  const navigate = useNavigate();
  const { tripId } = useParams();

  const customer = getCustomer();

  const [trip, setTrip] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [form, setForm] = useState({
    passengerName:
      customer?.name ||
      customer?.full_name ||
      customer?.fullName ||
      "",
    passengerPhone:
      customer?.phone ||
      customer?.phone_number ||
      customer?.phoneNumber ||
      "",
    passengerEmail: customer?.email || "",
    paymentMethod: "cash",
    note: "",
  });

  useEffect(() => {
    loadData();
  }, [tripId]);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.rows)) return res.rows;

    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [tripRes, seatRes] = await Promise.all([
        apiGetById("trips", tripId),
        apiGetAvailableSeats(tripId),
      ]);

      const tripData = tripRes?.data || tripRes;

      setTrip(tripData);
      setSeats(toArray(seatRes));
    } catch (error) {
      console.error("Lỗi tải đặt vé:", error);
      alert(error.message || "Không thể tải thông tin chuyến xe");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
  };

  const toggleSeat = (seat) => {
    const seatId = Number(seat.id);

    const existed = selectedSeats.some(
      (item) => Number(item.id) === seatId
    );

    if (existed) {
      setSelectedSeats((currentSeats) =>
        currentSeats.filter(
          (item) => Number(item.id) !== seatId
        )
      );
    } else {
      setSelectedSeats((currentSeats) => [
        ...currentSeats,
        seat,
      ]);
    }
  };

  const handleBooking = async () => {
    if (bookingLoading) return;

    if (!customer) {
      alert("Bạn cần đăng nhập trước khi đặt vé");
      navigate("/user/login");
      return;
    }

    const customerId =
      customer?.customer_id ||
      customer?.customerId ||
      customer?.id;

    if (!customerId) {
      alert(
        "Không tìm thấy mã khách hàng. Vui lòng đăng nhập lại."
      );

      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_user");

      navigate("/user/login");
      return;
    }

    const passengerName = form.passengerName.trim();
    const passengerPhone = form.passengerPhone.trim();
    const passengerEmail = form.passengerEmail.trim();
    const note = form.note.trim();

    if (!passengerName) {
      alert("Vui lòng nhập họ tên");
      return;
    }

    if (!passengerPhone) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ghế");
      return;
    }

    if (!tripId) {
      alert("Không tìm thấy mã chuyến xe");
      return;
    }

    const price = Number(trip?.price || 0);
    const totalAmount = price * selectedSeats.length;

    const payload = {
      customerId: Number(customerId),
      tripId: Number(tripId),
      passengerName,
      passengerPhone,
      passengerEmail,
      seatIds: selectedSeats.map((seat) =>
        Number(seat.id)
      ),
      totalAmount,
      paidAmount:
        form.paymentMethod === "cash"
          ? 0
          : totalAmount,
      paymentMethod: form.paymentMethod,
      note,
    };

    console.log("Customer đang đăng nhập:", customer);
    console.log("Payload đặt vé:", payload);

    try {
      setBookingLoading(true);

      const result = await apiCreateFullBooking(payload);

      console.log("Kết quả đặt vé:", result);

      alert("Đặt vé thành công");
      navigate("/user/my-ticket");
    } catch (error) {
      console.error("Lỗi đặt vé:", error);
      alert(error.message || "Lỗi đặt vé");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-web">
        <div className="user-loading">
          Đang tải thông tin chuyến...
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="user-web">
        <div className="user-loading">
          Không tìm thấy thông tin chuyến xe.
        </div>
      </div>
    );
  }

  const total =
    Number(trip?.price || 0) *
    selectedSeats.length;

  return (
    <div className="user-web">
      <header className="user-navbar">
        <div
          className="user-brand"
          onClick={() => navigate("/user")}
        >
          <div className="brand-icon">🚌</div>

          <div>
            <h2>TransitGo</h2>
            <span>Đặt vé xe</span>
          </div>
        </div>

        <nav>
          <button onClick={() => navigate("/user/search")}>
            Quay lại
          </button>

          <button
            onClick={() =>
              navigate("/user/my-ticket")
            }
          >
            Tra cứu vé
          </button>
        </nav>
      </header>

      <section className="booking-user-layout">
        <div className="booking-panel">
          <h2>Thông tin chuyến</h2>

          <p>
            Tuyến:{" "}
            <b>
              {trip.route_name ||
                trip.routeName ||
                trip.name ||
                "Chưa có tuyến"}
            </b>
          </p>

          <p>
            Mã chuyến:{" "}
            <b>
              {trip.trip_code ||
                trip.tripCode ||
                trip.code ||
                `CX${trip.id}`}
            </b>
          </p>

          <p>
            Giá vé:{" "}
            <b>{formatMoney(trip.price)}</b>
          </p>
        </div>

        <div className="booking-panel">
          <h2>Thông tin hành khách</h2>

          <input
            type="text"
            placeholder="Họ tên hành khách"
            value={form.passengerName}
            onChange={(event) =>
              setForm({
                ...form,
                passengerName: event.target.value,
              })
            }
          />

          <input
            type="text"
            placeholder="Số điện thoại"
            value={form.passengerPhone}
            onChange={(event) =>
              setForm({
                ...form,
                passengerPhone: event.target.value,
              })
            }
          />

          <input
            type="email"
            placeholder="Email"
            value={form.passengerEmail}
            onChange={(event) =>
              setForm({
                ...form,
                passengerEmail: event.target.value,
              })
            }
          />

          <select
            value={form.paymentMethod}
            onChange={(event) =>
              setForm({
                ...form,
                paymentMethod: event.target.value,
              })
            }
          >
            <option value="cash">
              Tiền mặt
            </option>

            <option value="bank">
              Chuyển khoản
            </option>

            <option value="momo">
              Ví điện tử
            </option>
          </select>

          <textarea
            placeholder="Ghi chú"
            value={form.note}
            onChange={(event) =>
              setForm({
                ...form,
                note: event.target.value,
              })
            }
          />
        </div>

        <div className="booking-panel">
          <h2>Chọn ghế</h2>

          <div className="seat-grid-user">
            {seats.length === 0 ? (
              <p>Chưa có danh sách ghế</p>
            ) : (
              seats.map((seat) => {
                const active = selectedSeats.some(
                  (item) =>
                    Number(item.id) ===
                    Number(seat.id)
                );

                const unavailable =
                  seat.is_available === false ||
                  seat.isAvailable === false ||
                  seat.status === "booked" ||
                  seat.status === "unavailable";

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={unavailable}
                    className={[
                      "seat-user",
                      active ? "active" : "",
                      unavailable
                        ? "disabled"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => toggleSeat(seat)}
                  >
                    {seat.seat_number ||
                      seat.seatNumber ||
                      seat.name ||
                      seat.id}
                  </button>
                );
              })
            )}
          </div>

          <div className="booking-total-user">
            <span>Tổng tiền</span>
            <b>{formatMoney(total)}</b>
          </div>

          <button
            type="button"
            className="confirm-booking-btn"
            onClick={handleBooking}
            disabled={bookingLoading}
          >
            {bookingLoading
              ? "Đang đặt vé..."
              : "Xác nhận đặt vé"}
          </button>
        </div>
      </section>
    </div>
  );
}