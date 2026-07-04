import { useEffect, useState } from "react";
import { apiGet } from "../services/api";
import NotificationBell from "../components/NotificationBell";
import "./dashboard.css";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cashbook, setCashbook] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ordersData = await apiGet("orders");
      const productsData = await apiGet("products");
      const expensesData = await apiGet("expenses");
      const cashbookData = await apiGet("cashbook");

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setCashbook(Array.isArray(cashbookData) ? cashbookData : []);
    } catch (error) {
      console.log("Lỗi lấy dữ liệu Dashboard:", error);
    }
  };

  const formatMoney = (num) =>
    new Intl.NumberFormat("vi-VN").format(Number(num || 0));

  const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const cost = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const profit = revenue - cost;
  const stock = products.reduce((s, p) => s + Number(p.stock || 0), 0);

  const lowStockProducts = products.filter(
    (p) => Number(p.stock || 0) <= Number(p.minStock || 10)
  );

  const overStockProducts = products.filter(
    (p) => Number(p.stock || 0) >= Number(p.maxStock || 500)
  );

  const almostExpiredProducts = products.filter((p) => {
    if (!p.expiryDate) return false;

    const now = new Date();
    const expiry = new Date(p.expiryDate);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    return diffDays > 0 && diffDays <= 30;
  });

  const expiredProducts = products.filter((p) => {
    if (!p.expiryDate) return false;
    return new Date(p.expiryDate) < new Date();
  });

  const totalThu = cashbook
    .filter((i) => i.type === "thu")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const totalChi = cashbook
    .filter((i) => i.type === "chi")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-top">
        <div>
          <h2>Tổng quan</h2>
          <p>Xin chào, đây là bảng tổng hợp tình hình kho hàng và bán hàng.</p>
        </div>

        <NotificationBell />
      </div>

      <div className="welcome-banner">
        <div className="welcome-left">
          <div className="circle-progress">
            <span></span>
          </div>

          <div>
            <h3>Chào bạn, hãy bắt đầu quản lý cửa hàng hiệu quả hơn</h3>
            <p>
              Theo dõi tồn kho, doanh thu, chi phí, đơn hàng và cảnh báo hàng hóa
              ngay trên một màn hình.
            </p>

            <div className="welcome-actions">
              <button>Bắt đầu sử dụng</button>
              <button className="secondary">Đã biết sử dụng</button>
            </div>
          </div>
        </div>

        <div className="welcome-illustration">
          <div className="shape shape-one"></div>
          <div className="shape shape-two"></div>
          <div className="shape shape-three"></div>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card blue">
          <p>Doanh thu</p>
          <h3>{formatMoney(revenue)} đ</h3>
          <span>Tổng doanh thu đơn hàng</span>
        </div>

        <div className="summary-card red">
          <p>Chi phí</p>
          <h3>{formatMoney(cost)} đ</h3>
          <span>Tổng chi phí phát sinh</span>
        </div>

        <div className="summary-card green">
          <p>Lợi nhuận</p>
          <h3>{formatMoney(profit)} đ</h3>
          <span>Doanh thu trừ chi phí</span>
        </div>

        <div className="summary-card purple">
          <p>Tồn kho</p>
          <h3>{stock}</h3>
          <span>Tổng số lượng hàng tồn</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <Panel title="Tồn kho dưới mức tối thiểu">
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>SL tồn</th>
                <th>SL tối thiểu</th>
              </tr>
            </thead>

            <tbody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.stock || 0}</td>
                    <td>{p.minStock || 10}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Không có hàng dưới mức tối thiểu" />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Tồn kho vượt mức tối đa">
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>SL tồn</th>
                <th>SL tối đa</th>
              </tr>
            </thead>

            <tbody>
              {overStockProducts.length > 0 ? (
                overStockProducts.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.stock || 0}</td>
                    <td>{p.maxStock || 500}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Không có hàng vượt mức tối đa" />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Hàng hóa sắp hết hạn trong 30 ngày">
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>Hạn sử dụng</th>
                <th>Số lượng</th>
              </tr>
            </thead>

            <tbody>
              {almostExpiredProducts.length > 0 ? (
                almostExpiredProducts.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.expiryDate}</td>
                    <td>{p.stock || 0}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Không có hàng sắp hết hạn" />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel title="Hàng hóa quá hạn sử dụng">
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>Hạn sử dụng</th>
                <th>Số lượng</th>
              </tr>
            </thead>

            <tbody>
              {expiredProducts.length > 0 ? (
                expiredProducts.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.expiryDate}</td>
                    <td>{p.stock || 0}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={3} text="Không có hàng quá hạn" />
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="bottom-grid">
        <StatusBox
          title="Lệnh xuất kho"
          total={orders.length}
          values={[
            { label: "Quá hạn", value: 2, color: "#ff9800" },
            { label: "Chưa thực hiện", value: 0, color: "#52c41a" },
            { label: "Đang thực hiện", value: 0, color: "#5b6cff" },
            { label: "TT khác", value: orders.length, color: "#111827" },
          ]}
        />

        <StatusBox
          title="Lệnh nhập kho"
          total={products.length}
          values={[
            { label: "Quá hạn", value: 5, color: "#ff9800" },
            { label: "Chờ nhận hàng", value: 4, color: "#52c41a" },
            { label: "Chờ kiểm đếm", value: 14, color: "#5b6cff" },
            { label: "TT khác", value: 17, color: "#111827" },
          ]}
        />

        <div className="money-box">
          <h3>Quỹ tiền</h3>

          <div className="money-row">
            <span>Tổng thu</span>
            <b className="green-text">{formatMoney(totalThu)} đ</b>
          </div>

          <div className="money-row">
            <span>Tổng chi</span>
            <b className="red-text">{formatMoney(totalChi)} đ</b>
          </div>

          <div className="money-row total">
            <span>Còn lại</span>
            <b>{formatMoney(totalThu - totalChi)} đ</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h3>{title}</h3>
        <button>⟳</button>
      </div>

      {children}

      <div className="panel-footer">
        Số liệu tính đến: 08:00 <span>Tải lại</span>
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

function StatusBox({ title, values }) {
  return (
    <div className="status-box">
      <div className="status-header">
        <h3>{title}</h3>
        <button>Cần thực hiện ➜</button>
      </div>

      <div className="status-values">
        {values.map((item, index) => (
          <div key={index}>
            <b style={{ color: item.color }}>{item.value}</b>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="status-bars">
        {values.map((item, index) => (
          <span
            key={index}
            style={{
              background: item.color,
              flex: Math.max(item.value, 1),
            }}
          ></span>
        ))}
      </div>
    </div>
  );
}