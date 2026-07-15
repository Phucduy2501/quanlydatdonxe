import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiDelete } from "../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "staff",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const toArray = (res) => Array.isArray(res) ? res : res?.data || [];

  const loadUsers = async () => {
    try {
      const res = await apiGet("users");
      setUsers(toArray(res));
    } catch (error) {
      console.log("Lỗi tải tài khoản:", error);
      setUsers([]);
    }
  };

  const addUser = async () => {
    if (!form.email.trim()) return alert("Nhập email");
    if (!form.password.trim()) return alert("Nhập mật khẩu");

    try {
      await apiCreate("users", form);
      setForm({
        email: "",
        password: "",
        name: "",
        role: "staff",
      });
      loadUsers();
    } catch (error) {
      alert(error.message || "Lỗi thêm tài khoản");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Xóa tài khoản này?")) return;

    try {
      await apiDelete("users", id);
      loadUsers();
    } catch (error) {
      alert(error.message || "Lỗi xóa tài khoản");
    }
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>👤 Tài khoản hệ thống</h2>
          <p style={desc}>Quản lý tài khoản đăng nhập vào hệ thống.</p>
        </div>

        <button onClick={loadUsers} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={input}
        />

        <input
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={input}
        />

        <input
          placeholder="Tên người dùng"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={input}
        />

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          style={input}
        >
          <option value="admin">Admin</option>
          <option value="staff">Nhân viên</option>
        </select>

        <button onClick={addUser} style={btnPrimary}>
          + Thêm tài khoản
        </button>
      </div>

      <div style={tableBox}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Email</th>
              <th style={th}>Tên</th>
              <th style={th}>Vai trò</th>
              <th style={th}>Ngày tạo</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={empty}>Chưa có tài khoản</td>
              </tr>
            ) : (
              users.map((u, index) => (
                <tr key={u.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{u.name || "—"}</td>
                  <td style={td}>{u.role || "staff"}</td>
                  <td style={td}>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                  <td style={td}>
                    <button onClick={() => deleteUser(u.id)} style={btnDanger}>Xóa</button>
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
const input = { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 180 };
const btnPrimary = { padding: "10px 14px", background: "#3045a5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const btnLight = { padding: "10px 14px", background: "#fff", color: "#3045a5", border: "1px solid #c7d2fe", borderRadius: 8, cursor: "pointer" };
const tableBox = { background: "#fff", borderRadius: 12, overflow: "hidden" };
const table = { width: "100%", borderCollapse: "collapse" };
const th = { background: "#3045a5", color: "#fff", textAlign: "left", padding: 10 };
const td = { padding: 10, borderBottom: "1px solid #e5e7eb" };
const empty = { textAlign: "center", padding: 24, color: "#6b7280" };
const btnDanger = { padding: "5px 9px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer" };