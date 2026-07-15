import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function RouteStops() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    route_id: "",
    stop_name: "",
    address: "",
    stop_order: "",
    note: "",
  });

  useEffect(() => {
    loadRoutes();
    loadStops();
  }, []);

  function toArray(res) {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  }

  async function loadStops() {
    try {
      const res = await apiGet("routeStops");
      setStops(toArray(res));
    } catch (error) {
      console.log("Lỗi tải điểm dừng tuyến:", error);
      setStops([]);
    }
  }

  async function loadRoutes() {
    try {
      const res = await apiGet("routes");
      setRoutes(toArray(res));
    } catch (error) {
      console.log("Lỗi tải tuyến:", error);
      setRoutes([]);
    }
  }

  function getRouteName(routeId) {
    const route = routes.find((r) => String(r.id) === String(routeId));

    return (
      route?.name ||
      route?.route_name ||
      route?.route_code ||
      route?.code ||
      "—"
    );
  }

  function resetForm() {
    setEditing(null);

    setForm({
      route_id: "",
      stop_name: "",
      address: "",
      stop_order: "",
      note: "",
    });
  }

  async function saveStop() {
    if (!form.route_id) {
      alert("Chọn tuyến đường");
      return;
    }

    if (!form.stop_name.trim()) {
      alert("Nhập tên điểm dừng");
      return;
    }

    const selectedRoute = routes.find(
      (r) => String(r.id) === String(form.route_id)
    );

    const routeName =
      selectedRoute?.name ||
      selectedRoute?.route_name ||
      selectedRoute?.route_code ||
      selectedRoute?.code ||
      "";

    const stopName = form.stop_name.trim();
    const address = form.address.trim();
    const stopOrder = Number(form.stop_order || 0);

    const payload = {
      route_id: Number(form.route_id),
      route_name: routeName,

      stop_name: stopName,
      station_name: stopName,
      name: stopName,
      bus_stop_name: stopName,

      address: address,
      location: address,

      stop_order: stopOrder,
      sort_order: stopOrder,
      order_number: stopOrder,

      note: form.note.trim(),

      // phòng trường hợp bảng cũ có các cột này
      bus_stop_id: null,
      station_id: null,
      stop_id: null,
    };

    try {
      if (editing) {
        await apiUpdate("routeStops", editing.id, payload);
        alert("✅ Đã cập nhật điểm dừng");
      } else {
        await apiCreate("routeStops", payload);
        alert("✅ Đã thêm điểm dừng");
      }

      resetForm();
      await loadStops();
    } catch (error) {
      console.log("Lỗi lưu điểm dừng:", error);
      alert(error.message || "Lỗi lưu điểm dừng");
    }
  }

  function editStop(item) {
    setEditing(item);

    setForm({
      route_id: item.route_id || "",
      stop_name:
        item.stop_name ||
        item.station_name ||
        item.bus_stop_name ||
        item.name ||
        "",
      address: item.address || item.location || "",
      stop_order:
        item.stop_order ||
        item.sort_order ||
        item.order_number ||
        "",
      note: item.note || "",
    });
  }

  async function deleteStop(id) {
    if (!confirm("Xóa điểm dừng này?")) return;

    try {
      await apiDelete("routeStops", id);
      await loadStops();
    } catch (error) {
      console.log("Lỗi xóa điểm dừng:", error);
      alert(error.message || "Lỗi xóa điểm dừng");
    }
  }

  const filtered = stops.filter((item) => {
    const text = [
      item.route_name,
      getRouteName(item.route_id),
      item.stop_name,
      item.station_name,
      item.bus_stop_name,
      item.name,
      item.address,
      item.location,
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
          <h2>📍 Điểm dừng tuyến</h2>
          <p style={desc}>Quản lý các điểm đón/trả khách theo từng tuyến.</p>
        </div>

        <button onClick={loadStops} style={btnLight}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={formBox}>
        <select
          value={form.route_id}
          onChange={(e) => setForm({ ...form, route_id: e.target.value })}
          style={input}
        >
          <option value="">-- Chọn tuyến --</option>

          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name || r.route_name || r.route_code || r.code}
            </option>
          ))}
        </select>

        <input
          placeholder="Tên điểm dừng"
          value={form.stop_name}
          onChange={(e) => setForm({ ...form, stop_name: e.target.value })}
          style={input}
        />

        <input
          placeholder="Địa chỉ"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          style={input}
        />

        <input
          type="number"
          placeholder="Thứ tự"
          value={form.stop_order}
          onChange={(e) => setForm({ ...form, stop_order: e.target.value })}
          style={input}
        />

        <input
          placeholder="Ghi chú"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          style={input}
        />

        <button onClick={saveStop} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm điểm dừng"}
        </button>

        {editing && (
          <button onClick={resetForm} style={btnLight}>
            Hủy
          </button>
        )}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm điểm dừng..."
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
              <th style={th}>Tuyến</th>
              <th style={th}>Tên điểm dừng</th>
              <th style={th}>Địa chỉ</th>
              <th style={th}>Thứ tự</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={empty}>
                  Chưa có điểm dừng tuyến
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>
                    {item.route_name || getRouteName(item.route_id)}
                  </td>
                  <td style={td}>
                    {item.stop_name ||
                      item.station_name ||
                      item.bus_stop_name ||
                      item.name ||
                      "—"}
                  </td>
                  <td style={td}>{item.address || item.location || "—"}</td>
                  <td style={td}>
                    {item.stop_order ||
                      item.sort_order ||
                      item.order_number ||
                      0}
                  </td>
                  <td style={td}>{item.note || "—"}</td>
                  <td style={td}>
                    <button onClick={() => editStop(item)} style={btnSmall}>
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteStop(item.id)}
                      style={btnDanger}
                    >
                      Xóa
                    </button>
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

const page = {
  padding: 24,
  background: "#f5f7fb",
  minHeight: "100vh",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const desc = {
  color: "#6b7280",
  marginTop: 4,
};

const formBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "#fff",
  padding: 14,
  borderRadius: 12,
  marginBottom: 14,
};

const toolbar = {
  background: "#fff",
  padding: 14,
  borderRadius: 12,
  marginBottom: 14,
};

const input = {
  padding: 10,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 180,
};

const searchInput = {
  padding: 10,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  width: 320,
};

const btnPrimary = {
  padding: "10px 14px",
  background: "#3045a5",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const btnLight = {
  padding: "10px 14px",
  background: "#fff",
  color: "#3045a5",
  border: "1px solid #c7d2fe",
  borderRadius: 8,
  cursor: "pointer",
};

const tableBox = {
  background: "#fff",
  borderRadius: 12,
  overflow: "hidden",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  background: "#3045a5",
  color: "#fff",
  textAlign: "left",
  padding: 10,
};

const td = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
};

const empty = {
  textAlign: "center",
  padding: 24,
  color: "#6b7280",
};

const btnSmall = {
  marginRight: 6,
  padding: "5px 9px",
  borderRadius: 6,
  border: "1px solid #ccc",
  cursor: "pointer",
};

const btnDanger = {
  padding: "5px 9px",
  borderRadius: 6,
  border: "none",
  background: "#dc2626",
  color: "#fff",
  cursor: "pointer",
};