import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    rating: 5,
    content: "",
    status: "new",
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const toArray = (res) => Array.isArray(res) ? res : res?.data || [];

  const loadReviews = async () => {
    try {
      const res = await apiGet("reviews");
      setReviews(toArray(res));
    } catch (error) {
      console.log("Lỗi tải đánh giá:", error);
      setReviews([]);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      customer_name: "",
      phone: "",
      rating: 5,
      content: "",
      status: "new",
    });
  };

  const saveReview = async () => {
    if (!form.customer_name.trim()) return alert("Nhập tên khách hàng");

    const payload = {
      ...form,
      rating: Number(form.rating || 5),
    };

    try {
      if (editing) {
        await apiUpdate("reviews", editing.id, payload);
        alert("✅ Đã cập nhật đánh giá");
      } else {
        await apiCreate("reviews", payload);
        alert("✅ Đã thêm đánh giá");
      }

      resetForm();
      loadReviews();
    } catch (error) {
      alert(error.message || "Lỗi lưu đánh giá");
    }
  };

  const editReview = (item) => {
    setEditing(item);
    setForm({
      customer_name: item.customer_name || "",
      phone: item.phone || "",
      rating: item.rating || 5,
      content: item.content || "",
      status: item.status || "new",
    });
  };

  const deleteReview = async (id) => {
    if (!confirm("Xóa đánh giá này?")) return;

    try {
      await apiDelete("reviews", id);
      loadReviews();
    } catch (error) {
      alert(error.message || "Lỗi xóa đánh giá");
    }
  };

  const filtered = reviews.filter((item) =>
    [item.customer_name, item.phone, item.content, item.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>⭐ Đánh giá</h2>
          <p style={desc}>Quản lý phản hồi và đánh giá của khách hàng.</p>
        </div>

        <button onClick={loadReviews} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Tên khách hàng"
          value={form.customer_name}
          onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
          style={input}
        />

        <input
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          style={input}
        />

        <select
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
          style={input}
        >
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={input}
        >
          <option value="new">Mới</option>
          <option value="handled">Đã xử lý</option>
          <option value="hidden">Ẩn</option>
        </select>

        <input
          placeholder="Nội dung đánh giá"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          style={{ ...input, minWidth: 300 }}
        />

        <button onClick={saveReview} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm đánh giá"}
        </button>

        {editing && <button onClick={resetForm} style={btnLight}>Hủy</button>}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm đánh giá..."
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
              <th style={th}>Khách hàng</th>
              <th style={th}>SĐT</th>
              <th style={th}>Sao</th>
              <th style={th}>Nội dung</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={empty}>Chưa có đánh giá</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.customer_name}</td>
                  <td style={td}>{item.phone || "—"}</td>
                  <td style={td}>{"⭐".repeat(Number(item.rating || 0))}</td>
                  <td style={td}>{item.content || "—"}</td>
                  <td style={td}>{statusText(item.status)}</td>
                  <td style={td}>
                    <button onClick={() => editReview(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteReview(item.id)} style={btnDanger}>Xóa</button>
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
  if (status === "handled") return "Đã xử lý";
  if (status === "hidden") return "Đã ẩn";
  return "Mới";
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