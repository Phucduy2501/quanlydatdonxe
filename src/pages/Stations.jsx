import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    province: "",
    status: "active",
    note: "",
  });

  useEffect(() => {
    loadStations();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadStations = async () => {
    try {
      const res = await apiGet("stations");
      setStations(toArray(res));
    } catch (error) {
      console.log("Lỗi tải bến xe:", error);
      setStations([]);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      address: "",
      province: "",
      status: "active",
      note: "",
    });
  };

  const saveStation = async () => {
    if (!form.name.trim()) return alert("Nhập tên bến xe");

    try {
      if (editing) {
        await apiUpdate("stations", editing.id, form);
        alert("✅ Đã cập nhật bến xe");
      } else {
        await apiCreate("stations", form);
        alert("✅ Đã thêm bến xe");
      }

      resetForm();
      loadStations();
    } catch (error) {
      alert(error.message || "Lỗi lưu bến xe");
    }
  };

  const editStation = (item) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      phone: item.phone || "",
      address: item.address || "",
      province: item.province || "",
      status: item.status || "active",
      note: item.note || "",
    });
  };

  const deleteStation = async (id) => {
    if (!confirm("Xóa bến xe này?")) return;

    try {
      await apiDelete("stations", id);
      loadStations();
    } catch (error) {
      alert(error.message || "Lỗi xóa bến xe");
    }
  };

  const filtered = stations.filter((item) => {
    const text = [
      item.name,
      item.phone,
      item.address,
      item.province,
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
          <h2>🏢 Bến xe</h2>
          <p style={desc}>Quản lý danh sách bến xe, địa chỉ và trạng thái hoạt động.</p>
        </div>

        <button onClick={loadStations} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Tên bến xe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={input}
        />

        <input
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          style={input}
        />

        <input
          placeholder="Địa chỉ"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          style={input}
        />

        <input
          placeholder="Tỉnh/Thành phố"
          value={form.province}
          onChange={(e) => setForm({ ...form, province: e.target.value })}
          style={input}
        />

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={input}
        >
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>

        <input
          placeholder="Ghi chú"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={input}
        />

        <button onClick={saveStation} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm bến xe"}
        </button>

        {editing && (
          <button onClick={resetForm} style={btnLight}>
            Hủy
          </button>
        )}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm bến xe..."
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
              <th style={th}>Tên bến xe</th>
              <th style={th}>SĐT</th>
              <th style={th}>Địa chỉ</th>
              <th style={th}>Tỉnh/TP</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={empty}>Chưa có bến xe</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.name}</td>
                  <td style={td}>{item.phone || "—"}</td>
                  <td style={td}>{item.address || "—"}</td>
                  <td style={td}>{item.province || "—"}</td>
                  <td style={td}>
                    <span style={badge(item.status)}>
                      {item.status === "inactive" ? "Tạm dừng" : "Hoạt động"}
                    </span>
                  </td>
                  <td style={td}>{item.note || "—"}</td>
                  <td style={td}>
                    <button onClick={() => editStation(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteStation(item.id)} style={btnDanger}>Xóa</button>
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

function badge(status) {
  const bg = status === "inactive" ? "#f59e0b" : "#16a34a";

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