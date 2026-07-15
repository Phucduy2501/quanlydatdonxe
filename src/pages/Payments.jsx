import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await apiGet("payments");
      setPayments(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.log("Lỗi tải thanh toán:", error);
      setPayments([]);
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  return (
    <div className="page">
      <h2>💳 Thanh toán</h2>

      <div className="toolbar">
        <button onClick={loadPayments}>⟳ Tải lại</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Mã thanh toán</th>
            <th>Mã đặt vé</th>
            <th>Khách hàng</th>
            <th>Số tiền</th>
            <th>Phương thức</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
          </tr>
        </thead>

        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                Chưa có dữ liệu thanh toán
              </td>
            </tr>
          ) : (
            payments.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>
                <td>{p.payment_code || p.code || p.id}</td>
                <td>{p.booking_code || p.booking_id || "—"}</td>
                <td>{p.customer_name || p.passenger_name || "—"}</td>
                <td>{money(p.amount)}</td>
                <td>{p.payment_method || p.method || "Tiền mặt"}</td>
                <td>{p.status || "paid"}</td>
                <td>
                  {p.created_at
                    ? new Date(p.created_at).toLocaleString("vi-VN")
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