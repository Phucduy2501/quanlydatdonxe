import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function BusTypes() {
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    seat_count: "",
    description: "",
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const toArray = (res) => Array.isArray(res) ? res : res?.data || [];

  const loadTypes = async () => {
    try {
      const res = await apiGet("busTypes");
      setTypes(toArray(res));
    } catch (error) {
      console.log("Lỗi tải loại xe:", error);
      setTypes([]);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", seat_count: "", description: "" });
  };

  const saveType = async () => {
    if (!form.name.trim()) return alert("Nhập tên loại xe");

    const payload = {
      ...form,
      seat_count: Number(form.seat_count || 0),
    };

    try {
      if (editing) {
        await apiUpdate("busTypes", editing.id, payload);
        alert("✅ Đã cập nhật loại xe");
      } else {
        await apiCreate("busTypes", payload);
        alert("✅ Đã thêm loại xe");
      }

      resetForm();
      loadTypes();
    } catch (error) {
      alert(error.message || "Lỗi lưu loại xe");
    }
  };

  const editType = (item) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      seat_count: item.seat_count || "",
      description: item.description || "",
    });
  };

  const deleteType = async (id) => {
    if (!confirm("Xóa loại xe này?")) return;

    try {
      await apiDelete("busTypes", id);
      loadTypes();
    } catch (error) {
      alert(error.message || "Lỗi xóa loại xe");
    }
  };

  const filtered = types.filter((item) =>
    [item.name, item.description].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>🚐 Loại xe</h2>
          <p style={desc}>Quản lý loại xe như ghế ngồi, limousine, giường nằm.</p>
        </div>
        <button onClick={loadTypes} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Tên loại xe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={input}
        />

        <input
          type="number"
          placeholder="Số ghế mặc định"
          value={form.seat_count}
          onChange={(e) => setForm({ ...form, seat_count: e.target.value })}
          style={input}
        />

        <input
          placeholder="Mô tả"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={input}
        />

        <button onClick={saveType} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm loại"}
        </button>

        {editing && <button onClick={resetForm} style={btnLight}>Hủy</button>}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm loại xe..."
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
              <th style={th}>Tên loại xe</th>
              <th style={th}>Số ghế</th>
              <th style={th}>Mô tả</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={empty}>Chưa có loại xe</td></tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.name}</td>
                  <td style={td}>{item.seat_count || 0}</td>
                  <td style={td}>{item.description || "—"}</td>
                  <td style={td}>
                    <button onClick={() => editType(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteType(item.id)} style={btnDanger}>Xóa</button>
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