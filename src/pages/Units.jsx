import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Units() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUnits();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadUnits = async () => {
    try {
      const res = await apiGet("units");
      setData(toArray(res));
    } catch (error) {
      console.log("Lỗi tải đơn vị tính:", error);
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
      alert("Vui lòng nhập tên đơn vị");
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
        res = await apiUpdate("units", editingId, payload);
      } else {
        res = await apiCreate("units", payload);
      }

      if (res?.data || res?.message) {
        alert(editingId ? "✅ Đã cập nhật đơn vị" : "✅ Đã thêm đơn vị");
        resetForm();
        loadUnits();
      } else {
        alert("❌ Lỗi lưu đơn vị");
      }
    } catch (error) {
      console.log("Lỗi lưu đơn vị:", error);
      alert("❌ Lỗi lưu đơn vị");
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
    if (!window.confirm("Bạn chắc chắn muốn xóa đơn vị này?")) return;

    try {
      await apiDelete("units", id);
      alert("✅ Đã xóa đơn vị");
      loadUnits();

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.log("Lỗi xóa đơn vị:", error);
      alert("❌ Lỗi xóa đơn vị");
    }
  };

  const addQuickUnit = async (unitName) => {
    const exists = data.some(
      (item) => item.name?.toLowerCase() === unitName.toLowerCase()
    );

    if (exists) {
      alert(`Đơn vị "${unitName}" đã tồn tại`);
      return;
    }

    try {
      await apiCreate("units", {
        name: unitName,
        description: `Đơn vị ${unitName}`,
      });

      loadUnits();
    } catch (error) {
      console.log("Lỗi thêm nhanh đơn vị:", error);
      alert("❌ Lỗi thêm nhanh đơn vị");
    }
  };

  const filteredData = data.filter((item) => {
    const text = `${item.name || ""} ${item.description || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>📏 Đơn vị tính</h2>
          <p style={desc}>
            Quản lý đơn vị hàng hóa như Cái, Thùng, Kg, Bao, Hộp...
          </p>
        </div>

        <button onClick={loadUnits} style={btn}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={toolbar}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên đơn vị, ví dụ: Thùng, Kg..."
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
        <span>Thêm nhanh:</span>

        <button onClick={() => addQuickUnit("Thùng")} style={quickBtn}>
          + Thùng
        </button>

        <button onClick={() => addQuickUnit("Kg")} style={quickBtn}>
          + Kg
        </button>

        <button onClick={() => addQuickUnit("Cái")} style={quickBtn}>
          + Cái
        </button>

        <button onClick={() => addQuickUnit("Hộp")} style={quickBtn}>
          + Hộp
        </button>

        <button onClick={() => addQuickUnit("Bao")} style={quickBtn}>
          + Bao
        </button>
      </div>

      <div style={tableCard}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Đơn vị</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Ngày tạo</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" style={empty}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
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

const tableCard = {
  background: "white",
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  overflow: "hidden",
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