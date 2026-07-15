import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await apiGet("tickets");
      setTickets(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.log("Lỗi tải vé xe:", error);
      setTickets([]);
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  return (
    <div className="page">
      <h2>🎫 Vé xe</h2>

      <div className="toolbar">
        <button onClick={loadTickets}>⟳ Tải lại</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Mã vé</th>
            <th>Khách hàng</th>
            <th>Ghế</th>
            <th>Chuyến xe</th>
            <th>Giá vé</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
          </tr>
        </thead>

        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                Chưa có dữ liệu vé xe
              </td>
            </tr>
          ) : (
            tickets.map((t, index) => (
              <tr key={t.id}>
                <td>{index + 1}</td>
                <td>{t.ticket_code || t.code || t.id}</td>
                <td>{t.customer_name || t.passenger_name || "—"}</td>
                <td>{t.seat_number || t.seat || "—"}</td>
                <td>{t.trip_name || t.trip_code || t.trip_id || "—"}</td>
                <td>{money(t.price || t.amount)}</td>
                <td>{t.status || "active"}</td>
                <td>
                  {t.created_at
                    ? new Date(t.created_at).toLocaleString("vi-VN")
                    : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}