import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiDelete } from "../services/api";

export default function BusSeats() {
  const [buses, setBuses] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedBus, setSelectedBus] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [seatType, setSeatType] = useState("normal");

  useEffect(() => {
    loadBuses();
  }, []);

  useEffect(() => {
    if (selectedBus) loadSeats();
    else setSeats([]);
  }, [selectedBus]);

  const toArray = (res) => Array.isArray(res) ? res : res?.data || [];

  const loadBuses = async () => {
    try {
      const res = await apiGet("buses");
      setBuses(toArray(res));
    } catch (error) {
      console.log("Lỗi tải xe:", error);
      setBuses([]);
    }
  };

  const loadSeats = async () => {
    try {
      const res = await apiGet("busSeats", { bus_id: selectedBus });
      setSeats(toArray(res));
    } catch (error) {
      console.log("Lỗi tải ghế:", error);
      setSeats([]);
    }
  };

  const addSeat = async () => {
    if (!selectedBus) return alert("Chọn xe");
    if (!seatNumber.trim()) return alert("Nhập số ghế");

    try {
      await apiCreate("busSeats", {
        bus_id: Number(selectedBus),
        seat_number: seatNumber,
        seat_type: seatType,
        status: "available",
      });

      setSeatNumber("");
      loadSeats();
    } catch (error) {
      alert(error.message || "Lỗi thêm ghế");
    }
  };

  const deleteSeat = async (id) => {
    if (!confirm("Xóa ghế này?")) return;

    try {
      await apiDelete("busSeats", id);
      loadSeats();
    } catch (error) {
      alert(error.message || "Lỗi xóa ghế");
    }
  };

  const createAutoSeats = async () => {
    if (!selectedBus) return alert("Chọn xe");

    const count = Number(prompt("Nhập số ghế muốn tạo:", "40"));
    if (!count) return;

    try {
      for (let i = 1; i <= count; i++) {
        await apiCreate("busSeats", {
          bus_id: Number(selectedBus),
          seat_number: `A${i}`,
          seat_type: "normal",
          status: "available",
        });
      }

      alert("✅ Đã tạo sơ đồ ghế");
      loadSeats();
    } catch (error) {
      alert(error.message || "Lỗi tạo ghế tự động");
    }
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>💺 Sơ đồ ghế</h2>
          <p style={desc}>Quản lý ghế theo từng xe.</p>
        </div>
        <button onClick={loadSeats} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={formBox}>
        <select
          value={selectedBus}
          onChange={(e) => setSelectedBus(e.target.value)}
          style={input}
        >
          <option value="">-- Chọn xe --</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.plate_number} - {b.brand || ""}
            </option>
          ))}
        </select>

        <input
          placeholder="Số ghế VD: A1"
          value={seatNumber}
          onChange={(e) => setSeatNumber(e.target.value)}
          style={input}
        />

        <select
          value={seatType}
          onChange={(e) => setSeatType(e.target.value)}
          style={input}
        >
          <option value="normal">Ghế thường</option>
          <option value="vip">Ghế VIP</option>
          <option value="bed">Giường nằm</option>
        </select>

        <button onClick={addSeat} style={btnPrimary}>+ Thêm ghế</button>
        <button onClick={createAutoSeats} style={btnLight}>Tạo tự động</button>
      </div>

      <div style={seatGrid}>
        {seats.length === 0 ? (
          <div style={emptyCard}>Chưa có ghế</div>
        ) : (
          seats.map((s) => (
            <div key={s.id} style={seatCard(s.status)}>
              <b>{s.seat_number}</b>
              <small>{seatTypeText(s.seat_type)}</small>
              <button onClick={() => deleteSeat(s.id)} style={seatDelete}>x</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function seatTypeText(type) {
  if (type === "vip") return "VIP";
  if (type === "bed") return "Giường";
  return "Thường";
}

function seatCard(status) {
  let bg = "#e8f5e9";
  let border = "#16a34a";

  if (status === "booked") {
    bg = "#fee2e2";
    border = "#dc2626";
  }

  return {
    position: "relative",
    height: 72,
    border: `2px solid ${border}`,
    borderRadius: 12,
    background: bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  };
}

const page = { padding: 24, background: "#f5f7fb", minHeight: "100vh" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const desc = { color: "#6b7280", marginTop: 4 };
const formBox = { display: "flex", flexWrap: "wrap", gap: 10, background: "#fff", padding: 14, borderRadius: 12, marginBottom: 14 };
const input = { padding: 10, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 180 };
const btnPrimary = { padding: "10px 14px", background: "#3045a5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const btnLight = { padding: "10px 14px", background: "#fff", color: "#3045a5", border: "1px solid #c7d2fe", borderRadius: 8, cursor: "pointer" };
const seatGrid = { background: "#fff", padding: 18, borderRadius: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12 };
const emptyCard = { padding: 30, color: "#6b7280", textAlign: "center", gridColumn: "1 / -1" };
const seatDelete = { position: "absolute", top: 4, right: 6, border: "none", background: "transparent", color: "#dc2626", cursor: "pointer" };