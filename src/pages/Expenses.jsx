import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function Expenses() {
  const [data, setData] = useState([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    setData(data || []);
  };

  // ✅ THÊM
  const add = async () => {
    if (!amount) return;

    await supabase.from("expenses").insert([
      {
        id: crypto.randomUUID(),
        amount: Number(amount),
        note,
        category,
      },
    ]);

    setAmount("");
    setNote("");
    setCategory("");
    load();
  };

  // ✅ XÓA
  const del = async (id) => {
    await supabase.from("expenses").delete().eq("id", id);
    load();
  };

  // ✅ FILTER
  const filtered = data.filter((i) =>
    (i.note || "").toLowerCase().includes(search.toLowerCase())
  );

  // ✅ TỔNG HÔM NAY
  const today = new Date().toDateString();
  const totalToday = data
    .filter((i) => new Date(i.created_at).toDateString() === today)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // ✅ TỔNG THÁNG
  const now = new Date();
  const totalMonth = data
    .filter((i) => {
      const d = new Date(i.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // ✅ GROUP CATEGORY
  const categoryMap = {};
  data.forEach((i) => {
    if (!i.category) return;
    categoryMap[i.category] = (categoryMap[i.category] || 0) + Number(i.amount);
  });

  const chartData = Object.keys(categoryMap).map((k) => ({
    category: k,
    amount: categoryMap[k],
  }));

  // ✅ EXPORT CSV
  const exportExcel = () => {
    const rows = [
      ["Số tiền", "Ghi chú", "Danh mục", "Ngày"],
      ...data.map((i) => [
        i.amount,
        i.note,
        i.category,
        new Date(i.created_at).toLocaleString(),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "chi_phi.csv";
    a.click();
  };

  return (
    <div className="page">
      <h2>💸 Chi phí</h2>

      {/* SUMMARY */}
      <div className="summary">
        <div>Hôm nay: {totalToday.toLocaleString()} đ</div>
        <div>Tháng: {totalMonth.toLocaleString()} đ</div>
      </div>

      {/* FORM */}
      <div className="toolbar">
        <input
          placeholder="Số tiền"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          placeholder="Ghi chú"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Chọn loại</option>
          <option value="Ăn uống">Ăn uống</option>
          <option value="Vận hành">Vận hành</option>
          <option value="Marketing">Marketing</option>
        </select>

        <button onClick={add}>+ Thêm</button>

        <input
          placeholder="🔍 Tìm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={exportExcel}>Export Excel</button>
      </div>

      {/* CHART */}
      <div style={{ margin: "20px 0" }}>
        {chartData.length > 0 && (
          <>
            <h4>📊 Chi phí theo danh mục</h4>
            
          </>
        )}
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tiền</th>
            <th>Danh mục</th>
            <th>Ghi chú</th>
            <th>Ngày</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((i, index) => (
            <tr key={i.id}>
              <td>{index + 1}</td>
              <td>{Number(i.amount).toLocaleString()}</td>
              <td>{i.category}</td>
              <td>{i.note}</td>
              <td>{new Date(i.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => del(i.id)}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}