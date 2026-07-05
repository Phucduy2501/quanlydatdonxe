import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiDelete } from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadProducts = async () => {
    try {
      const res = await apiGet("products");
      setProducts(toArray(res));
    } catch (error) {
      console.log("Lỗi tải sản phẩm:", error);
      setProducts([]);
    }
  };

  const addProduct = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }

    try {
      await apiCreate("products", {
        name: name.trim(),
        price: Number(price || 0),
        stock: 0,
        sku: "",
        unit: "Cái",
        min_stock: 10,
        max_stock: 500,
      });

      alert("✅ Đã thêm sản phẩm");

      setName("");
      setPrice("");
      loadProducts();
    } catch (error) {
      console.log("Lỗi thêm sản phẩm:", error);
      alert(error.message || "Lỗi thêm sản phẩm");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;

    try {
      await apiDelete("products", id);
      loadProducts();
    } catch (error) {
      console.log("Lỗi xóa sản phẩm:", error);
      alert("Lỗi xóa sản phẩm");
    }
  };

  const filtered = products.filter((p) =>
    `${p.name || ""} ${p.sku || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 Sản phẩm</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          placeholder="Tên sản phẩm..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />

        <input
          type="number"
          placeholder="Giá"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={input}
        />

        <button onClick={addProduct} style={btnPrimary}>
          + Thêm
        </button>
      </div>

      <input
        placeholder="🔍 Tìm sản phẩm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...input, marginBottom: 14, width: 260 }}
      />

      <table style={table}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Tên</th>
            <th style={th}>Giá</th>
            <th style={th}>Tồn</th>
            <th style={th}>Hành động</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="5" style={empty}>
                Chưa có sản phẩm
              </td>
            </tr>
          ) : (
            filtered.map((p, index) => (
              <tr key={p.id}>
                <td style={td}>{index + 1}</td>
                <td style={td}>{p.name}</td>
                <td style={td}>
                  {Number(p.price || 0).toLocaleString("vi-VN")} đ
                </td>
                <td style={td}>{Number(p.stock || 0)}</td>
                <td style={td}>
                  <button onClick={() => deleteProduct(p.id)} style={btnDelete}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const input = {
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
};

const btnPrimary = {
  padding: "8px 14px",
  background: "#2f43a3",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const btnDelete = {
  padding: "6px 10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
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
  padding: 20,
  textAlign: "center",
  color: "#777",
};