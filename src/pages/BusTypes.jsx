import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function BusTypes() {
  const [busTypes, setBusTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    seat_count: "",
    description: "",
  });

  useEffect(() => {
    loadBusTypes();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadBusTypes = async () => {
    try {
      const res = await apiGet("busTypes");
      setBusTypes(toArray(res));
    } catch (error) {
      console.log("Lỗi tải loại xe:", error);
      setBusTypes([]);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      seat_count: "",
      description: "",
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Vui lòng nhập tên loại xe");
      return;
    }

    const payload = {
      name: form.name.trim(),
      seat_count: Number(form.seat_count || 0),
      description: form.description.trim(),
    };

    try {
      if (editing) {
        await apiUpdate("busTypes", editing.id, payload);
        alert("✅ Cập nhật loại xe thành công");
      } else {
        await apiCreate("busTypes", payload);
        alert("✅ Thêm loại xe thành công");
      }

      resetForm();
      await loadBusTypes();
    } catch (error) {
      console.log("Lỗi lưu loại xe:", error);
      alert(error.message || "Lỗi lưu dữ liệu");
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || "",
      seat_count: item.seat_count || "",
      description: item.description || "",
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa loại xe này?")) return;

    try {
      await apiDelete("busTypes", id);
      await loadBusTypes();
    } catch (error) {
      console.log("Lỗi xóa loại xe:", error);
      alert(error.message || "Lỗi xóa dữ liệu");
    }
  };

  const filtered = busTypes.filter((item) => {
    const text = [item.name, item.seat_count, item.description]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h2>🚐 Loại xe</h2>
          <p>Quản lý loại xe như ghế ngồi, limousine, giường nằm.</p>
        </div>

        <button onClick={loadBusTypes}>⟳ Tải lại</button>
      </div>

      <div className="toolbar">
        <input
          placeholder="Tên loại xe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Số ghế mặc định"
          type="number"
          value={form.seat_count}
          onChange={(e) => setForm({ ...form, seat_count: e.target.value })}
        />

        <input
          placeholder="Mô tả"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <button onClick={handleSave}>
          {editing ? "💾 Cập nhật" : "+ Thêm loại"}
        </button>

        {editing && <button onClick={resetForm}>Hủy</button>}
      </div>

      <div className="toolbar">
        <input
          placeholder="🔍 Tìm loại xe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 320 }}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên loại xe</th>
              <th>Số ghế</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">
                  Chưa có loại xe
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.seat_count || 0}</td>
                  <td>{item.description || "—"}</td>
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