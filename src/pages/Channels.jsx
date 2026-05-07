import { useState } from "react";

export default function Channels() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    name: "",
    note: "",
    active: true
  });
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // ➕ THÊM / SỬA
  const handleSave = () => {
    if (!form.name.trim()) return;

    if (editingId) {
      setData(data.map(i =>
        i.id === editingId ? { ...i, ...form } : i
      ));
      setEditingId(null);
    } else {
      setData([...data, { id: Date.now(), ...form }]);
    }

    setForm({ name: "", note: "", active: true });
  };

  // ✏️ SỬA
  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
  };

  // ❌ XOÁ
  const handleDelete = (id) => {
    setData(data.filter(i => i.id !== id));
  };

  // 🔍 SEARCH
  const filtered = data.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="staff-page">
      <h2>🌐 Kênh bán hàng</h2>

      {/* TOOLBAR */}
      <div className="staff-toolbar">

        <input
          placeholder="Tên kênh..."
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Ghi chú..."
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm({ ...form, active: e.target.checked })
            }
          />
          Hoạt động
        </label>

        <button onClick={handleSave}>
          {editingId ? "✔ Lưu" : "+ Thêm"}
        </button>

        <input
          placeholder="🔍 Tìm kênh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search"
        />
      </div>

      {/* TABLE */}
      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên kênh</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.note}</td>
                <td>
                  <span className={item.active ? "active-tag" : "off-tag"}>
                    {item.active ? "Hoạt động" : "Tắt"}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(item)}>Sửa</button>
                  <button onClick={() => handleDelete(item.id)}>Xoá</button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="empty">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}