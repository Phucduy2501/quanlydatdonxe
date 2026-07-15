import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function BusStops() {
  const [busStops, setBusStops] = useState([]);
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    station_id: "",
    name: "",
    address: "",
    province: "",
    latitude: "",
    longitude: "",
    status: "active",
    note: "",
  });

  useEffect(() => {
    loadBusStops();
    loadStations();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadBusStops = async () => {
    try {
      const res = await apiGet("busStops");
      setBusStops(toArray(res));
    } catch (error) {
      console.log("Lỗi tải trạm dừng:", error);
      setBusStops([]);
    }
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

  const getStationName = (stationId) => {
    const station = stations.find((s) => String(s.id) === String(stationId));
    return station?.name || "—";
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      station_id: "",
      name: "",
      address: "",
      province: "",
      latitude: "",
      longitude: "",
      status: "active",
      note: "",
    });
  };

  const saveBusStop = async () => {
    if (!form.name.trim()) return alert("Nhập tên trạm dừng");

    const payload = {
      ...form,
      station_id: form.station_id ? Number(form.station_id) : null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    try {
      if (editing) {
        await apiUpdate("busStops", editing.id, payload);
        alert("✅ Đã cập nhật trạm dừng");
      } else {
        await apiCreate("busStops", payload);
        alert("✅ Đã thêm trạm dừng");
      }

      resetForm();
      loadBusStops();
    } catch (error) {
      alert(error.message || "Lỗi lưu trạm dừng");
    }
  };

  const editBusStop = (item) => {
    setEditing(item);
    setForm({
      station_id: item.station_id || "",
      name: item.name || "",
      address: item.address || "",
      province: item.province || "",
      latitude: item.latitude || "",
      longitude: item.longitude || "",
      status: item.status || "active",
      note: item.note || "",
    });
  };

  const deleteBusStop = async (id) => {
    if (!confirm("Xóa trạm dừng này?")) return;

    try {
      await apiDelete("busStops", id);
      loadBusStops();
    } catch (error) {
      alert(error.message || "Lỗi xóa trạm dừng");
    }
  };

  const filtered = busStops.filter((item) => {
    const text = [
      item.name,
      item.address,
      item.province,
      getStationName(item.station_id),
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
          <h2>🚏 Trạm dừng</h2>
          <p style={desc}>Quản lý các trạm đón/trả khách theo bến xe.</p>
        </div>

        <button onClick={loadBusStops} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <select
          value={form.station_id}
          onChange={(e) => setForm({ ...form, station_id: e.target.value })}
          style={input}
        >
          <option value="">-- Chọn bến xe --</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Tên trạm dừng"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
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

        <input
          type="number"
          placeholder="Vĩ độ"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          style={input}
        />

        <input
          type="number"
          placeholder="Kinh độ"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
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

        <button onClick={saveBusStop} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm trạm"}
        </button>

        {editing && (
          <button onClick={resetForm} style={btnLight}>
            Hủy
          </button>
        )}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm trạm dừng..."
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
              <th style={th}>Bến xe</th>
              <th style={th}>Tên trạm</th>
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
                <td colSpan="8" style={empty}>Chưa có trạm dừng</td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.station_name || getStationName(item.station_id)}</td>
                  <td style={td}>{item.name}</td>
                  <td style={td}>{item.address || "—"}</td>
                  <td style={td}>{item.province || "—"}</td>
                  <td style={td}>
                    <span style={badge(item.status)}>
                      {item.status === "inactive" ? "Tạm dừng" : "Hoạt động"}
                    </span>
                  </td>
                  <td style={td}>{item.note || "—"}</td>
                  <td style={td}>
                    <button onClick={() => editBusStop(item)} style={btnSmall}>Sửa</button>
                    <button onClick={() => deleteBusStop(item.id)} style={btnDanger}>Xóa</button>
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