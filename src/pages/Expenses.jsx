import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Expenses() {
  const [data, setData] = useState([]);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const load = async () => {
    try {
      const res = await apiGet("expenses");
      setData(toArray(res));
    } catch (error) {
      console.log("Lỗi tải chi phí:", error);
      setData([]);
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  const resetForm = () => {
    setAmount("");
    setNote("");
    setCategory("");
    setEditingId(null);
  };

  const saveExpense = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!category) {
      alert("Vui lòng chọn danh mục chi phí");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: category,
        amount: Number(amount),
        category,
        note,
      };

      let res;

      if (editingId) {
        res = await apiUpdate("expenses", editingId, payload);
      } else {
        res = await apiCreate("expenses", payload);
      }

      if (res?.data || res?.message) {
        alert(editingId ? "✅ Đã cập nhật chi phí" : "✅ Đã thêm chi phí");
        resetForm();
        load();
      } else {
        alert("❌ Lỗi lưu chi phí");
      }
    } catch (error) {
      console.log("Lỗi lưu chi phí:", error);
      alert("❌ Lỗi lưu chi phí");
    } finally {
      setLoading(false);
    }
  };

  const editExpense = (item) => {
    setEditingId(item.id);
    setAmount(item.amount || "");
    setCategory(item.category || item.name || "");
    setNote(item.note || "");
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá chi phí này?")) return;

    try {
      await apiDelete("expenses", id);
      alert("✅ Đã xoá chi phí");

      if (editingId === id) {
        resetForm();
      }

      load();
    } catch (error) {
      console.log("Lỗi xoá chi phí:", error);
      alert("❌ Lỗi xoá chi phí");
    }
  };

  const filtered = data.filter((item) => {
    const text = `${item.note || ""} ${item.category || ""} ${item.name || ""}`.toLowerCase();

    const matchSearch = text.includes(search.toLowerCase());

    const matchCategory =
      filterCategory === "all"
        ? true
        : (item.category || item.name) === filterCategory;

    return matchSearch && matchCategory;
  });

  const today = new Date().toDateString();

  const totalToday = data
    .filter((item) => {
      if (!item.created_at) return false;
      return new Date(item.created_at).toDateString() === today;
    })
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const now = new Date();

  const totalMonth = data
    .filter((item) => {
      if (!item.created_at) return false;

      const d = new Date(item.created_at);

      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalAll = data.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const categoryMap = {};

  data.forEach((item) => {
    const key = item.category || item.name || "Khác";
    categoryMap[key] = (categoryMap[key] || 0) + Number(item.amount || 0);
  });

  const categoryRows = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: totalAll > 0 ? (amount / totalAll) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const exportExcel = () => {
    const rows = filtered.map((item) => ({
      "Số tiền": Number(item.amount || 0),
      "Danh mục": item.category || item.name || "",
      "Ghi chú": item.note || "",
      "Ngày": item.created_at
        ? new Date(item.created_at).toLocaleString("vi-VN")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Chi phí");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "chi-phi.xlsx");
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>💸 Chi phí</h2>
          <p style={desc}>
            Quản lý chi phí vận hành, marketing, ăn uống, nhập phụ phí và các khoản phát sinh.
          </p>
        </div>

        <button onClick={load} style={btn}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={cardGrid}>
        <div style={card("#e3f2fd", "#2196f3")}>
          <p>Hôm nay</p>
          <h3>{money(totalToday)}</h3>
          <span>Tổng chi trong ngày</span>
        </div>

        <div style={card("#fff3e0", "#ff9800")}>
          <p>Tháng này</p>
          <h3>{money(totalMonth)}</h3>
          <span>Tổng chi trong tháng</span>
        </div>

        <div style={card("#ffebee", "#f44336")}>
          <p>Tổng chi phí</p>
          <h3>{money(totalAll)}</h3>
          <span>Tất cả khoản chi</span>
        </div>

        <div style={card("#e8f5e9", "#16a34a")}>
          <p>Số phiếu chi</p>
          <h3>{data.length}</h3>
          <span>Tổng số dòng chi phí</span>
        </div>
      </div>

      <div style={formBox}>
        <input
          type="number"
          placeholder="Số tiền..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={input}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={input}
        >
          <option value="">Chọn danh mục</option>
          <option value="Ăn uống">Ăn uống</option>
          <option value="Vận hành">Vận hành</option>
          <option value="Marketing">Marketing</option>
          <option value="Vận chuyển">Vận chuyển</option>
          <option value="Mặt bằng">Mặt bằng</option>
          <option value="Lương nhân viên">Lương nhân viên</option>
          <option value="Khác">Khác</option>
        </select>

        <input
          placeholder="Ghi chú..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={input}
        />

        <button onClick={saveExpense} disabled={loading} style={primaryBtn}>
          {loading ? "Đang lưu..." : editingId ? "Cập nhật" : "+ Thêm"}
        </button>

        {editingId && (
          <button onClick={resetForm} style={btn}>
            Hủy sửa
          </button>
        )}
      </div>

      <div style={filterBox}>
        <input
          placeholder="🔍 Tìm theo ghi chú / danh mục..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={input}
        >
          <option value="all">Tất cả danh mục</option>
          <option value="Ăn uống">Ăn uống</option>
          <option value="Vận hành">Vận hành</option>
          <option value="Marketing">Marketing</option>
          <option value="Vận chuyển">Vận chuyển</option>
          <option value="Mặt bằng">Mặt bằng</option>
          <option value="Lương nhân viên">Lương nhân viên</option>
          <option value="Khác">Khác</option>
        </select>

        <button onClick={exportExcel} style={btn}>
          Xuất Excel
        </button>
      </div>

      <div style={mainGrid}>
        <div style={section}>
          <div style={sectionHeader}>
            <h3>Danh sách chi phí</h3>
            <span style={badge}>{filtered.length} dòng</span>
          </div>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Tiền</th>
                <th style={th}>Danh mục</th>
                <th style={th}>Ghi chú</th>
                <th style={th}>Ngày</th>
                <th style={th}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={empty}>
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id}>
                    <td style={td}>{index + 1}</td>

                    <td style={td}>
                      <b>{money(item.amount)}</b>
                    </td>

                    <td style={td}>
                      <span style={categoryBadge}>
                        {item.category || item.name || "Khác"}
                      </span>
                    </td>

                    <td style={td}>{item.note || "—"}</td>

                    <td style={td}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("vi-VN")
                        : "—"}
                    </td>

                    <td style={td}>
                      <button onClick={() => editExpense(item)} style={editBtn}>
                        Sửa
                      </button>

                      <button
                        onClick={() => deleteExpense(item.id)}
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

        <div style={sideBox}>
          <h3>📊 Chi phí theo danh mục</h3>

          {categoryRows.length === 0 ? (
            <p style={{ color: "#6b7280" }}>Chưa có dữ liệu</p>
          ) : (
            categoryRows.map((row) => (
              <div key={row.name} style={categoryRow}>
                <div style={categoryTop}>
                  <b>{row.name}</b>
                  <span>{money(row.amount)}</span>
                </div>

                <div style={progressBg}>
                  <div
                    style={{
                      ...progressBar,
                      width: `${Math.min(row.percent, 100)}%`,
                    }}
                  />
                </div>

                <small>{row.percent.toFixed(1)}%</small>
              </div>
            ))
          )}
        </div>
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

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const card = (bg, borderColor) => ({
  background: bg,
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  borderLeft: `5px solid ${borderColor}`,
});

const formBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 12,
};

const filterBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const input = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 170,
};

const searchInput = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 260,
  flex: 1,
};

const btn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "9px 14px",
  border: "none",
  borderRadius: 8,
  background: "#2f43a3",
  color: "white",
  cursor: "pointer",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: 18,
  alignItems: "start",
};

const section = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const sideBox = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  position: "sticky",
  top: 12,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
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
  padding: 10,
  textAlign: "left",
};

const td = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
};

const empty = {
  padding: 30,
  textAlign: "center",
  color: "#6b7280",
};

const categoryBadge = {
  background: "#eef2ff",
  color: "#2f43a3",
  padding: "5px 10px",
  borderRadius: 999,
  fontWeight: 600,
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

const categoryRow = {
  marginBottom: 14,
};

const categoryTop = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 6,
};

const progressBg = {
  height: 10,
  background: "#e5e7eb",
  borderRadius: 999,
  overflow: "hidden",
};

const progressBar = {
  height: "100%",
  background: "#2f43a3",
  borderRadius: 999,
};