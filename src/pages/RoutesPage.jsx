import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    start_point: "",
    end_point: "",
    distance_km: "",
    estimated_time: "",
    status: "active",
    note: "",
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
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
      name: "",
      start_point: "",
      end_point: "",
      distance_km: "",
      estimated_time: "",
      status: "active",
      note: "",
    });
  };

  const saveRoute = async () => {
    if (!form.name.trim()) return alert("Nhập tên tuyến");
    if (!form.start_point.trim()) return alert("Nhập điểm đi");
    if (!form.end_point.trim()) return alert("Nhập điểm đến");

    const payload = {
      ...form,
      distance_km: Number(form.distance_km || 0),
    };

    try {
      if (editing) {
        await apiUpdate("routes", editing.id, payload);
        alert("✅ Đã cập nhật tuyến");
      } else {
        await apiCreate("routes", payload);
        alert("✅ Đã thêm tuyến");
      }

      resetForm();
      loadRoutes();
    } catch (error) {
      alert(error.message || "Lỗi lưu tuyến đường");
    }
  };

  const editRoute = (item) => {
    setEditing(item);
    setForm({
      name: item.name || item.route_name || "",
      start_point: item.start_point || "",
      end_point: item.end_point || "",
      distance_km: item.distance_km || "",
      estimated_time: item.estimated_time || "",
      status: item.status || "active",
      note: item.note || "",
    });
  };

  const deleteRoute = async (id) => {
    if (!confirm("Xóa tuyến đường này?")) return;

    try {
      await apiDelete("routes", id);
      loadRoutes();
    } catch (error) {
      alert(error.message || "Lỗi xóa tuyến");
    }
  };

  const filtered = routes.filter((item) => {
    const text = [
      item.name,
      item.route_name,
      item.start_point,
      item.end_point,
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
          <h2>🛣️ Tuyến đường</h2>
          <p style={desc}>Quản lý tuyến xe, điểm đi, điểm đến và khoảng cách.</p>
        </div>

        <button onClick={loadRoutes} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Tên tuyến VD: Huế - Đà Nẵng"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={input}
        />

        <input
          placeholder="Điểm đi"
          value={form.start_point}
          onChange={(e) => setForm({ ...form, start_point: e.target.value })}
          style={input}
        />

        <input
          placeholder="Điểm đến"
          value={form.end_point}
          onChange={(e) => setForm({ ...form, end_point: e.target.value })}
          style={input}
        />

        <input
          type="number"
          placeholder="Khoảng cách km"
          value={form.distance_km}
          onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
          style={input}
        />

        <input
          placeholder="Thời gian dự kiến VD: 3 giờ"
          value={form.estimated_time}
          onChange={(e) => setForm({ ...form, estimated_time: e.target.value })}
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

        <button onClick={saveRoute} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm tuyến"}
        </button>

        {editing && (
          <button onClick={resetForm} style={btnLight}>
            Hủy
          </button>
        )}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm tuyến đường..."
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
              <th style={th}>Tên tuyến</th>
              <th style={th}>Điểm đi</th>
              <th style={th}>Điểm đến</th>
              <th style={th}>Km</th>
              <th style={th}>Thời gian</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={empty}>Chưa có tuyến đường</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.name || item.route_name}</td>
                  <td style={td}>{item.start_point}</td>
                  <td style={td}>{item.end_point}</td>
                  <td style={td}>{item.distance_km || 0}</td>
                  <td style={td}>{item.estimated_time || "—"}</td>
                  <td style={td}>
                    <span style={badge(item.status)}>
                      {item.status === "inactive" ? "Tạm dừng" : "Hoạt động"}
                    </span>
                  </td>
                  <td style={td}>
                    <button onClick={() => editRoute(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteRoute(item.id)} style={btnDanger}>Xóa</button>
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

function badge(s) {
  const bg = s === "inactive" ? "#f59e0b" : "#16a34a";
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