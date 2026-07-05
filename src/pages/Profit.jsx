import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function Profit() {
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cashbook, setCashbook] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    load();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const load = async () => {
    try {
      const ordersData = await apiGet("orders");
      const purchasesData = await apiGet("purchases");
      const expensesData = await apiGet("expenses");
      const cashbookData = await apiGet("cashbook");

      setOrders(toArray(ordersData));
      setPurchases(toArray(purchasesData));
      setExpenses(toArray(expensesData));
      setCashbook(toArray(cashbookData));
    } catch (error) {
      console.log("Lỗi tải dữ liệu lợi nhuận:", error);
      setOrders([]);
      setPurchases([]);
      setExpenses([]);
      setCashbook([]);
    }
  };

  const money = (n) => {
    return Number(n || 0).toLocaleString("vi-VN") + " đ";
  };

  const getDateValue = (item) => {
    return item.date || item.created_at || item.createdAt;
  };

  const filterByDate = (arr) => {
    if (!fromDate && !toDate) return arr;

    return arr.filter((item) => {
      const dateValue = getDateValue(item);
      if (!dateValue) return false;

      const d = new Date(dateValue);

      if (fromDate) {
        const from = new Date(fromDate);
        if (d < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }

      return true;
    });
  };

  const filteredOrders = filterByDate(orders);
  const filteredPurchases = filterByDate(purchases);
  const filteredExpenses = filterByDate(expenses);
  const filteredCashbook = filterByDate(cashbook);

  // Doanh thu từ đơn hàng
  const revenue = filteredOrders.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  // Tiền nhập hàng
  const purchaseCost = filteredPurchases.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  // Chi phí từ bảng expenses
  const expenseCost = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  // Chi từ quỹ tiền
  const cashbookChi = filteredCashbook
    .filter((item) => item.type === "chi")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Tổng chi phí
  const totalCost = purchaseCost + expenseCost + cashbookChi;

  // Lợi nhuận
  const profit = revenue - totalCost;

  // Tỷ lệ lợi nhuận
  const profitRate = revenue > 0 ? (profit / revenue) * 100 : 0;

  const paidOrders = filteredOrders.filter(
    (item) => item.payment_status === "paid"
  ).length;

  const debtOrders = filteredOrders.filter(
    (item) => item.payment_status === "debt" || Number(item.debt_amount || 0) > 0
  ).length;

  const totalDebt = filteredOrders.reduce(
    (sum, item) => sum + Number(item.debt_amount || 0),
    0
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>📊 Lợi nhuận</h2>
          <p style={desc}>
            Theo dõi doanh thu, nhập hàng, chi phí, công nợ và lợi nhuận.
          </p>
        </div>

        <button onClick={load} style={reloadBtn}>
          ⟳ Tải lại
        </button>
      </div>

      {/* FILTER */}
      <div style={filterBox}>
        <div>
          <label style={label}>Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={input}
          />
        </div>

        <div>
          <label style={label}>Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={input}
          />
        </div>

        <button
          onClick={() => {
            setFromDate("");
            setToDate("");
          }}
          style={clearBtn}
        >
          Xóa lọc
        </button>
      </div>

      {/* CARDS */}
      <div style={cardGrid}>
        <div style={card("#e3f2fd", "#2196f3")}>
          <p>Doanh thu</p>
          <h3>{money(revenue)}</h3>
          <span>Từ đơn hàng bán ra</span>
        </div>

        <div style={card("#fff3e0", "#ff9800")}>
          <p>Nhập hàng</p>
          <h3>{money(purchaseCost)}</h3>
          <span>Tổng tiền mua hàng</span>
        </div>

        <div style={card("#ffebee", "#f44336")}>
          <p>Chi phí</p>
          <h3>{money(expenseCost + cashbookChi)}</h3>
          <span>Chi phí + quỹ tiền loại chi</span>
        </div>

        <div
          style={card(
            profit >= 0 ? "#e8f5e9" : "#ffebee",
            profit >= 0 ? "#4caf50" : "#f44336"
          )}
        >
          <p>Lợi nhuận</p>
          <h3 style={{ color: profit >= 0 ? "green" : "red" }}>
            {money(profit)}
          </h3>
          <span>Doanh thu - nhập hàng - chi phí</span>
        </div>
      </div>

      {/* EXTRA CARDS */}
      <div style={smallGrid}>
        <div style={smallCard}>
          <p>Tổng đơn hàng</p>
          <h3>{filteredOrders.length}</h3>
        </div>

        <div style={smallCard}>
          <p>Đơn đã trả đủ</p>
          <h3>{paidOrders}</h3>
        </div>

        <div style={smallCard}>
          <p>Đơn còn nợ</p>
          <h3>{debtOrders}</h3>
        </div>

        <div style={smallCard}>
          <p>Tổng công nợ</p>
          <h3 style={{ color: totalDebt > 0 ? "red" : "green" }}>
            {money(totalDebt)}
          </h3>
        </div>
      </div>

      {/* PROGRESS */}
      <div style={section}>
        <div style={sectionHeader}>
          <h3>Tỷ lệ lợi nhuận</h3>
          <b style={{ color: profit >= 0 ? "green" : "red" }}>
            {profitRate.toFixed(2)}%
          </b>
        </div>

        <div style={progressBg}>
          <div
            style={{
              ...progressBar,
              width: `${Math.min(Math.abs(profitRate), 100)}%`,
              background: profit >= 0 ? "#16a34a" : "#dc2626",
            }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div style={section}>
        <h3>Chi tiết tổng hợp</h3>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Hạng mục</th>
              <th style={th}>Số tiền</th>
              <th style={th}>Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={td}>Doanh thu</td>
              <td style={td}>{money(revenue)}</td>
              <td style={td}>Tổng tiền từ đơn hàng bán ra</td>
            </tr>

            <tr>
              <td style={td}>Nhập hàng</td>
              <td style={td}>{money(purchaseCost)}</td>
              <td style={td}>Tổng tiền mua hàng / nhập kho</td>
            </tr>

            <tr>
              <td style={td}>Chi phí</td>
              <td style={td}>{money(expenseCost)}</td>
              <td style={td}>Chi phí quảng cáo, vận hành, phát sinh</td>
            </tr>

            <tr>
              <td style={td}>Quỹ tiền loại chi</td>
              <td style={td}>{money(cashbookChi)}</td>
              <td style={td}>Các khoản chi trong quỹ tiền</td>
            </tr>

            <tr style={{ fontWeight: "bold", background: "#f0fdf4" }}>
              <td style={td}>Lợi nhuận cuối</td>
              <td style={td}>{money(profit)}</td>
              <td style={td}>Doanh thu - tổng chi</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* STYLE */
const page = {
  padding: 24,
  background: "#f4f7fb",
  minHeight: "100vh",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const desc = {
  margin: "6px 0 0",
  color: "#6b7280",
};

const reloadBtn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

const filterBox = {
  display: "flex",
  gap: 12,
  alignItems: "end",
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const label = {
  display: "block",
  fontWeight: 700,
  marginBottom: 6,
};

const input = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
};

const clearBtn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#f9fafb",
  cursor: "pointer",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 15,
  marginBottom: 18,
};

const card = (bg, borderColor) => ({
  background: bg,
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  borderLeft: `5px solid ${borderColor}`,
});

const smallGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const smallCard = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const section = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const progressBg = {
  height: 20,
  background: "#e5e7eb",
  borderRadius: 999,
  overflow: "hidden",
};

const progressBar = {
  height: "100%",
  borderRadius: 999,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  background: "#2f43a3",
  color: "white",
  padding: 10,
  textAlign: "left",
};

const td = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
};