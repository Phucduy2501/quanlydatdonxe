import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "info",
    status: "unread",
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const toArray = (res) => Array.isArray(res) ? res : res?.data || [];

  const loadNotifications = async () => {
    try {
      const res = await apiGet("notifications");
      setItems(toArray(res));
    } catch (error) {
      console.log("Lỗi tải thông báo:", error);
      setItems([]);
    }
  };

  const addNotification = async () => {
    if (!form.title.trim()) return alert("Nhập tiêu đề thông báo");

    try {
      await apiCreate("notifications", form);
      setForm({
        title: "",
        content: "",
        type: "info",
        status: "unread",
      });
      loadNotifications();
    } catch (error) {
      alert(error.message || "Lỗi thêm thông báo");
    }
  };

  const markRead = async (item) => {
    try {
      await apiUpdate("notifications", item.id, {
        ...item,
        status: "read",
      });
      loadNotifications();
    } catch (error) {
      alert(error.message || "Lỗi cập nhật thông báo");
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm("Xóa thông báo này?")) return;

    try {
      await apiDelete("notifications", id);
      loadNotifications();
    } catch (error) {
      alert(error.message || "Lỗi xóa thông báo");
    }
  };

  const filtered = items.filter((item) =>
    [item.title, item.content, item.type, item.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>🔔 Thông báo</h2>
          <p style={desc}>Quản lý thông báo hệ thống và nhắc việc.</p>
        </div>

        <button onClick={loadNotifications} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Tiêu đề"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={input}
        />

        <input
          placeholder="Nội dung"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          style={{ ...input, minWidth: 300 }}
        />

        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          style={input}
        >
          <option value="info">Thông tin</option>
          <option value="warning">Cảnh báo</option>
          <option value="danger">Khẩn cấp</option>
        </select>

        <button onClick={addNotification} style={btnPrimary}>
          + Thêm thông báo
        </button>
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm thông báo..."
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
              <th style={th}>Tiêu đề</th>
              <th style={th}>Nội dung</th>
              <th style={th}>Loại</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Ngày tạo</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={empty}>Chưa có thông báo</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.title}</td>
                  <td style={td}>{item.content || "—"}</td>
                  <td style={td}>{typeText(item.type)}</td>
                  <td style={td}>{item.status === "read" ? "Đã đọc" : "Chưa đọc"}</td>
                  <td style={td}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                  <td style={td}>
                    <button onClick={() => markRead(item)} style={btnSmall}>Đã đọc</button>
                    <button onClick={() => deleteNotification(item.id)} style={btnDanger}>Xóa</button>
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

function typeText(type) {
  if (type === "warning") return "Cảnh báo";
  if (type === "danger") return "Khẩn cấp";
  return "Thông tin";
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