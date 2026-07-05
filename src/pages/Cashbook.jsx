import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiDelete } from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Cashbook() {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [type, setType] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [formType, setFormType] = useState("thu");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

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
      const cashbookData = await apiGet("cashbook");
      const ordersData = await apiGet("orders");
      const expensesData = await apiGet("expenses");

      const sortedCashbook = toArray(cashbookData).sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });

      setData(sortedCashbook);
      setOrders(toArray(ordersData));
      setExpenses(toArray(expensesData));
    } catch (error) {
      console.log("Lỗi tải dữ liệu quỹ tiền:", error);
      setData([]);
      setOrders([]);
      setExpenses([]);
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  const showDate = (item) => {
    const dateValue = item.created_at || item.createdAt || item.date;
    if (!dateValue) return "—";
    return new Date(dateValue).toLocaleString("vi-VN");
  };

  const filterByDate = (item) => {
    if (!filterDate) return true;

    const dateValue = item.created_at || item.createdAt || item.date;
    if (!dateValue) return false;

    return (
      new Date(dateValue).toDateString() ===
      new Date(filterDate).toDateString()
    );
  };

  const filtered = data
    .filter((item) => (type === "all" ? true : item.type === type))
    .filter(filterByDate);

  const totalThu = filtered
    .filter((item) => item.type === "thu")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalChi = filtered
    .filter((item) => item.type === "chi")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = totalThu - totalChi;

  const totalRevenue = orders.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const profit = totalRevenue - totalExpense;

  const add = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        type: formType,
        amount: Number(amount),
        paymentMethod,
        note,
      };

      const res = await apiCreate("cashbook", payload);

      if (res?.data || res?.message) {
        alert("✅ Đã thêm dòng quỹ tiền");
        setAmount("");
        setNote("");
        setFormType("thu");
        setPaymentMethod("cash");
        load();
      } else {
        alert("❌ Lỗi thêm dữ liệu");
      }
    } catch (error) {
      console.log("Lỗi thêm quỹ tiền:", error);
      alert("❌ Lỗi thêm dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá dòng này?")) return;

    try {
      await apiDelete("cashbook", id);
      alert("✅ Đã xoá dòng quỹ tiền");
      load();
    } catch (error) {
      console.log("Lỗi xoá quỹ tiền:", error);
      alert("❌ Lỗi xoá dữ liệu");
    }
  };

  const exportExcel = () => {
    const rows = filtered.map((item) => ({
      Loại: item.type === "thu" ? "Thu" : "Chi",
      "Số tiền": Number(item.amount || 0),
      "Phương thức":
        item.payment_method === "bank" || item.paymentMethod === "bank"
          ? "Chuyển khoản"
          : "Tiền mặt",
      "Ghi chú": item.note || "",
      Ngày: showDate(item),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Quỹ tiền");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "quy-tien.xlsx");
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>💰 Quỹ tiền</h2>
          <p style={desc}>
            Theo dõi thu chi tiền mặt, chuyển khoản, dòng tiền từ bán hàng và chi phí.
          </p>
        </div>

        <button onClick={load} style={btn}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={cardGrid}>
        <div style={card("#e8f5e9", "#16a34a")}>
          <p>Tổng thu</p>
          <h3 style={{ color: "#15803d" }}>{money(totalThu)}</h3>
          <span>Theo bộ lọc hiện tại</span>
        </div>

        <div style={card("#ffebee", "#ef4444")}>
          <p>Tổng chi</p>
          <h3 style={{ color: "#dc2626" }}>{money(totalChi)}</h3>
          <span>Theo bộ lọc hiện tại</span>
        </div>

        <div style={card("#e3f2fd", "#2196f3")}>
          <p>Còn lại</p>
          <h3 style={{ color: balance >= 0 ? "#15803d" : "#dc2626" }}>
            {money(balance)}
          </h3>
          <span>Thu - chi</span>
        </div>

        <div style={card("#fff3e0", "#ff9800")}>
          <p>Lợi nhuận tạm tính</p>
          <h3 style={{ color: profit >= 0 ? "#15803d" : "#dc2626" }}>
            {money(profit)}
          </h3>
          <span>Doanh thu - chi phí</span>
        </div>
      </div>

      <div style={infoGrid}>
        <div style={infoBox}>
          <b>📊 Doanh thu đơn hàng</b>
          <h3>{money(totalRevenue)}</h3>
        </div>

        <div style={infoBox}>
          <b>💸 Chi phí phát sinh</b>
          <h3>{money(totalExpense)}</h3>
        </div>

        <div style={infoBox}>
          <b>📄 Số dòng quỹ tiền</b>
          <h3>{filtered.length}</h3>
        </div>
      </div>

      <div style={formBox}>
        <select
          value={formType}
          onChange={(e) => setFormType(e.target.value)}
          style={input}
        >
          <option value="thu">Thu</option>
          <option value="chi">Chi</option>
        </select>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={input}
        >
          <option value="cash">Tiền mặt</option>
          <option value="bank">Chuyển khoản</option>
        </select>

        <input
          type="number"
          placeholder="Số tiền..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={input}
        />

        <input
          placeholder="Ghi chú..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={noteInput}
        />

        <button onClick={add} disabled={loading} style={primaryBtn}>
          {loading ? "Đang thêm..." : "+ Thêm"}
        </button>
      </div>

      <div style={filterBox}>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={input}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={input}
        >
          <option value="all">Tất cả</option>
          <option value="thu">Thu</option>
          <option value="chi">Chi</option>
        </select>

        <button
          onClick={() => {
            setFilterDate("");
            setType("all");
          }}
          style={btn}
        >
          Xóa lọc
        </button>

        <button onClick={exportExcel} style={btn}>
          Xuất Excel
        </button>
      </div>

      <div style={section}>
        <div style={sectionHeader}>
          <h3>Danh sách thu chi</h3>
          <span style={badge}>{filtered.length} dòng</span>
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Loại</th>
              <th style={th}>Số tiền</th>
              <th style={th}>Phương thức</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Ngày</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={empty}>
                  Chưa có dữ liệu quỹ tiền
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => {
                const method = item.payment_method || item.paymentMethod;

                return (
                  <tr key={item.id}>
                    <td style={td}>{index + 1}</td>

                    <td style={td}>
                      <span
                        style={{
                          ...typeBadge,
                          background:
                            item.type === "thu" ? "#dcfce7" : "#fee2e2",
                          color: item.type === "thu" ? "#15803d" : "#dc2626",
                        }}
                      >
                        {item.type === "thu" ? "Thu" : "Chi"}
                      </span>
                    </td>

                    <td style={td}>
                      <b>{money(item.amount)}</b>
                    </td>

                    <td style={td}>
                      {method === "bank" ? "Chuyển khoản" : "Tiền mặt"}
                    </td>

                    <td style={td}>{item.note || "—"}</td>

                    <td style={td}>{showDate(item)}</td>

                    <td style={td}>
                      <button onClick={() => remove(item.id)} style={deleteBtn}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
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

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 14,
};

const card = (bg, borderColor) => ({
  background: bg,
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  borderLeft: `5px solid ${borderColor}`,
});

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const infoBox = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const formBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 12,
};

const filterBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const input = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 150,
};

const noteInput = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 260,
  flex: 1,
};

const btn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "9px 14px",
  border: "none",
  borderRadius: 8,
  background: "#2f43a3",
  color: "white",
  cursor: "pointer",
};

const section = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const badge = {
  background: "#eef2ff",
  color: "#2f43a3",
  padding: "5px 10px",
  borderRadius: 999,
  fontWeight: 600,
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

const empty = {
  padding: 30,
  textAlign: "center",
  color: "#6b7280",
};

const typeBadge = {
  padding: "5px 10px",
  borderRadius: 999,
  fontWeight: 700,
};

const deleteBtn = {
  padding: "6px 10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};