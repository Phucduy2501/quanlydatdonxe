import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../services/api";
import "./user.css";

export default function UserTicketLookup() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [tickets, setTickets] = useState([]);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert("Nhập mã vé, tên hoặc số điện thoại");
      return;
    }

    try {
      const res = await apiGet("tickets");
      const allTickets = toArray(res);

      const result = allTickets.filter((ticket) => {
        const text = [
          ticket.ticket_code,
          ticket.passenger_name,
          ticket.passenger_phone,
          ticket.seat_number,
          ticket.trip_code,
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(keyword.toLowerCase());
      });

      setTickets(result);
    } catch (error) {
      alert(error.message || "Lỗi tra cứu vé");
    }
  };

  return (
    <div className="user-web">
      <header className="user-navbar">
        <div className="user-brand" onClick={() => navigate("/user")}>
          <div className="brand-icon">🚌</div>
          <div>
            <h2>TransitGo</h2>
            <span>Tra cứu vé</span>
          </div>
        </div>

        <nav>
          <button onClick={() => navigate("/user")}>Trang chủ</button>
          <button onClick={() => navigate("/user/search")}>Tìm chuyến</button>
          <button onClick={() => navigate("/user/login")}>Đăng nhập</button>
        </nav>
      </header>

      <section className="user-search-section">
        <h1>Tra cứu vé</h1>
        <p>Nhập mã vé, tên hành khách hoặc số điện thoại để kiểm tra vé.</p>

        <div className="ticket-lookup-form">
          <input
            placeholder="VD: TK001 hoặc 090..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <button onClick={handleSearch}>Tra cứu</button>
        </div>
      </section>

      <section className="ticket-result-section">
        {tickets.length === 0 ? (
          <div className="user-empty">Chưa có kết quả tra cứu</div>
        ) : (
          tickets.map((ticket) => (
            <div className="user-ticket-card" key={ticket.id}>
              <h3>🎫 {ticket.ticket_code || `VE${ticket.id}`}</h3>

              <p>Hành khách: {ticket.passenger_name || "Chưa có"}</p>
              <p>Số điện thoại: {ticket.passenger_phone || "Chưa có"}</p>
              <p>Ghế: {ticket.seat_number || "Chưa có"}</p>
              <p>
                Trạng thái:{" "}
                {ticket.status || ticket.ticket_status || "Đang hiệu lực"}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}