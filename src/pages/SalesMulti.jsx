import { useEffect, useState } from "react";
import { apiGet, apiCreateFullOrder } from "../services/api";

export default function SalesMulti() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [cart, setCart] = useState([]);
  const [channel, setChannel] = useState("POS");
  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");

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
      const customersData = await apiGet("customers");

      setProducts(toArray(productsData));
      setCustomers(toArray(customersData));
    } catch (error) {
      console.log("Lỗi tải dữ liệu bán hàng:", error);
      setProducts([]);
      setCustomers([]);
    }
  };

  const formatMoney = (num) =>
    Number(num || 0).toLocaleString("vi-VN");

  const addToCart = (product) => {
    if (Number(product.stock || 0) <= 0) {
      alert("Sản phẩm đã hết hàng");
      return;
    }

    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);

      if (exists) {
        if (Number(exists.qty) + 1 > Number(product.stock || 0)) {
          alert("Số lượng vượt quá tồn kho");
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: Number(item.qty) + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          stock: Number(product.stock || 0),
          unit: product.unit || "Cái",
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (productId, qty) => {
    const value = Number(qty);

    if (value <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;

        if (value > Number(item.stock || 0)) {
          alert("Số lượng vượt quá tồn kho");
          return item;
        }

        return {
          ...item,
          qty: value,
        };
      })
    );
  };

  const updatePrice = (productId, price) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, price: Number(price || 0) }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    if (!cart.length) return;
    if (!window.confirm("Xóa toàn bộ giỏ hàng?")) return;

    setCart([]);
    setPaidAmount(0);
    setNote("");
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  const debtAmount = Math.max(total - Number(paidAmount || 0), 0);

  const filteredProducts = products.filter((product) => {
    const text = `${product.name || ""} ${product.sku || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const checkout = async () => {
    if (!customerId) {
      alert("Vui lòng chọn khách hàng");
      return;
    }

    if (!cart.length) {
      alert("Chưa có sản phẩm trong giỏ hàng");
      return;
    }

    const payload = {
      customerId: Number(customerId),
      channel,
      paidAmount: Number(paidAmount || 0),
      paymentMethod,
      note,
      items: cart.map((item) => ({
        productId: Number(item.id),
        quantity: Number(item.qty),
        price: Number(item.price),
      })),
    };

    try {
      const res = await apiCreateFullOrder(payload);

      if (res?.data) {
        alert("✅ Thanh toán thành công, đã tạo đơn hàng");

        setCart([]);
        setPaidAmount(0);
        setNote("");

        await load();
      } else {
        alert(res?.message || "❌ Lỗi tạo đơn hàng");
      }
    } catch (error) {
      console.log("Lỗi thanh toán:", error);
      alert("❌ Lỗi thanh toán");
    }
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>🛒 Bán hàng đa kênh</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Tạo đơn nhanh, trừ kho tự động, ghi quỹ tiền và công nợ khách hàng.
          </p>
        </div>

        <button onClick={load} style={reloadBtn}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={topGrid}>
        <div style={controlCard}>
          <label style={label}>Kênh bán</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            style={input}
          >
            <option value="POS">POS</option>
            <option value="Facebook">Facebook</option>
            <option value="Shopee">Shopee</option>
            <option value="TikTok">TikTok</option>
          </select>
        </div>

        <div style={controlCard}>
          <label style={label}>Khách hàng</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={input}
          >
            <option value="">-- Chọn khách hàng --</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div style={controlCard}>
          <label style={label}>Phương thức thanh toán</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={input}
          >
            <option value="cash">Tiền mặt</option>
            <option value="bank">Chuyển khoản</option>
          </select>
        </div>
      </div>

      <div style={mainGrid}>
        {/* LEFT */}
        <div style={productSection}>
          <div style={sectionHeader}>
            <h3 style={{ margin: 0 }}>Sản phẩm</h3>

            <input
              placeholder="🔍 Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInput}
            />
          </div>

          <div style={productGrid}>
            {filteredProducts.map((product) => {
              const stock = Number(product.stock || 0);
              const isOut = stock <= 0;

              return (
                <div key={product.id} style={productCard}>
                  <div>
                    <h4 style={productName}>{product.name}</h4>
                    <p style={muted}>Mã: {product.sku || "Chưa có"}</p>
                    <p style={muted}>ĐVT: {product.unit || "Cái"}</p>
                  </div>

                  <div style={productBottom}>
                    <div>
                      <b style={{ color: "#1d4ed8" }}>
                        {formatMoney(product.price)} đ
                      </b>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: isOut ? "#dc2626" : "#16a34a",
                          fontWeight: 600,
                        }}
                      >
                        Tồn: {stock}
                      </p>
                    </div>

                    <button
                      disabled={isOut}
                      onClick={() => addToCart(product)}
                      style={{
                        ...addBtn,
                        opacity: isOut ? 0.5 : 1,
                        cursor: isOut ? "not-allowed" : "pointer",
                      }}
                    >
                      + Thêm
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div style={emptyBox}>Chưa có sản phẩm hoặc không tìm thấy</div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={cartSection}>
          <div style={sectionHeader}>
            <h3 style={{ margin: 0 }}>Giỏ hàng</h3>
            <button onClick={clearCart} style={clearBtn}>
              Xóa giỏ
            </button>
          </div>

          {cart.length === 0 && (
            <div style={emptyCart}>Chưa có sản phẩm trong giỏ</div>
          )}

          {cart.map((item) => (
            <div key={item.id} style={cartItem}>
              <div style={{ flex: 1 }}>
                <b>{item.name}</b>
                <p style={muted}>
                  Tồn: {item.stock} | ĐVT: {item.unit}
                </p>

                <div style={cartInputs}>
                  <input
                    type="number"
                    value={item.qty}
                    min="1"
                    onChange={(e) => updateQty(item.id, e.target.value)}
                    style={smallInput}
                  />

                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updatePrice(item.id, e.target.value)}
                    style={priceInput}
                  />
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <b>
                  {formatMoney(Number(item.qty) * Number(item.price))} đ
                </b>

                <br />

                <button
                  onClick={() => removeFromCart(item.id)}
                  style={removeBtn}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}

          <div style={summaryBox}>
            <div style={summaryRow}>
              <span>Tổng tiền</span>
              <b>{formatMoney(total)} đ</b>
            </div>

            <div style={summaryRow}>
              <span>Khách đã trả</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={paidInput}
              />
            </div>

            <div style={summaryRow}>
              <span>Còn nợ</span>
              <b style={{ color: debtAmount > 0 ? "#dc2626" : "#16a34a" }}>
                {formatMoney(debtAmount)} đ
              </b>
            </div>

            <textarea
              placeholder="Ghi chú đơn hàng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={noteInput}
            />

            <button onClick={checkout} style={checkoutBtn}>
              Thanh toán / Tạo đơn
            </button>
          </div>
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

const reloadBtn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

const topGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1.5fr 1fr",
  gap: 14,
  marginBottom: 18,
};

const controlCard = {
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const label = {
  display: "block",
  fontWeight: 700,
  marginBottom: 8,
};

const input = {
  width: "100%",
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 420px",
  gap: 18,
  alignItems: "start",
};

const productSection = {
  background: "white",
  padding: 16,
  borderRadius: 14,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const cartSection = {
  background: "white",
  padding: 16,
  borderRadius: 14,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  position: "sticky",
  top: 12,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const searchInput = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  width: 260,
};

const productGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
  gap: 14,
};

const productCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 165,
};

const productName = {
  margin: "0 0 6px",
  fontSize: 16,
};

const muted = {
  margin: "3px 0",
  color: "#6b7280",
  fontSize: 13,
};

const productBottom = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 12,
};

const addBtn = {
  background: "#2f43a3",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: 8,
};

const emptyBox = {
  gridColumn: "1 / -1",
  padding: 30,
  textAlign: "center",
  color: "#6b7280",
};

const emptyCart = {
  padding: 24,
  textAlign: "center",
  color: "#6b7280",
  background: "#f9fafb",
  borderRadius: 10,
};

const cartItem = {
  display: "flex",
  gap: 12,
  padding: "12px 0",
  borderBottom: "1px solid #e5e7eb",
};

const cartInputs = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const smallInput = {
  width: 70,
  padding: 7,
  border: "1px solid #d1d5db",
  borderRadius: 6,
};

const priceInput = {
  width: 120,
  padding: 7,
  border: "1px solid #d1d5db",
  borderRadius: 6,
};

const removeBtn = {
  marginTop: 8,
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "5px 9px",
  borderRadius: 6,
  cursor: "pointer",
};

const clearBtn = {
  background: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "7px 10px",
  cursor: "pointer",
};

const summaryBox = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "2px solid #e5e7eb",
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const paidInput = {
  width: 150,
  padding: 8,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  textAlign: "right",
};

const noteInput = {
  width: "100%",
  height: 70,
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  marginBottom: 12,
};

const checkoutBtn = {
  width: "100%",
  padding: 12,
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};