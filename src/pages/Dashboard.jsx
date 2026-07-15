import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { apiGet } from "../services/api";
import "./dashboard.css";

const demoBookings = [
  {
    id: 1,
    booking_code: "BK001",
    customer_name: "Nguyễn Văn An",
    total: 450000,
    status: "confirmed",
  },
  {
    id: 2,
    booking_code: "BK002",
    customer_name: "Trần Thị Bình",
    total: 320000,
    status: "pending",
  },
  {
    id: 3,
    booking_code: "BK003",
    customer_name: "Lê Hoàng Nam",
    total: 520000,
    status: "paid",
  },
];

const demoTrips = [
  {
    id: 1,
    trip_code: "CX001",
    route_name: "Đà Nẵng - Huế",
    departure_time: "2026-07-15T08:00:00",
    total_seats: 40,
    booked_seats: 28,
    status: "active",
  },
  {
    id: 2,
    trip_code: "CX002",
    route_name: "Đà Nẵng - Hội An",
    departure_time: "2026-07-15T13:30:00",
    total_seats: 30,
    booked_seats: 12,
    status: "active",
  },
  {
    id: 3,
    trip_code: "CX003",
    route_name: "Huế - Quảng Bình",
    departure_time: "2026-07-16T07:00:00",
    total_seats: 40,
    booked_seats: 35,
    status: "active",
  },
];

const demoBuses = [
  {
    id: 1,
    plate_number: "43A-12345",
    seat_count: 40,
    status: "active",
  },
  {
    id: 2,
    plate_number: "43B-67890",
    seat_count: 34,
    status: "maintenance",
  },
];

const demoPayments = [
  {
    id: 1,
    amount: 450000,
    status: "paid",
  },
  {
    id: 2,
    amount: 320000,
    status: "pending",
  },
  {
    id: 3,
    amount: 520000,
    status: "paid",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState(demoBookings);
  const [trips, setTrips] = useState(demoTrips);
  const [buses, setBuses] = useState(demoBuses);
  const [payments, setPayments] = useState(demoPayments);

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const fetchData = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const [bookingRes, tripRes, busRes, paymentRes] = await Promise.allSettled([
        apiGet("bookings"),
        apiGet("trips"),
        apiGet("buses"),
        apiGet("payments"),
      ]);

      if (bookingRes.status === "fulfilled") {
        setBookings(toArray(bookingRes.value));
      }

      if (tripRes.status === "fulfilled") {
        setTrips(toArray(tripRes.value));
      }

      if (busRes.status === "fulfilled") {
        setBuses(toArray(busRes.value));
      }

      if (paymentRes.status === "fulfilled") {
        setPayments(toArray(paymentRes.value));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.log("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (number) => {
    return new Intl.NumberFormat("vi-VN").format(Number(number || 0));
  };

  const formatDateTime = (value) => {
    if (!value) return "Chưa có";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Không hợp lệ";

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getBookingTotal = (booking) => {
    return Number(
      booking.total ||
        booking.total_amount ||
        booking.amount ||
        booking.price ||
        0
    );
  };

  const revenue = payments
    .filter((payment) => {
      return (
        payment.status === "paid" ||
        payment.status === "completed" ||
        payment.payment_status === "paid"
      );
    })
    .reduce((sum, payment) => {
      return sum + Number(payment.amount || payment.total || 0);
    }, 0);

  const bookingRevenue = bookings.reduce((sum, booking) => {
    return sum + getBookingTotal(booking);
  }, 0);

  const totalRevenue = revenue || bookingRevenue;

  const totalBookings = bookings.length;
  const totalTrips = trips.length;
  const totalBuses = buses.length;

  const pendingBookings = bookings.filter((booking) => {
    return booking.status === "pending" || booking.payment_status === "unpaid";
  }).length;

  const confirmedBookings = bookings.filter((booking) => {
    return booking.status === "confirmed" || booking.status === "paid";
  }).length;

  const cancelledBookings = bookings.filter((booking) => {
    return booking.status === "cancelled";
  }).length;

  const paidPayments = payments.filter((payment) => {
    return payment.status === "paid" || payment.status === "completed";
  }).length;

  const pendingPayments = payments.filter((payment) => {
    return payment.status === "pending" || payment.status === "unpaid";
  }).length;

  const activeBuses = buses.filter((bus) => bus.status === "active").length;
  const maintenanceBuses = buses.filter(
    (bus) => bus.status === "maintenance"
  ).length;

  const todayTrips = trips.filter((trip) => {
    const value = trip.departure_time || trip.start_time || trip.date;

    if (!value) return false;

    const tripDate = new Date(value);
    const today = new Date();

    return (
      tripDate.getDate() === today.getDate() &&
      tripDate.getMonth() === today.getMonth() &&
      tripDate.getFullYear() === today.getFullYear()
    );
  });

  const upcomingTrips = trips
    .filter((trip) => {
      const value = trip.departure_time || trip.start_time;

      if (!value) return false;

      const tripDate = new Date(value);

      return tripDate.getTime() >= new Date().getTime();
    })
    .sort((a, b) => {
      const dateA = new Date(a.departure_time || a.start_time || 0);
      const dateB = new Date(b.departure_time || b.start_time || 0);

      return dateA - dateB;
    });

  const fullTrips = trips.filter((trip) => {
    const totalSeats = Number(trip.total_seats || trip.seat_count || 0);
    const bookedSeats = Number(trip.booked_seats || trip.booked_count || 0);

    if (!totalSeats) return false;

    return bookedSeats >= totalSeats;
  });

  const nearlyFullTrips = trips.filter((trip) => {
    const totalSeats = Number(trip.total_seats || trip.seat_count || 0);
    const bookedSeats = Number(trip.booked_seats || trip.booked_count || 0);

    if (!totalSeats) return false;

    const percent = (bookedSeats / totalSeats) * 100;

    return percent >= 80 && bookedSeats < totalSeats;
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-top">
        <div>
          <h2>Tổng quan</h2>

          <p>Xin chào, đây là bảng tổng hợp tình hình đặt vé và vận hành xe.</p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={fetchData}
            className="reload-btn"
            disabled={loading}
          >
            {loading ? "Đang tải..." : "⟳ Tải lại"}
          </button>

          <NotificationBell />
        </div>
      </div>

      <div className="welcome-banner">
        <div className="welcome-left">
          <div className="circle-progress">
            <span />
          </div>

          <div>
            <h3>Chào bạn, hãy bắt đầu quản lý nhà xe hiệu quả hơn</h3>

            <p>
              Theo dõi đặt vé, chuyến xe, thanh toán, phương tiện và cảnh báo
              vận hành ngay trên một màn hình.
            </p>

            <div className="welcome-actions">
              <button type="button" onClick={() => navigate("/bookings")}>
                Quản lý đặt vé
              </button>

              <button
                type="button"
                className="secondary"
                onClick={fetchData}
                disabled={loading}
              >
                {loading ? "Đang cập nhật..." : "Cập nhật dữ liệu"}
              </button>
            </div>
          </div>
        </div>

        <div className="welcome-illustration">
          <div className="shape shape-one" />
          <div className="shape shape-two" />
          <div className="shape shape-three" />
        </div>
      </div>

      <div className="summary-grid">
        <div
          className="summary-card blue"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/bookings")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/bookings");
          }}
        >
          <p>Doanh thu vé</p>
          <h3>{formatMoney(totalRevenue)} đ</h3>
          <span>Tổng tiền từ đặt vé / thanh toán</span>
        </div>

        <div
          className="summary-card red"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/bookings")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/bookings");
          }}
        >
          <p>Đặt vé chờ xử lý</p>
          <h3>{pendingBookings}</h3>
          <span>Số đơn đặt vé chưa xác nhận</span>
        </div>

        <div
          className="summary-card green"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/trips")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/trips");
          }}
        >
          <p>Chuyến xe</p>
          <h3>{totalTrips}</h3>
          <span>Tổng số chuyến đang quản lý</span>
        </div>

        <div
          className="summary-card purple"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/buses")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/buses");
          }}
        >
          <p>Phương tiện</p>
          <h3>{totalBuses}</h3>
          <span>Tổng số xe trong hệ thống</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <Panel
          title="Chuyến xe hôm nay"
          onReload={fetchData}
          onView={() => navigate("/trips")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Mã chuyến</th>
                <th>Tuyến đường</th>
                <th>Khởi hành</th>
              </tr>
            </thead>

            <tbody>
              {todayTrips.length > 0 ? (
                todayTrips.slice(0, 5).map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.trip_code || trip.code || `CX${trip.id}`}</td>
                    <td>{trip.route_name || trip.route || "Chưa có tuyến"}</td>
                    <td>
                      {formatDateTime(trip.departure_time || trip.start_time)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Không có chuyến xe hôm nay" />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Chuyến xe sắp khởi hành"
          onReload={fetchData}
          onView={() => navigate("/trips")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Mã chuyến</th>
                <th>Tuyến đường</th>
                <th>Thời gian</th>
              </tr>
            </thead>

            <tbody>
              {upcomingTrips.length > 0 ? (
                upcomingTrips.slice(0, 5).map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.trip_code || trip.code || `CX${trip.id}`}</td>
                    <td>{trip.route_name || trip.route || "Chưa có tuyến"}</td>
                    <td>
                      {formatDateTime(trip.departure_time || trip.start_time)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Chưa có chuyến sắp khởi hành" />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Chuyến gần hết ghế"
          onReload={fetchData}
          onView={() => navigate("/trips")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Mã chuyến</th>
                <th>Đã đặt</th>
                <th>Tổng ghế</th>
              </tr>
            </thead>

            <tbody>
              {nearlyFullTrips.length > 0 ? (
                nearlyFullTrips.slice(0, 5).map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.trip_code || trip.code || `CX${trip.id}`}</td>
                    <td>{trip.booked_seats || trip.booked_count || 0}</td>
                    <td>{trip.total_seats || trip.seat_count || 0}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Không có chuyến gần hết ghế" />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Chuyến đã hết ghế"
          onReload={fetchData}
          onView={() => navigate("/trips")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Mã chuyến</th>
                <th>Tuyến đường</th>
                <th>Số ghế</th>
              </tr>
            </thead>

            <tbody>
              {fullTrips.length > 0 ? (
                fullTrips.slice(0, 5).map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.trip_code || trip.code || `CX${trip.id}`}</td>
                    <td>{trip.route_name || trip.route || "Chưa có tuyến"}</td>
                    <td>
                      {trip.booked_seats || trip.booked_count || 0}/
                      {trip.total_seats || trip.seat_count || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Không có chuyến đã hết ghế" />
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="bottom-grid">
        <StatusBox
          title="Tình trạng đặt vé"
          onClick={() => navigate("/bookings")}
          values={[
            {
              label: "Chờ xử lý",
              value: pendingBookings,
              color: "#ff9800",
            },
            {
              label: "Đã xác nhận",
              value: confirmedBookings,
              color: "#52c41a",
            },
            {
              label: "Đã hủy",
              value: cancelledBookings,
              color: "#dc2626",
            },
            {
              label: "Tổng đặt vé",
              value: totalBookings,
              color: "#111827",
            },
          ]}
        />

        <StatusBox
          title="Tình trạng phương tiện"
          onClick={() => navigate("/buses")}
          values={[
            {
              label: "Đang hoạt động",
              value: activeBuses,
              color: "#52c41a",
            },
            {
              label: "Bảo trì",
              value: maintenanceBuses,
              color: "#ff9800",
            },
            {
              label: "Tổng xe",
              value: totalBuses,
              color: "#5b6cff",
            },
          ]}
        />

        <div className="money-box">
          <h3>Thanh toán</h3>

          <div
            className="money-row"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/payments")}
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate("/payments");
            }}
          >
            <span>Đã thanh toán</span>
            <b className="green-text">{paidPayments}</b>
          </div>

          <div
            className="money-row"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/payments")}
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate("/payments");
            }}
          >
            <span>Chờ thanh toán</span>
            <b className="red-text">{pendingPayments}</b>
          </div>

          <div className="money-row total">
            <span>Doanh thu vé</span>
            <b>{formatMoney(totalRevenue)} đ</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  onReload,
  onView,
  lastUpdated,
  loading,
}) {
  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h3>{title}</h3>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          title="Tải lại dữ liệu"
        >
          {loading ? "..." : "⟳"}
        </button>
      </div>

      {children}

      <div className="panel-footer">
        Số liệu tính đến:{" "}
        {lastUpdated.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}

        <button type="button" onClick={onView}>
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-cell">
        {text}
      </td>
    </tr>
  );
}

function StatusBox({ title, values, onClick }) {
  const total = values.reduce((sum, item) => {
    return sum + Number(item.value || 0);
  }, 0);

  return (
    <div className="status-box">
      <div className="status-header">
        <h3>{title}</h3>

        <button type="button" onClick={onClick}>
          Xem chi tiết ➜
        </button>
      </div>

      <div className="status-values">
        {values.map((item) => (
          <div key={`${title}-${item.label}`}>
            <b style={{ color: item.color }}>{item.value}</b>

            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="status-bars">
        {values.map((item) => (
          <span
            key={`${title}-bar-${item.label}`}
            style={{
              background: item.color,
              flex:
                total === 0
                  ? 1
                  : Math.max(Number(item.value || 0), 0.3),
            }}
          />
        ))}
      </div>
    </div>
  );
}