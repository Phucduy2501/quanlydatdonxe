import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    trip_code: "",
    route_id: "",
    departure_time: "",
    arrival_time: "",
    price: "",
    total_seats: "",
    status: "active",
    note: "",
  });

  useEffect(() => {
    loadTrips();
    loadRoutes();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadTrips = async () => {
    try {
      const res = await apiGet("trips");
      setTrips(toArray(res));
    } catch (error) {
      console.log("Lỗi tải chuyến xe:", error);
      setTrips([]);
    }
  };

  const loadRoutes = async () => {
    try {
      const res = await apiGet("routes");
      setRoutes(toArray(res));
    } catch (error) {
      console.log("Lỗi tải tuyến đường:", error);
      setRoutes([]);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      trip_code: "",
      route_id: "",
      departure_time: "",
      arrival_time: "",
      price: "",
      total_seats: "",
      status: "active",
      note: "",
    });
  };

  const handleSave = async () => {
    if (!form.trip_code.trim()) return alert("Nhập mã chuyến");
    if (!form.departure_time) return alert("Chọn giờ khởi hành");

    const payload = {
      ...form,
      route_id: form.route_id || null,
      price: Number(form.price || 0),
      total_seats: Number(form.total_seats || 0),
    };

    try {
      if (editing) {
        await apiUpdate("trips", editing.id, payload);
        alert("✅ Đã cập nhật chuyến");
      } else {
        await apiCreate("trips", payload);
        alert("✅ Đã thêm chuyến");
      }

      resetForm();
      loadTrips();
    } catch (error) {
      alert(error.message || "Lỗi lưu chuyến xe");
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      trip_code: item.trip_code || "",
      route_id: item.route_id || "",
      departure_time: item.departure_time
        ? String(item.departure_time).slice(0, 16)
        : "",
      arrival_time: item.arrival_time
        ? String(item.arrival_time).slice(0, 16)
        : "",
      price: item.price || "",
      total_seats: item.total_seats || "",
      status: item.status || "active",
      note: item.note || "",
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa chuyến xe này?")) return;

    try {
      await apiDelete("trips", id);
      loadTrips();
    } catch (error) {
      alert(error.message || "Lỗi xóa chuyến");
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  const showDate = (v) => {
    if (!v) return "—";
    return new Date(v).toLocaleString("vi-VN");
  };

  const getRouteName = (routeId) => {
    const route = routes.find((r) => String(r.id) === String(routeId));
    return route?.name || route?.route_name || "—";
  };

  const filtered = trips.filter((item) => {
    const text = [
      item.trip_code,
      item.route_name,
      getRouteName(item.route_id),
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
          <h2>🚌 Danh sách chuyến</h2>
          <p style={desc}>Quản lý chuyến xe, giờ chạy, giá vé và số ghế.</p>
        </div>

        <button onClick={loadTrips} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Mã chuyến VD: CX001"
          value={form.trip_code}
          onChange={(e) => setForm({ ...form, trip_code: e.target.value })}
          style={input}
        />

        <select
          value={form.route_id}
          onChange={(e) => setForm({ ...form, route_id: e.target.value })}
          style={input}
        >
          <option value="">-- Chọn tuyến --</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name || r.route_name}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={form.departure_time}
          onChange={(e) =>
            setForm({ ...form, departure_time: e.target.value })
          }
          style={input}
        />

        <input
          type="datetime-local"
          value={form.arrival_time}
          onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
          style={input}
        />

        <input
          type="number"
          placeholder="Giá vé"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          style={input}
        />

        <input
          type="number"
          placeholder="Số ghế"
          value={form.total_seats}
          onChange={(e) => setForm({ ...form, total_seats: e.target.value })}
          style={input}
        />

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={input}
        >
          <option value="active">Đang chạy</option>
          <option value="inactive">Tạm dừng</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <input
          placeholder="Ghi chú"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={input}
        />

        <button onClick={handleSave} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm chuyến"}
        </button>

        {editing && (
          <button onClick={resetForm} style={btnLight}>
            Hủy
          </button>
        )}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm chuyến..."
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
              <th style={th}>Mã chuyến</th>
              <th style={th}>Tuyến</th>
              <th style={th}>Khởi hành</th>
              <th style={th}>Đến nơi</th>
              <th style={th}>Giá vé</th>
              <th style={th}>Số ghế</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={empty}>Chưa có chuyến xe</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.trip_code}</td>
                  <td style={td}>{item.route_name || getRouteName(item.route_id)}</td>
                  <td style={td}>{showDate(item.departure_time)}</td>
                  <td style={td}>{showDate(item.arrival_time)}</td>
                  <td style={td}>{money(item.price)}</td>
                  <td style={td}>{item.total_seats || 0}</td>
                  <td style={td}>
                    <span style={badge(item.status)}>{statusText(item.status)}</span>
                  </td>
                  <td style={td}>
                    <button onClick={() => handleEdit(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => handleDelete(item.id)} style={btnDanger}>Xóa</button>
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

function statusText(s) {
  if (s === "inactive") return "Tạm dừng";
  if (s === "cancelled") return "Đã hủy";
  return "Đang chạy";
}

function badge(s) {
  let bg = "#16a34a";
  if (s === "inactive") bg = "#f59e0b";
  if (s === "cancelled") bg = "#dc2626";
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
const input = { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 170 };
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