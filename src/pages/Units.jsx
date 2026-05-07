import { useState } from "react";

export default function Units() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // ✅ THÊM / UPDATE
  const handleSubmit = () => {
    if (!name.trim()) return;

    if (editingId) {
      // update
      setData(data.map(i =>
        i.id === editingId ? { ...i, name } : i
      ));
      setEditingId(null);
    } else {
      // add
      setData([...data, { id: Date.now(), name }]);
    }

    setName("");
  };

  // ✅ EDIT
  const handleEdit = (item) => {
    setName(item.name);
    setEditingId(item.id);
  };

  // ✅ DELETE
  const handleDelete = (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    setData(data.filter(i => i.id !== id));
  };

  // ✅ SEARCH
  const filteredData = data.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h2>📏 Đơn vị tính</h2>

      {/* TOOLBAR */}
      <div className="toolbar">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên đơn vị..."
        />

        <button onClick={handleSubmit} className="btn-primary">
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
              <th>Đơn vị</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
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