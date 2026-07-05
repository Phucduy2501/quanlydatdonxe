import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const [stockModal, setStockModal] = useState(null);
  const [stockType, setStockType] = useState("import");
  const [stockQty, setStockQty] = useState("");
  const [stockNote, setStockNote] = useState("");

  const emptyProduct = {
    name: "",
    sku: "",
    unit: "Cái",
    stock: 0,
    price: 0,
    cost_price: 0,
    min_stock: 10,
    max_stock: 500,
    expiry_date: "",
  };

  const [newItem, setNewItem] = useState(emptyProduct);

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
      const productsData = await apiGet("products");
      const logsData = await apiGet("inventory");

      const sortedProducts = toArray(productsData).sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });

      const sortedLogs = toArray(logsData).sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });

      setProducts(sortedProducts);
      setLogs(sortedLogs.slice(0, 50));
    } catch (error) {
      console.log("Lỗi tải dữ liệu kho:", error);
      setProducts([]);
      setLogs([]);
    }
  };

  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  const getProductName = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    return product?.name || "Không rõ sản phẩm";
  };

  const getStockStatus = (product) => {
    const stock = Number(product.stock || 0);
    const minStock = Number(product.min_stock || 0);
    const maxStock = Number(product.max_stock || 0);

    if (stock <= 0) {
      return {
        text: "Hết hàng",
        bg: "#fee2e2",
        color: "#dc2626",
      };
    }

    if (stock < minStock) {
      return {
        text: "Dưới tối thiểu",
        bg: "#ffedd5",
        color: "#ea580c",
      };
    }

    if (maxStock && stock > maxStock) {
      return {
        text: "Vượt tối đa",
        bg: "#fef9c3",
        color: "#ca8a04",
      };
    }

    return {
      text: "Ổn định",
      bg: "#dcfce7",
      color: "#15803d",
    };
  };

  const totalStock = products.reduce(
    (sum, item) => sum + Number(item.stock || 0),
    0
  );

  const totalValue = products.reduce(
    (sum, item) =>
      sum + Number(item.stock || 0) * Number(item.cost_price || item.price || 0),
    0
  );

  const lowStockCount = products.filter((p) => {
    return Number(p.stock || 0) < Number(p.min_stock || 0);
  }).length;

  const expiredCount = products.filter((p) => {
    if (!p.expiry_date) return false;
    return new Date(p.expiry_date) < new Date();
  }).length;

  const filtered = products.filter((product) => {
    const text = `${product.name || ""} ${product.sku || ""} ${
      product.unit || ""
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const handleAdd = async () => {
    if (!newItem.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }

    try {
      const payload = {
        name: newItem.name.trim(),
        sku: newItem.sku.trim(),
        unit: newItem.unit || "Cái",
        stock: Number(newItem.stock || 0),
        price: Number(newItem.price || 0),
        cost_price: Number(newItem.cost_price || 0),
        min_stock: Number(newItem.min_stock || 0),
        max_stock: Number(newItem.max_stock || 0),
        expiry_date: newItem.expiry_date || null,
      };

      const res = await apiCreate("products", payload);

      if (res?.data) {
        const product = res.data;

        if (Number(payload.stock) > 0) {
          await apiCreate("inventory", {
            product_id: product.id,
            type: "import",
            quantity: Number(payload.stock),
            note: "Tạo sản phẩm và nhập tồn ban đầu",
          });
        }

        alert("✅ Đã thêm sản phẩm");
        setShowAdd(false);
        setNewItem(emptyProduct);
        load();
      } else {
        alert(res?.message || "❌ Lỗi thêm sản phẩm");
      }
    } catch (error) {
      console.log("Lỗi thêm sản phẩm:", error);
      alert("❌ Lỗi thêm sản phẩm");
    }
  };

  const handleUpdate = async () => {
    if (!editing?.name?.trim()) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }

    try {
      const payload = {
        name: editing.name.trim(),
        sku: editing.sku || "",
        unit: editing.unit || "Cái",
        stock: Number(editing.stock || 0),
        price: Number(editing.price || 0),
        cost_price: Number(editing.cost_price || 0),
        min_stock: Number(editing.min_stock || 0),
        max_stock: Number(editing.max_stock || 0),
        expiry_date: editing.expiry_date || null,
      };

      await apiUpdate("products", editing.id, payload);

      alert("✅ Đã cập nhật sản phẩm");
      setEditing(null);
      load();
    } catch (error) {
      console.log("Lỗi cập nhật sản phẩm:", error);
      alert("❌ Lỗi cập nhật sản phẩm");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá sản phẩm này?")) return;

    try {
      await apiDelete("products", id);
      alert("✅ Đã xoá sản phẩm");
      load();
    } catch (error) {
      console.log("Lỗi xoá sản phẩm:", error);
      alert("❌ Lỗi xoá sản phẩm");
    }
  };

  const openStockModal = (product, type) => {
    setStockModal(product);
    setStockType(type);
    setStockQty("");
    setStockNote(type === "import" ? "Nhập kho" : "Xuất kho");
  };

  const saveStockChange = async () => {
    if (!stockModal) return;

    const qty = Number(stockQty || 0);

    if (qty <= 0) {
      alert("Vui lòng nhập số lượng hợp lệ");
      return;
    }

    const currentStock = Number(stockModal.stock || 0);

    if (stockType === "export" && qty > currentStock) {
      alert("Số lượng xuất không được lớn hơn tồn kho");
      return;
    }

    const newStock =
      stockType === "import" ? currentStock + qty : currentStock - qty;

    try {
      await apiUpdate("products", stockModal.id, {
        ...stockModal,
        stock: newStock,
      });

      await apiCreate("inventory", {
        product_id: stockModal.id,
        type: stockType,
        quantity: qty,
        note: stockNote || (stockType === "import" ? "Nhập kho" : "Xuất kho"),
      });

      alert(stockType === "import" ? "✅ Đã nhập kho" : "✅ Đã xuất kho");

      setStockModal(null);
      setStockQty("");
      setStockNote("");
      load();
    } catch (error) {
      console.log("Lỗi cập nhật kho:", error);
      alert("❌ Lỗi cập nhật kho");
    }
  };

  const exportExcel = () => {
    const rows = products.map((product) => ({
      "Mã SKU": product.sku || "",
      "Tên sản phẩm": product.name || "",
      "Đơn vị": product.unit || "",
      "Tồn kho": Number(product.stock || 0),
      "Giá bán": Number(product.price || 0),
      "Giá vốn": Number(product.cost_price || 0),
      "Tồn tối thiểu": Number(product.min_stock || 0),
      "Tồn tối đa": Number(product.max_stock || 0),
      "Hạn sử dụng": product.expiry_date || "",
      "Giá trị tồn":
        Number(product.stock || 0) *
        Number(product.cost_price || product.price || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Kho");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "kho-hang.xlsx");
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>📦 Kho hàng</h2>
          <p style={desc}>
            Quản lý tồn kho, nhập kho, xuất kho, cảnh báo tồn thấp và lịch sử kho.
          </p>
        </div>

        <button onClick={load} style={btn}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={cardGrid}>
        <div style={card("#e3f2fd", "#2196f3")}>
          <p>Tổng sản phẩm</p>
          <h3>{products.length}</h3>
          <span>Sản phẩm trong kho</span>
        </div>

        <div style={card("#e8f5e9", "#16a34a")}>
          <p>Tổng tồn</p>
          <h3>{totalStock}</h3>
          <span>Tổng số lượng tồn kho</span>
        </div>

        <div style={card("#fff3e0", "#ff9800")}>
          <p>Giá trị tồn</p>
          <h3>{money(totalValue)}</h3>
          <span>Tính theo giá vốn / giá bán</span>
        </div>

        <div style={card("#ffebee", "#ef4444")}>
          <p>Cảnh báo</p>
          <h3>{lowStockCount + expiredCount}</h3>
          <span>Tồn thấp / quá hạn</span>
        </div>
      </div>

      <div style={toolbar}>
        <input
          placeholder="🔍 Tìm sản phẩm theo tên, SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />

        <button onClick={exportExcel} style={btn}>
          📤 Xuất Excel
        </button>

        <button onClick={() => setShowAdd(true)} style={btnPrimary}>
          ➕ Thêm sản phẩm
        </button>
      </div>

      <div style={section}>
        <div style={sectionHeader}>
          <h3>Danh sách tồn kho</h3>
          <span style={badge}>{filtered.length} sản phẩm</span>
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Sản phẩm</th>
              <th style={th}>SKU</th>
              <th style={th}>ĐVT</th>
              <th style={th}>Tồn</th>
              <th style={th}>Min / Max</th>
              <th style={th}>Giá bán</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={empty}>
                  Chưa có sản phẩm trong kho
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const status = getStockStatus(product);

                return (
                  <tr key={product.id}>
                    <td style={td}>
                      <b>{product.name}</b>
                      {product.expiry_date && (
                        <>
                          <br />
                          <small>
                            HSD:{" "}
                            {new Date(product.expiry_date).toLocaleDateString(
                              "vi-VN"
                            )}
                          </small>
                        </>
                      )}
                    </td>

                    <td style={td}>{product.sku || "—"}</td>
                    <td style={td}>{product.unit || "Cái"}</td>

                    <td style={td}>
                      <b>{Number(product.stock || 0)}</b>
                    </td>

                    <td style={td}>
                      {Number(product.min_stock || 0)} /{" "}
                      {Number(product.max_stock || 0)}
                    </td>

                    <td style={td}>{money(product.price)}</td>

                    <td style={td}>
                      <span
                        style={{
                          ...statusBadge,
                          background: status.bg,
                          color: status.color,
                        }}
                      >
                        {status.text}
                      </span>
                    </td>

                    <td style={td}>
                      <button
                        onClick={() => openStockModal(product, "import")}
                        style={importBtn}
                      >
                        Nhập
                      </button>

                      <button
                        onClick={() => openStockModal(product, "export")}
                        style={exportBtn}
                      >
                        Xuất
                      </button>

                      <button onClick={() => setEditing(product)} style={editBtn}>
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(product.id)}
                        style={deleteBtn}
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

      <div style={section}>
        <div style={sectionHeader}>
          <h3>📜 Lịch sử kho</h3>
          <span style={badge}>{logs.length} dòng gần nhất</span>
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Sản phẩm</th>
              <th style={th}>Loại</th>
              <th style={th}>Số lượng</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Thời gian</th>
            </tr>
          </thead>

          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={empty}>
                  Chưa có lịch sử kho
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={td}>
                    {getProductName(log.product_id || log.productId)}
                  </td>

                  <td style={td}>
                    <span
                      style={{
                        ...statusBadge,
                        background:
                          log.type === "import" ? "#dcfce7" : "#fee2e2",
                        color: log.type === "import" ? "#15803d" : "#dc2626",
                      }}
                    >
                      {log.type === "import" ? "Nhập kho" : "Xuất kho"}
                    </span>
                  </td>

                  <td style={td}>{Number(log.quantity || 0)}</td>
                  <td style={td}>{log.note || "—"}</td>

                  <td style={td}>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3>➕ Thêm sản phẩm</h3>

            <div style={modalGrid}>
              <input
                placeholder="Tên sản phẩm"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                style={input}
              />

              <input
                placeholder="SKU"
                value={newItem.sku}
                onChange={(e) =>
                  setNewItem({ ...newItem, sku: e.target.value })
                }
                style={input}
              />

              <input
                placeholder="Đơn vị"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                placeholder="Tồn kho"
                value={newItem.stock}
                onChange={(e) =>
                  setNewItem({ ...newItem, stock: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                placeholder="Giá bán"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                placeholder="Giá vốn"
                value={newItem.cost_price}
                onChange={(e) =>
                  setNewItem({ ...newItem, cost_price: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                placeholder="Tồn tối thiểu"
                value={newItem.min_stock}
                onChange={(e) =>
                  setNewItem({ ...newItem, min_stock: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                placeholder="Tồn tối đa"
                value={newItem.max_stock}
                onChange={(e) =>
                  setNewItem({ ...newItem, max_stock: e.target.value })
                }
                style={input}
              />

              <input
                type="date"
                value={newItem.expiry_date}
                onChange={(e) =>
                  setNewItem({ ...newItem, expiry_date: e.target.value })
                }
                style={input}
              />
            </div>

            <div style={modalActions}>
              <button onClick={handleAdd} style={btnPrimary}>
                Lưu
              </button>

              <button onClick={() => setShowAdd(false)} style={btn}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div style={modalOverlay} onClick={() => setEditing(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Sửa sản phẩm</h3>

            <div style={modalGrid}>
              <input
                value={editing.name || ""}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                style={input}
              />

              <input
                value={editing.sku || ""}
                onChange={(e) =>
                  setEditing({ ...editing, sku: e.target.value })
                }
                style={input}
              />

              <input
                value={editing.unit || "Cái"}
                onChange={(e) =>
                  setEditing({ ...editing, unit: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                value={editing.stock || 0}
                onChange={(e) =>
                  setEditing({ ...editing, stock: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                value={editing.price || 0}
                onChange={(e) =>
                  setEditing({ ...editing, price: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                value={editing.cost_price || 0}
                onChange={(e) =>
                  setEditing({ ...editing, cost_price: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                value={editing.min_stock || 0}
                onChange={(e) =>
                  setEditing({ ...editing, min_stock: e.target.value })
                }
                style={input}
              />

              <input
                type="number"
                value={editing.max_stock || 0}
                onChange={(e) =>
                  setEditing({ ...editing, max_stock: e.target.value })
                }
                style={input}
              />

              <input
                type="date"
                value={editing.expiry_date || ""}
                onChange={(e) =>
                  setEditing({ ...editing, expiry_date: e.target.value })
                }
                style={input}
              />
            </div>

            <div style={modalActions}>
              <button onClick={handleUpdate} style={btnPrimary}>
                Lưu
              </button>

              <button onClick={() => setEditing(null)} style={btn}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {stockModal && (
        <div style={modalOverlay} onClick={() => setStockModal(null)}>
          <div style={smallModalBox} onClick={(e) => e.stopPropagation()}>
            <h3>{stockType === "import" ? "📥 Nhập kho" : "📤 Xuất kho"}</h3>

            <p>
              Sản phẩm: <b>{stockModal.name}</b>
            </p>

            <p>
              Tồn hiện tại: <b>{Number(stockModal.stock || 0)}</b>
            </p>

            <input
              type="number"
              placeholder="Số lượng"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              style={inputFull}
            />

            <input
              placeholder="Ghi chú"
              value={stockNote}
              onChange={(e) => setStockNote(e.target.value)}
              style={inputFull}
            />

            <div style={modalActions}>
              <button onClick={saveStockChange} style={btnPrimary}>
                Lưu
              </button>

              <button onClick={() => setStockModal(null)} style={btn}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
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

const toolbar = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
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

const btnPrimary = {
  padding: "9px 14px",
  border: "none",
  borderRadius: 8,
  background: "#2f43a3",
  color: "white",
  cursor: "pointer",
};

const section = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
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

const statusBadge = {
  padding: "5px 10px",
  borderRadius: 999,
  fontWeight: 700,
};

const importBtn = {
  padding: "6px 10px",
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 6,
  marginRight: 6,
  cursor: "pointer",
};

const exportBtn = {
  padding: "6px 10px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  marginRight: 6,
  cursor: "pointer",
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

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalBox = {
  width: 760,
  maxHeight: "90vh",
  overflowY: "auto",
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const smallModalBox = {
  width: 420,
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const input = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  width: "100%",
};

const inputFull = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  width: "100%",
  marginBottom: 10,
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 16,
};