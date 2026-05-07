import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

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
    const { data } = await supabase
      .from("cashbook")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: o } = await supabase.from("orders").select("*");
    const { data: e } = await supabase.from("expenses").select("*");

    setData(data || []);
    setOrders(o || []);
    setExpenses(e || []);
  };

  // ADD
  const add = async () => {
    if (!amount) return;

    await supabase.from("cashbook").insert([
      {
        id: crypto.randomUUID(),
        type: formType,
        amount: Number(amount),
        note,
      },
    ]);

    setAmount("");
    setNote("");
    load();
  };

  // DELETE
  const remove = async (id) => {
    await supabase.from("cashbook").delete().eq("id", id);
    load();
  };

  // FILTER DATE
  const filterByDate = (d) => {
    if (!filterDate) return true;
    return new Date(d.created_at).toDateString() === new Date(filterDate).toDateString();
  };

  const filtered = data
    .filter((d) => (type === "all" ? true : d.type === type))
    .filter(filterByDate);

  // TOTAL
  const totalThu = filtered
    .filter((d) => d.type === "thu")
    .reduce((s, i) => s + Number(i.amount), 0);

  const totalChi = filtered
    .filter((d) => d.type === "chi")
    .reduce((s, i) => s + Number(i.amount), 0);

  // PROFIT (orders - expenses)
  const totalRevenue = orders.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalExpense = expenses.reduce((s, i) => s + Number(i.amount || 0), 0);
  const profit = totalRevenue - totalExpense;

  // EXPORT CSV
  const exportExcel = () => {
    const rows = [
      ["Loại", "Số tiền", "Ghi chú", "Ngày"],
      ...data.map((i) => [
        i.type,
        i.amount,
        i.note,
        new Date(i.created_at).toLocaleString(),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "quy_tien.csv";
    a.click();
  };

  return (
    <div className="page">
      <h2>💰 Quỹ tiền</h2>

      {/* SUMMARY */}
      <div style={{ marginBottom: 15 }}>
        <b style={{ color: "green" }}>Thu: {totalThu.toLocaleString()} đ</b> |{" "}
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

        <input type="date" onChange={(e) => setFilterDate(e.target.value)} />

        <select onChange={(e) => setType(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="thu">Thu</option>
          <option value="chi">Chi</option>
        </select>

        <button onClick={exportExcel}>Export Excel</button>
      </div>

      {/* 📊 CHART */}
      

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
                {d.type}
              </td>
              <td>{Number(d.amount).toLocaleString()}</td>
              <td>{d.note}</td>
              <td>{new Date(d.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => remove(d.id)}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}