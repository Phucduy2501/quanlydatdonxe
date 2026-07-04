import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiDelete } from "../services/api";

export default function Cashbook() {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [type, setType] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [formType, setFormType] = useState("thu");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const cashbookData = await apiGet("cashbook");
      const ordersData = await apiGet("orders");
      const expensesData = await apiGet("expenses");

      const sortedCashbook = Array.isArray(cashbookData)
        ? [...cashbookData].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB - dateA;
          })
        : [];

      setData(sortedCashbook);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.log("Lỗi tải dữ liệu quỹ tiền:", error);
      setData([]);
      setOrders([]);
      setExpenses([]);
    }
  };

  // ADD
  const add = async () => {
    if (!amount) {
      alert("Vui lòng nhập số tiền");
      return;
    }

    try {
      await apiCreate("cashbook", {
        type: formType,
        amount: Number(amount),
        note,
      });

      setAmount("");
      setNote("");

      load();
    } catch (error) {
      console.log("Lỗi thêm quỹ tiền:", error);
      alert("❌ Lỗi thêm dữ liệu");
    }
  };

  // DELETE
  const remove = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá dòng này?")) return;

    try {
      await apiDelete("cashbook", id);
      load();
    } catch (error) {
      console.log("Lỗi xoá quỹ tiền:", error);
      alert("❌ Lỗi xoá dữ liệu");
    }
  };

  // FILTER DATE
  const filterByDate = (d) => {
    if (!filterDate) return true;

    const dateValue = d.createdAt || d.created_at || d.date;

    if (!dateValue) return false;

    return (
      new Date(dateValue).toDateString() ===
      new Date(filterDate).toDateString()
    );
  };

  const filtered = data
    .filter((d) => (type === "all" ? true : d.type === type))
    .filter(filterByDate);

  // TOTAL
  const totalThu = filtered
    .filter((d) => d.type === "thu")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const totalChi = filtered
    .filter((d) => d.type === "chi")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  // PROFIT
  const totalRevenue = orders.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalExpense = expenses.reduce((s, i) => s + Number(i.amount || 0), 0);
  const profit = totalRevenue - totalExpense;

  // FORMAT DATE
  const showDate = (item) => {
    const dateValue = item.createdAt || item.created_at || item.date;

    if (!dateValue) return "";

    return new Date(dateValue).toLocaleString("vi-VN");
  };

  // EXPORT CSV
  const exportExcel = () => {
    const rows = [
      ["Loại", "Số tiền", "Ghi chú", "Ngày"],
      ...data.map((i) => [
        i.type,
        i.amount,
        i.note || "",
        showDate(i),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "quy_tien.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <h2>💰 Quỹ tiền</h2>

      {/* SUMMARY */}
      <div style={{ marginBottom: 15 }}>
        <b style={{ color: "green" }}>Thu: {totalThu.toLocaleString()} đ</b>{" "}
        |{" "}
        <b style={{ color: "red" }}>Chi: {totalChi.toLocaleString()} đ</b>
      </div>

      {/* PROFIT */}
      <div style={{ marginBottom: 15 }}>
        <b>📊 Doanh thu: {totalRevenue.toLocaleString()} đ</b> |{" "}
        <b>💸 Chi phí: {totalExpense.toLocaleString()} đ</b> |{" "}
        <b style={{ color: profit >= 0 ? "green" : "red" }}>
          Lãi: {profit.toLocaleString()} đ
        </b>
      </div>

      {/* FORM */}
      <div className="toolbar">
        <select value={formType} onChange={(e) => setFormType(e.target.value)}>
          <option value="thu">Thu</option>
          <option value="chi">Chi</option>
        </select>

        <input
          placeholder="Số tiền..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          placeholder="Ghi chú..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button onClick={add}>+ Thêm</button>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="thu">Thu</option>
          <option value="chi">Chi</option>
        </select>

        <button onClick={exportExcel}>Export Excel</button>
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Loại</th>
            <th>Số tiền</th>
            <th>Ghi chú</th>
            <th>Ngày</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((d, index) => (
            <tr key={d.id}>
              <td>{index + 1}</td>

              <td style={{ color: d.type === "thu" ? "green" : "red" }}>
                {d.type === "thu" ? "Thu" : "Chi"}
              </td>

              <td>{Number(d.amount || 0).toLocaleString()} đ</td>

              <td>{d.note}</td>

              <td>{showDate(d)}</td>

              <td>
                <button onClick={() => remove(d.id)}>X</button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                Chưa có dữ liệu quỹ tiền
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}