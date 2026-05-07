import { useState } from "react";

const daysOfWeek = [
  "T2", "T3", "T4", "T5", "T6", "T7", "CN"
];

export default function Shifts() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    name: "",
    start: "",
    end: "",
    days: []
  });

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // toggle ngày
  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  // thêm / sửa
  const handleSave = () => {
    if (!form.name || !form.start || !form.end) return;

    if (editingId) {
      setData(data.map(i =>
        i.id === editingId ? { ...i, ...form } : i
      ));
      setEditingId(null);
    } else {
      setData([...data, { id: Date.now(), ...form }]);
    }

    setForm({ name: "", start: "", end: "", days: [] });
  };

  // sửa
  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
  };

  // xoá
  const handleDelete = (id) => {
    setData(data.filter(i => i.id !== id));
  };

  // search
  const filtered = data.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="staff-page">
      <h2>⏰ Ca làm việc</h2>

      {/* FORM */}
      <div className="shift-form">

        <input
          placeholder="Tên ca"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="time"
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
        />

        <input
          type="time"
          value={form.end}
          onChange={(e) => setForm({ ...form, end: e.target.value })}
        />

        <button onClick={handleSave}>
          {editingId ? "✔ Lưu" : "+ Thêm"}
        </button>

        <input
          placeholder="🔍 Tìm ca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search"
        />
      </div>

      {/* CHỌN NGÀY */}
      <div className="days">
        {daysOfWeek.map(day => (
          <button
            key={day}
            className={form.days.includes(day) ? "active-day" : ""}
            onClick={() => toggleDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên ca</th>
              <th>Giờ</th>
              <th>Ngày làm</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.start} - {item.end}</td>
                <td>{item.days.join(", ")}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>Sửa</button>
                  <button onClick={() => handleDelete(item.id)}>Xoá</button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="empty">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}