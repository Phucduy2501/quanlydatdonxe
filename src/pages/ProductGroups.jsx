import { useState } from "react";

export default function ProductGroups() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // ✅ THÊM / UPDATE
  const handleSubmit = () => {
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

  // ✅ SỬA
  const handleEdit = (item) => {
    setName(item.name);
    setEditingId(item.id);
  };

  // ✅ XOÁ
  const handleDelete = (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    setData(data.filter(i => i.id !== id));
  };

  // ✅ TÌM KIẾM
  const filtered = data.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h2 className="title">📦 Nhóm hàng hóa</h2>

      {/* TOOLBAR */}
      <div className="toolbar">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên nhóm..."
        />

        <button className="btn-primary" onClick={handleSubmit}>
          {editingId ? "Cập nhật" : "+ Thêm"}
        </button>

        <input
          className="search"
          placeholder="🔍 Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên nhóm</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty">
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(item)}
                    >
                      Sửa
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(item.id)}
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