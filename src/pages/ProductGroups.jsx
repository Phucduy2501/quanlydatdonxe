import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function ProductGroups() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadGroups = async () => {
    try {
      const res = await apiGet("productGroups");
      setData(toArray(res));
    } catch (error) {
      console.log("Lỗi tải nhóm hàng:", error);
      setData([]);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên nhóm hàng");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      let res;

      if (editingId) {
        res = await apiUpdate("productGroups", editingId, payload);
      } else {
        res = await apiCreate("productGroups", payload);
      }

      if (res?.data || res?.message) {
        alert(editingId ? "✅ Đã cập nhật nhóm hàng" : "✅ Đã thêm nhóm hàng");
        resetForm();
        loadGroups();
      } else {
        alert("❌ Lỗi lưu nhóm hàng");
      }
    } catch (error) {
      console.log("Lỗi lưu nhóm hàng:", error);
      alert("❌ Lỗi lưu nhóm hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setName(item.name || "");
    setDescription(item.description || "");
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa nhóm hàng này?")) return;

    try {
      await apiDelete("productGroups", id);
      alert("✅ Đã xóa nhóm hàng");

      if (editingId === id) {
        resetForm();
      }

      loadGroups();
    } catch (error) {
      console.log("Lỗi xóa nhóm hàng:", error);
      alert("❌ Lỗi xóa nhóm hàng");
    }
  };

  const addQuickGroup = async (groupName) => {
    const exists = data.some(
      (item) => item.name?.toLowerCase() === groupName.toLowerCase()
    );

    if (exists) {
      alert(`Nhóm "${groupName}" đã tồn tại`);
      return;
    }

    try {
      await apiCreate("productGroups", {
        name: groupName,
        description: `Nhóm hàng ${groupName}`,
      });

      loadGroups();
    } catch (error) {
      console.log("Lỗi thêm nhanh nhóm hàng:", error);
      alert("❌ Lỗi thêm nhanh nhóm hàng");
    }
  };

  const filtered = data.filter((item) => {
    const text = `${item.name || ""} ${item.description || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>📦 Nhóm hàng hóa</h2>
          <p style={desc}>
            Quản lý nhóm sản phẩm như Dép sục, Sandal, Phụ kiện, Hàng khuyến mãi...
          </p>
        </div>

        <button onClick={loadGroups} style={btn}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={toolbar}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên nhóm hàng..."
          style={input}
        />

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ghi chú..."
          style={input}
        />

        <button onClick={handleSubmit} disabled={loading} style={btnPrimary}>
          {loading ? "Đang lưu..." : editingId ? "Cập nhật" : "+ Thêm"}
        </button>

        {editingId && (
          <button onClick={resetForm} style={btn}>
            Hủy sửa
          </button>
        )}

        <input
          placeholder="🔍 Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />
      </div>

      <div style={quickBox}>
        <span style={{ fontWeight: 700 }}>Thêm nhanh:</span>

        <button onClick={() => addQuickGroup("Dép sục")} style={quickBtn}>
          + Dép sục
        </button>

        <button onClick={() => addQuickGroup("Sandal")} style={quickBtn}>
          + Sandal
        </button>

        <button onClick={() => addQuickGroup("Phụ kiện")} style={quickBtn}>
          + Phụ kiện
        </button>

        <button onClick={() => addQuickGroup("Hàng khuyến mãi")} style={quickBtn}>
          + Hàng khuyến mãi
        </button>

        <button onClick={() => addQuickGroup("Khác")} style={quickBtn}>
          + Khác
        </button>
      </div>

      <div style={cardGrid}>
        <div style={card("#e3f2fd", "#2196f3")}>
          <p>Tổng nhóm</p>
          <h3>{data.length}</h3>
          <span>Tất cả nhóm hàng</span>
        </div>

        <div style={card("#e8f5e9", "#16a34a")}>
          <p>Đang hiển thị</p>
          <h3>{filtered.length}</h3>
          <span>Theo kết quả tìm kiếm</span>
        </div>
      </div>

      <div style={tableCard}>
        <div style={tableHeader}>
          <h3 style={{ margin: 0 }}>Danh sách nhóm hàng</h3>
          <span style={badge}>{filtered.length} nhóm</span>
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Tên nhóm</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Ngày tạo</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={empty}>
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>

                  <td style={td}>
                    <b>{item.name}</b>
                  </td>

                  <td style={td}>{item.description || "—"}</td>

                  <td style={td}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("vi-VN")
                      : "—"}
                  </td>

                  <td style={td}>
                    <button onClick={() => handleEdit(item)} style={editBtn}>
                      Sửa
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      style={deleteBtn}
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

/* STYLE */
const page = {
  padding: 24,
  background: "#f4f7fb",
  minHeight: "100vh",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const desc = {
  margin: "6px 0 0",
  color: "#6b7280",
};

const toolbar = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 12,
};

const input = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 220,
};

const searchInput = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 220,
  marginLeft: "auto",
};

const btn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

const btnPrimary = {
  padding: "9px 14px",
  border: "none",
  borderRadius: 8,
  background: "#2f43a3",
  color: "white",
  cursor: "pointer",
};

const quickBox = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  background: "white",
  padding: 12,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 16,
};

const quickBtn = {
  padding: "7px 12px",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontWeight: 600,
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const card = (bg, borderColor) => ({
  background: bg,
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  borderLeft: `5px solid ${borderColor}`,
});

const tableCard = {
  background: "white",
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  overflow: "hidden",
};

const tableHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
};

const badge = {
  background: "#eef2ff",
  color: "#2f43a3",
  padding: "5px 10px",
  borderRadius: 999,
  fontWeight: 600,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  background: "#2f43a3",
  color: "white",
  padding: 12,
  textAlign: "left",
};

const td = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
};

const empty = {
  padding: 30,
  textAlign: "center",
  color: "#6b7280",
};

const editBtn = {
  padding: "6px 10px",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: 6,
  marginRight: 6,
  cursor: "pointer",
};

const deleteBtn = {
  padding: "6px 10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};