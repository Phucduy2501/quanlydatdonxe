import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function BookingList() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await apiGet("bookings");
      setBookings(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.log("Lỗi tải đặt vé:", error);
      setBookings([]);
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  return (
    <div className="page">
      <h2>📋 Danh sách đặt vé</h2>

      <div className="toolbar">
        <button onClick={loadBookings}>⟳ Tải lại</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Mã đặt vé</th>
            <th>Khách hàng</th>
            <th>SĐT</th>
            <th>Chuyến xe</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
          </tr>
        </thead>

        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                Chưa có dữ liệu đặt vé
              </td>
            </tr>
          ) : (
            bookings.map((b, index) => (
              <tr key={b.id}>
                <td>{index + 1}</td>
                <td>{b.booking_code || b.code || b.id}</td>
                <td>{b.customer_name || b.passenger_name || "—"}</td>
                <td>{b.phone || b.passenger_phone || "—"}</td>
                <td>{b.trip_name || b.trip_code || b.trip_id || "—"}</td>
                <td>{money(b.total_amount || b.total)}</td>
                <td>{b.status || "pending"}</td>
                <td>
                  {b.created_at
                    ? new Date(b.created_at).toLocaleString("vi-VN")
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