import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function PriceList() {
  const [priceList, setPriceList] = useState([]);
  const [products, setProducts] = useState([]);

  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadData = async () => {
    try {
      const priceRes = await apiGet("priceList");
      const productRes = await apiGet("products");

      setPriceList(toArray(priceRes));
      setProducts(toArray(productRes));
    } catch (error) {
      console.log("Lỗi tải bảng giá:", error);
      setPriceList([]);
      setProducts([]);
    }
  };

  const resetForm = () => {
    setProductId("");
    setPrice("");
    setNote("");
    setEditingId(null);
  };

  const getProductName = (id) => {
    const p = products.find((item) => String(item.id) === String(id));
    return p?.name || "Không tìm thấy sản phẩm";
  };

  const getProductSku = (id) => {
    const p = products.find((item) => String(item.id) === String(id));
    return p?.sku || "—";
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  const handleSave = async () => {
    if (!productId) {
      alert("Vui lòng chọn sản phẩm");
      return;
    }

    if (!price) {
      alert("Vui lòng nhập giá");
      return;
    }

    try {
      const payload = {
        product_id: Number(productId),
        price: Number(price || 0),
        note,
      };

      if (editingId) {
        await apiUpdate("priceList", editingId, payload);
        alert("✅ Cập nhật bảng giá thành công");
      } else {
        await apiCreate("priceList", payload);
        alert("✅ Thêm bảng giá thành công");
      }

      resetForm();
      loadData();
    } catch (error) {
      console.log("Lỗi lưu bảng giá:", error);
      alert("❌ Lỗi lưu bảng giá: " + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setProductId(item.product_id || item.productId || "");
    setPrice(item.price || "");
    setNote(item.note || "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá dòng bảng giá này?")) return;

    try {
      await apiDelete("priceList", id);
      alert("✅ Đã xoá");
      loadData();
    } catch (error) {
      console.log("Lỗi xoá bảng giá:", error);
      alert("❌ Lỗi xoá bảng giá");
    }
  };

  const filtered = priceList.filter((item) => {
    const productName = getProductName(item.product_id || item.productId);
    const sku = getProductSku(item.product_id || item.productId);

    const text = `${productName} ${sku} ${item.note || ""}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const totalValue = filtered.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>💰 Bảng giá</h2>
          <p style={desc}>
            Quản lý giá bán theo từng sản phẩm, dùng cho bán hàng và báo cáo.
          </p>
        </div>

        <button onClick={loadData} style={btn}>
          ⟳ Tải lại
        </button>
      </div>

      {/* SUMMARY */}
      <div style={cardGrid}>
        <div style={card("#e3f2fd", "#2563eb")}>
          <p>Tổng dòng giá</p>
          <h3>{priceList.length}</h3>
          <span>Số sản phẩm có bảng giá</span>
        </div>

        <div style={card("#e8f5e9", "#16a34a")}>
          <p>Tổng giá trị</p>
          <h3>{money(totalValue)}</h3>
          <span>Theo dữ liệu đang lọc</span>
        </div>

        <div style={card("#fff3e0", "#f59e0b")}>
          <p>Sản phẩm</p>
          <h3>{products.length}</h3>
          <span>Danh sách hàng hóa</span>
        </div>
      </div>

      {/* FORM */}
      <div style={toolbar}>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          style={input}
        >
          <option value="">-- Chọn sản phẩm --</option>

          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.sku ? `- ${p.sku}` : ""}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Nhập giá bán..."
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={input}
        />

        <input
          placeholder="Ghi chú / tên bảng giá..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={input}
        />

        <button onClick={handleSave} style={primaryBtn}>
          {editingId ? "Cập nhật" : "+ Thêm"}
        </button>

        {editingId && (
          <button onClick={resetForm} style={btn}>
            Hủy sửa
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm sản phẩm, SKU, ghi chú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />
      </div>

      {/* TABLE */}
      <div style={tableBox}>
        <div style={tableHeader}>
          <h3 style={{ margin: 0 }}>Danh sách bảng giá</h3>
          <span style={badge}>{filtered.length} dòng</span>
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>SKU</th>
              <th style={th}>Sản phẩm</th>
              <th style={th}>Giá bán</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={empty}>
                  Chưa có dữ liệu bảng giá
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={td}>{index + 1}</td>

                  <td style={td}>
                    {getProductSku(item.product_id || item.productId)}
                  </td>

                  <td style={td}>
                    <b>
                      {getProductName(item.product_id || item.productId)}
                    </b>
                  </td>

                  <td style={{ ...td, color: "#16a34a", fontWeight: 700 }}>
                    {money(item.price)}
                  </td>

                  <td style={td}>{item.note || "—"}</td>

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
  marginTop: 6,
  color: "#6b7280",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const card = (bg, border) => ({
  background: bg,
  borderLeft: `5px solid ${border}`,
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
});

const toolbar = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 14,
  background: "white",
  padding: 14,
  borderRadius: 10,
  boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
};

const input = {
  padding: 9,
  border: "1px solid #ccc",
  borderRadius: 6,
  minWidth: 220,
};

const searchInput = {
  padding: 9,
  border: "1px solid #ccc",
  borderRadius: 6,
  minWidth: 320,
};

const btn = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 6,
  background: "#2f43a3",
  color: "white",
  cursor: "pointer",
};

const tableBox = {
  background: "white",
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  overflow: "hidden",
};

const tableHeader = {
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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
  borderBottom: "1px solid #ddd",
};

const empty = {
  padding: 24,
  textAlign: "center",
  color: "#777",
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