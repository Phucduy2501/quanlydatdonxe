import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    plate_number: "",
    bus_type_id: "",
    seat_count: "",
    brand: "",
    status: "active",
    note: "",
  });

  useEffect(() => {
    loadBuses();
    loadBusTypes();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
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

  const loadBusTypes = async () => {
    try {
      const res = await apiGet("busTypes");
      setBusTypes(toArray(res));
    } catch (error) {
      console.log("Lỗi tải loại xe:", error);
      setBusTypes([]);
    }
  };

  const getBusTypeName = (id) => {
    const type = busTypes.find((t) => String(t.id) === String(id));
    return type?.name || "—";
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      plate_number: "",
      bus_type_id: "",
      seat_count: "",
      brand: "",
      status: "active",
      note: "",
    });
  };

  const saveBus = async () => {
    if (!form.plate_number.trim()) return alert("Nhập biển số xe");

    const payload = {
      ...form,
      bus_type_id: form.bus_type_id ? Number(form.bus_type_id) : null,
      seat_count: Number(form.seat_count || 0),
    };

    try {
      if (editing) {
        await apiUpdate("buses", editing.id, payload);
        alert("✅ Đã cập nhật xe");
      } else {
        await apiCreate("buses", payload);
        alert("✅ Đã thêm xe");
      }

      resetForm();
      loadBuses();
    } catch (error) {
      alert(error.message || "Lỗi lưu xe");
    }
  };

  const editBus = (item) => {
    setEditing(item);
    setForm({
      plate_number: item.plate_number || "",
      bus_type_id: item.bus_type_id || "",
      seat_count: item.seat_count || "",
      brand: item.brand || "",
      status: item.status || "active",
      note: item.note || "",
    });
  };

  const deleteBus = async (id) => {
    if (!confirm("Xóa xe này?")) return;

    try {
      await apiDelete("buses", id);
      loadBuses();
    } catch (error) {
      alert(error.message || "Lỗi xóa xe");
    }
  };

  const filtered = buses.filter((item) => {
    const text = [
      item.plate_number,
      item.brand,
      getBusTypeName(item.bus_type_id),
      item.status,
      item.note,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>🚌 Danh sách xe</h2>
          <p style={desc}>Quản lý phương tiện, biển số, loại xe và trạng thái.</p>
        </div>

        <button onClick={loadBuses} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Biển số xe"
          value={form.plate_number}
          onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
          style={input}
        />

        <select
          value={form.bus_type_id}
          onChange={(e) => setForm({ ...form, bus_type_id: e.target.value })}
          style={input}
        >
          <option value="">-- Chọn loại xe --</option>
          {busTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Số ghế"
          value={form.seat_count}
          onChange={(e) => setForm({ ...form, seat_count: e.target.value })}
          style={input}
        />

        <input
          placeholder="Hãng xe"
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
          style={input}
        />

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={input}
        >
          <option value="active">Đang hoạt động</option>
          <option value="maintenance">Đang bảo trì</option>
          <option value="inactive">Tạm dừng</option>
        </select>

        <input
          placeholder="Ghi chú"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={input}
        />

        <button onClick={saveBus} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm xe"}
        </button>

        {editing && <button onClick={resetForm} style={btnLight}>Hủy</button>}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm xe..."
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
              <th style={th}>Biển số</th>
              <th style={th}>Loại xe</th>
              <th style={th}>Số ghế</th>
              <th style={th}>Hãng xe</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={empty}>Chưa có xe</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.plate_number}</td>
                  <td style={td}>{item.bus_type_name || getBusTypeName(item.bus_type_id)}</td>
                  <td style={td}>{item.seat_count || 0}</td>
                  <td style={td}>{item.brand || "—"}</td>
                  <td style={td}><span style={badge(item.status)}>{statusText(item.status)}</span></td>
                  <td style={td}>{item.note || "—"}</td>
                  <td style={td}>
                    <button onClick={() => editBus(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteBus(item.id)} style={btnDanger}>Xóa</button>
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
  if (status === "maintenance") return "Bảo trì";
  if (status === "inactive") return "Tạm dừng";
  return "Hoạt động";
}

function badge(status) {
  let bg = "#16a34a";
  if (status === "maintenance") bg = "#f59e0b";
  if (status === "inactive") bg = "#dc2626";

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