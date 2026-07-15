import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [buses, setBuses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    bus_id: "",
    maintenance_date: "",
    cost: "",
    status: "pending",
    note: "",
  });

  useEffect(() => {
    loadRecords();
    loadBuses();
  }, []);

  const toArray = (res) => Array.isArray(res) ? res : res?.data || [];

  const loadRecords = async () => {
    try {
      const res = await apiGet("maintenance");
      setRecords(toArray(res));
    } catch (error) {
      console.log("Lỗi tải bảo trì:", error);
      setRecords([]);
    }
  };

  const loadBuses = async () => {
    try {
      const res = await apiGet("buses");
      setBuses(toArray(res));
    } catch (error) {
      console.log("Lỗi tải xe:", error);
      setBuses([]);
    }
  };

  const getBusName = (id) => {
    const bus = buses.find((b) => String(b.id) === String(id));
    return bus?.plate_number || "—";
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      bus_id: "",
      maintenance_date: "",
      cost: "",
      status: "pending",
      note: "",
    });
  };

  const saveRecord = async () => {
    if (!form.bus_id) return alert("Chọn xe");
    if (!form.maintenance_date) return alert("Chọn ngày bảo trì");

    const payload = {
      ...form,
      bus_id: Number(form.bus_id),
      cost: Number(form.cost || 0),
    };

    try {
      if (editing) {
        await apiUpdate("maintenance", editing.id, payload);
        alert("✅ Đã cập nhật bảo trì");
      } else {
        await apiCreate("maintenance", payload);
        alert("✅ Đã thêm bảo trì");
      }

      resetForm();
      loadRecords();
    } catch (error) {
      alert(error.message || "Lỗi lưu bảo trì");
    }
  };

  const editRecord = (item) => {
    setEditing(item);
    setForm({
      bus_id: item.bus_id || "",
      maintenance_date: item.maintenance_date
        ? String(item.maintenance_date).slice(0, 10)
        : "",
      cost: item.cost || "",
      status: item.status || "pending",
      note: item.note || "",
    });
  };

  const deleteRecord = async (id) => {
    if (!confirm("Xóa phiếu bảo trì này?")) return;

    try {
      await apiDelete("maintenance", id);
      loadRecords();
    } catch (error) {
      alert(error.message || "Lỗi xóa bảo trì");
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  const filtered = records.filter((r) =>
    [getBusName(r.bus_id), r.note, r.status].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>🔧 Bảo trì xe</h2>
          <p style={desc}>Quản lý lịch bảo trì, chi phí và trạng thái sửa chữa.</p>
        </div>
        <button onClick={loadRecords} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <select
          value={form.bus_id}
          onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
          style={input}
        >
          <option value="">-- Chọn xe --</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.plate_number}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={form.maintenance_date}
          onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })}
          style={input}
        />

        <input
          type="number"
          placeholder="Chi phí"
          value={form.cost}
          onChange={(e) => setForm({ ...form, cost: e.target.value })}
          style={input}
        />

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={input}
        >
          <option value="pending">Chờ xử lý</option>
          <option value="processing">Đang sửa</option>
          <option value="done">Hoàn thành</option>
        </select>

        <input
          placeholder="Ghi chú"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={input}
        />

        <button onClick={saveRecord} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm bảo trì"}
        </button>

        {editing && <button onClick={resetForm} style={btnLight}>Hủy</button>}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm bảo trì..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />
      </div>

      <div style={tableBox}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Xe</th>
              <th style={th}>Ngày bảo trì</th>
              <th style={th}>Chi phí</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" style={empty}>Chưa có dữ liệu bảo trì</td></tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.plate_number || getBusName(item.bus_id)}</td>
                  <td style={td}>
                    {item.maintenance_date
                      ? new Date(item.maintenance_date).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td style={td}>{money(item.cost)}</td>
                  <td style={td}><span style={badge(item.status)}>{statusText(item.status)}</span></td>
                  <td style={td}>{item.note || "—"}</td>
                  <td style={td}>
                    <button onClick={() => editRecord(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteRecord(item.id)} style={btnDanger}>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusText(status) {
  if (status === "processing") return "Đang sửa";
  if (status === "done") return "Hoàn thành";
  return "Chờ xử lý";
}

function badge(status) {
  let bg = "#f59e0b";
  if (status === "processing") bg = "#2563eb";
  if (status === "done") bg = "#16a34a";

  return {
    background: bg,
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
}

const page = { padding: 24, background: "#f5f7fb", minHeight: "100vh" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const desc = { color: "#6b7280", marginTop: 4 };
const formBox = { display: "flex", flexWrap: "wrap", gap: 10, background: "#fff", padding: 14, borderRadius: 12, marginBottom: 14 };
const toolbar = { background: "#fff", padding: 14, borderRadius: 12, marginBottom: 14 };
const input = { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 180 };
const searchInput = { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, width: 320 };
const btnPrimary = { padding: "10px 14px", background: "#3045a5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const btnLight = { padding: "10px 14px", background: "#fff", color: "#3045a5", border: "1px solid #c7d2fe", borderRadius: 8, cursor: "pointer" };
const tableBox = { background: "#fff", borderRadius: 12, overflow: "hidden" };
const table = { width: "100%", borderCollapse: "collapse" };
const th = { background: "#3045a5", color: "#fff", textAlign: "left", padding: 10 };
const td = { padding: 10, borderBottom: "1px solid #e5e7eb" };
const empty = { textAlign: "center", padding: 24, color: "#6b7280" };
const btnSmall = { marginRight: 6, padding: "5px 9px", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer" };
const btnDanger = { padding: "5px 9px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer" };