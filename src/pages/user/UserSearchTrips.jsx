import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../services/api";
import "./user.css";

export default function UserSearchTrips() {
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState({
    from: "",
    to: "",
    date: "",
  });

  useEffect(() => {
    loadTrips();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadTrips = async () => {
    try {
      const res = await apiGet("trips");
      setTrips(toArray(res));
    } catch (error) {
      console.log("Lỗi tải chuyến xe:", error);
      setTrips([]);
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
  };

  const formatDate = (value) => {
    if (!value) return "Chưa có thời gian";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("vi-VN");
  };

  const filteredTrips = trips.filter((trip) => {
    const text = [
      trip.trip_code,
      trip.code,
      trip.route_name,
      trip.name,
      trip.start_point,
      trip.end_point,
      trip.departure_time,
      trip.start_time,
    ]
      .join(" ")
      .toLowerCase();

    const matchFrom = search.from
      ? text.includes(search.from.toLowerCase())
      : true;

    const matchTo = search.to
      ? text.includes(search.to.toLowerCase())
      : true;

    const matchDate = search.date
      ? String(trip.departure_time || trip.start_time || "").includes(
          search.date
        )
      : true;

    return matchFrom && matchTo && matchDate;
  });

  return (
    <div className="user-web">
      <header className="user-navbar">
        <div className="user-brand" onClick={() => navigate("/user")}>
          <div className="brand-icon">🚌</div>
          <div>
            <h2>TransitGo</h2>
            <span>Tìm chuyến xe</span>
          </div>
        </div>

        <nav>
          <button onClick={() => navigate("/user")}>Trang chủ</button>
          <button onClick={() => navigate("/user/my-ticket")}>Tra cứu vé</button>
          <button onClick={() => navigate("/user/login")}>Đăng nhập</button>
        </nav>
      </header>

      <section className="user-search-section">
        <h1>Tìm chuyến xe</h1>
        <p>Nhập điểm đi, điểm đến và ngày khởi hành để tìm chuyến phù hợp.</p>

        <div className="search-form">
          <input
            placeholder="Điểm đi"
            value={search.from}
            onChange={(e) => setSearch({ ...search, from: e.target.value })}
          />

          <input
            placeholder="Điểm đến"
            value={search.to}
            onChange={(e) => setSearch({ ...search, to: e.target.value })}
          />

          <input
            type="date"
            value={search.date}
            onChange={(e) => setSearch({ ...search, date: e.target.value })}
          />

          <button onClick={loadTrips}>Tìm kiếm</button>
        </div>
      </section>

      <section className="trip-result-section">
        {filteredTrips.length === 0 ? (
          <div className="user-empty">Chưa có chuyến xe phù hợp</div>
        ) : (
          filteredTrips.map((trip) => (
            <div className="user-trip-card" key={trip.id}>
              <div>
                <h3>{trip.route_name || trip.name || "Chuyến xe"}</h3>
                <p>
                  Mã chuyến:{" "}
                  <b>{trip.trip_code || trip.code || `CX${trip.id}`}</b>
                </p>
                <p>
                  Khởi hành:{" "}
                  {formatDate(trip.departure_time || trip.start_time)}
                </p>
              </div>

              <div>
                <span className="trip-price">{formatMoney(trip.price)}</span>
                <p>
                  Ghế: {trip.booked_seats || 0}/
                  {trip.total_seats || trip.seat_count || 0}
                </p>
              </div>

              <button onClick={() => navigate(`/user/booking/${trip.id}`)}>
                Đặt vé
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}