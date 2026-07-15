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

  const [form, setForm] = useState({
    passengerName: customer?.name || "",
    passengerPhone: customer?.phone || "",
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
    return [];
  };

  const loadData = async () => {
    try {
      const tripRes = await apiGetById("trips", tripId);
      setTrip(tripRes?.data || tripRes);

      const seatRes = await apiGetAvailableSeats(tripId);
      setSeats(toArray(seatRes));
    } catch (error) {
      console.log("Lỗi tải đặt vé:", error);
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
  };

  const toggleSeat = (seat) => {
    const existed = selectedSeats.find((item) => item.id === seat.id);

    if (existed) {
      setSelectedSeats(selectedSeats.filter((item) => item.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleBooking = async () => {
    if (!customer) {
      alert("Bạn cần đăng nhập trước khi đặt vé");
      navigate("/user/login");
      return;
    }

    if (!form.passengerName.trim()) {
      alert("Vui lòng nhập họ tên");
      return;
    }

    if (!form.passengerPhone.trim()) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ghế");
      return;
    }

    const price = Number(trip?.price || 0);
    const totalAmount = price * selectedSeats.length;

    const payload = {
      customerId: customer.id,
      tripId: Number(tripId),
      passengerName: form.passengerName,
      passengerPhone: form.passengerPhone,
      passengerEmail: form.passengerEmail,
      seatIds: selectedSeats.map((seat) => seat.id),
      totalAmount,
      paidAmount: totalAmount,
      paymentMethod: form.paymentMethod,
      note: form.note,
    };

    try {
      await apiCreateFullBooking(payload);

      alert("Đặt vé thành công");
      navigate("/user/my-ticket");
    } catch (error) {
      alert(error.message || "Lỗi đặt vé");
    }
  };

  if (!trip) {
    return (
      <div className="user-web">
        <div className="user-loading">Đang tải thông tin chuyến...</div>
      </div>
    );
  }

  const total = Number(trip.price || 0) * selectedSeats.length;

  return (
    <div className="user-web">
      <header className="user-navbar">
        <div className="user-brand" onClick={() => navigate("/user")}>
          <div className="brand-icon">🚌</div>
          <div>
            <h2>TransitGo</h2>
            <span>Đặt vé xe</span>
          </div>
        </div>

        <nav>
          <button onClick={() => navigate("/user/search")}>Quay lại</button>
          <button onClick={() => navigate("/user/my-ticket")}>Tra cứu vé</button>
        </nav>
      </header>

      <section className="booking-user-layout">
        <div className="booking-panel">
          <h2>Thông tin chuyến</h2>

          <p>
            Tuyến: <b>{trip.route_name || trip.name || "Chưa có tuyến"}</b>
          </p>

          <p>
            Mã chuyến: <b>{trip.trip_code || trip.code || `CX${trip.id}`}</b>
          </p>

          <p>
            Giá vé: <b>{formatMoney(trip.price)}</b>
          </p>
        </div>

        <div className="booking-panel">
          <h2>Thông tin hành khách</h2>

          <input
            placeholder="Họ tên hành khách"
            value={form.passengerName}
            onChange={(e) =>
              setForm({ ...form, passengerName: e.target.value })
            }
          />

          <input
            placeholder="Số điện thoại"
            value={form.passengerPhone}
            onChange={(e) =>
              setForm({ ...form, passengerPhone: e.target.value })
            }
          />

          <input
            placeholder="Email"
            value={form.passengerEmail}
            onChange={(e) =>
              setForm({ ...form, passengerEmail: e.target.value })
            }
          />

          <select
            value={form.paymentMethod}
            onChange={(e) =>
              setForm({ ...form, paymentMethod: e.target.value })
            }
          >
            <option value="cash">Tiền mặt</option>
            <option value="bank">Chuyển khoản</option>
            <option value="momo">Ví điện tử</option>
          </select>
        </div>

        <div className="booking-panel">
          <h2>Chọn ghế</h2>

          <div className="seat-grid-user">
            {seats.length === 0 ? (
              <p>Chưa có danh sách ghế</p>
            ) : (
              seats.map((seat) => {
                const active = selectedSeats.find(
                  (item) => item.id === seat.id
                );

                return (
                  <button
                    key={seat.id}
                    className={active ? "seat-user active" : "seat-user"}
                    onClick={() => toggleSeat(seat)}
                  >
                    {seat.seat_number || seat.name || seat.id}
                  </button>
                );
              })
            )}
          </div>

          <div className="booking-total-user">
            <span>Tổng tiền</span>
            <b>{formatMoney(total)}</b>
          </div>

          <button className="confirm-booking-btn" onClick={handleBooking}>
            Xác nhận đặt vé
          </button>
        </div>
      </section>
    </div>
  );
}