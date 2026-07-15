import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    license_number: "",
    address: "",
    status: "active",
    note: "",
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const toArray = (res) => Array.isArray(res) ? res : res?.data || [];

  const loadDrivers = async () => {
    try {
      const res = await apiGet("drivers");
      setDrivers(toArray(res));
    } catch (error) {
      console.log("Lỗi tải tài xế:", error);
      setDrivers([]);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      license_number: "",
      address: "",
      status: "active",
      note: "",
    });
  };

  const saveDriver = async () => {
    if (!form.name.trim()) return alert("Nhập tên tài xế");

    try {
      if (editing) {
        await apiUpdate("drivers", editing.id, form);
        alert("✅ Đã cập nhật tài xế");
      } else {
        await apiCreate("drivers", form);
        alert("✅ Đã thêm tài xế");
      }

      resetForm();
      loadDrivers();
    } catch (error) {
      alert(error.message || "Lỗi lưu tài xế");
    }
  };

  const editDriver = (item) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      phone: item.phone || "",
      license_number: item.license_number || "",
      address: item.address || "",
      status: item.status || "active",
      note: item.note || "",
    });
  };

  const deleteDriver = async (id) => {
    if (!confirm("Xóa tài xế này?")) return;

    try {
      await apiDelete("drivers", id);
      loadDrivers();
    } catch (error) {
      alert(error.message || "Lỗi xóa tài xế");
    }
  };

  const filtered = drivers.filter((item) =>
    [
      item.name,
      item.phone,
      item.license_number,
      item.address,
      item.status,
      item.note,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>👨‍✈️ Tài xế</h2>
          <p style={desc}>Quản lý tài xế, bằng lái, số điện thoại và trạng thái làm việc.</p>
        </div>

        <button onClick={loadDrivers} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Tên tài xế"
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
          placeholder="Số bằng lái"
          value={form.license_number}
          onChange={(e) => setForm({ ...form, license_number: e.target.value })}
          style={input}
        />

        <input
          placeholder="Địa chỉ"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          style={input}
        />

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={input}
        >
          <option value="active">Đang làm</option>
          <option value="inactive">Nghỉ</option>
          <option value="busy">Đang chạy</option>
        </select>

        <input
          placeholder="Ghi chú"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={input}
        />

        <button onClick={saveDriver} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm tài xế"}
        </button>

        {editing && <button onClick={resetForm} style={btnLight}>Hủy</button>}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm tài xế..."
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
              <th style={th}>Tên tài xế</th>
              <th style={th}>SĐT</th>
              <th style={th}>Số bằng lái</th>
              <th style={th}>Địa chỉ</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={empty}>Chưa có tài xế</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.name}</td>
                  <td style={td}>{item.phone || "—"}</td>
                  <td style={td}>{item.license_number || "—"}</td>
                  <td style={td}>{item.address || "—"}</td>
                  <td style={td}>
                    <span style={badge(item.status)}>{statusText(item.status)}</span>
                  </td>
                  <td style={td}>{item.note || "—"}</td>
                  <td style={td}>
                    <button onClick={() => editDriver(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteDriver(item.id)} style={btnDanger}>Xóa</button>
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
  if (status === "busy") return "Đang chạy";
  if (status === "inactive") return "Nghỉ";
  return "Đang làm";
}

function badge(status) {
  let bg = "#16a34a";
  if (status === "busy") bg = "#2563eb";
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