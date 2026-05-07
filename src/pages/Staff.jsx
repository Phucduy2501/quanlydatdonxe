import { useState } from "react";

export default function Staff() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // ➕ THÊM / SỬA
  const handleAdd = () => {
    if (!name.trim()) return;

    if (editingId) {
      setData(data.map(i =>
        i.id === editingId ? { ...i, name } : i
      ));
      setEditingId(null);
    } else {
      setData([...data, { id: Date.now(), name }]);
    }

    setName("");
  };

  // ✏️ SỬA
  const handleEdit = (item) => {
    setName(item.name);
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
      <h2>👨‍💼 Nhân viên</h2>

      {/* TOOLBAR */}
      <div className="staff-toolbar">

        {/* INPUT THÊM */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên nhân viên..."
        />

        <button onClick={handleAdd}>
          {editingId ? "✔ Lưu" : "+ Thêm"}
        </button>

        {/* SEARCH */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Tìm nhân viên..."
          className="search"
        />
      </div>

      {/* TABLE */}
      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên nhân viên</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan="3" className="empty">
                  Không có dữ liệu
                </td>
              </tr>
            )}

            {filtered.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>Sửa</button>
                  <button onClick={() => handleDelete(item.id)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}