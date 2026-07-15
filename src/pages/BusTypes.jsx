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

  function toArray(res) {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  }

  async function loadBusTypes() {
    try {
      const res = await apiGet("busTypes");
      setBusTypes(toArray(res));
    } catch (error) {
      console.log("Lỗi tải loại xe:", error);
      setBusTypes([]);
    }
  }

  function resetForm() {
    setEditing(null);

    setForm({
      name: "",
      seat_count: "",
      description: "",
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert("Vui lòng nhập tên loại xe");
      return;
    }

    const name = form.name.trim();
    const seatCount = Number(form.seat_count || 0);
    const description = form.description.trim();

    const payload = {
      name: name,
      type_name: name,

      seat_count: seatCount,
      seats: seatCount,

      description: description,
      note: description,

      status: "active",
    };

    try {
      if (editing) {
        await apiUpdate("busTypes", editing.id, payload);
        alert("Đã cập nhật loại xe thành công");
      } else {
        await apiCreate("busTypes", payload);
        alert("Đã thêm loại xe thành công");
      }

      resetForm();
      await loadBusTypes();
    } catch (error) {
      console.log("Lỗi lưu loại xe:", error);
      alert(error.message || "Lỗi lưu dữ liệu");
    }
  }

  function handleEdit(item) {
    setEditing(item);

    setForm({
      name: item.name || item.type_name || "",
      seat_count: item.seat_count || item.seats || "",
      description: item.description || item.note || "",
    });
  }

  async function handleDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa loại xe này?")) return;

    try {
      await apiDelete("busTypes", id);
      await loadBusTypes();
    } catch (error) {
      console.log("Lỗi xóa loại xe:", error);
      alert(error.message || "Lỗi xóa dữ liệu");
    }
  }

  const filtered = busTypes.filter(function (item) {
    const text = [
      item.name,
      item.type_name,
      item.seat_count,
      item.seats,
      item.description,
      item.note,
      item.status,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>🚐 Loại xe</h2>
          <p style={desc}>Quản lý loại xe như ghế ngồi, limousine, giường nằm.</p>
        </div>

        <button onClick={loadBusTypes} style={btnLight}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={formBox}>
        <input
          placeholder="Tên loại xe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={input}
        />

        <input
          placeholder="Số ghế mặc định"
          type="number"
          value={form.seat_count}
          onChange={(e) => setForm({ ...form, seat_count: e.target.value })}
          style={input}
        />

        <input
          placeholder="Mô tả"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          style={input}
        />

        <button onClick={handleSave} style={btnPrimary}>
          {editing ? "💾 Cập nhật" : "+ Thêm loại"}
        </button>

        {editing && (
          <button onClick={resetForm} style={btnLight}>
            Hủy
          </button>
        )}
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm loại xe..."
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
              <th style={th}>Tên loại xe</th>
              <th style={th}>Số ghế</th>
              <th style={th}>Mô tả</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={empty}>
                  Chưa có loại xe
                </td>
              </tr>
            ) : (
              filtered.map(function (item, index) {
                return (
                  <tr key={item.id}>
                    <td style={td}>{index + 1}</td>
                    <td style={td}>{item.name || item.type_name || "—"}</td>
                    <td style={td}>{item.seat_count || item.seats || 0}</td>
                    <td style={td}>{item.description || item.note || "—"}</td>
                    <td style={td}>
                      <span style={badge(item.status)}>
                        {item.status === "inactive" ? "Tạm dừng" : "Hoạt động"}
                      </span>
                    </td>
                    <td style={td}>
                      <button
                        onClick={() => handleEdit(item)}
                        style={btnSmall}
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        style={btnDanger}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
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