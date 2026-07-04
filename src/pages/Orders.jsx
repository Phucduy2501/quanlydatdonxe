import { useEffect, useState } from "react";
import {
  apiGet,
  apiDelete,
  apiCreateFullOrder,
  apiUpdateFullOrder,
} from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const emptyForm = {
    customerId: "",
    channel: "POS",
    paidAmount: 0,
    paymentMethod: "cash",
    note: "",
    items: [
      {
        productId: "",
        quantity: 1,
        price: 0,
      },
    ],
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchOrders();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const fetchOrders = async () => {
    try {
      const ordersData = await apiGet("orders");
      const itemsData = await apiGet("orderItems");
      const productsData = await apiGet("products");
      const customersData = await apiGet("customers");

      setOrders(toArray(ordersData));
      setItems(toArray(itemsData));
      setProducts(toArray(productsData));
      setCustomers(toArray(customersData));
    } catch (error) {
      console.log("Lỗi tải đơn hàng:", error);
      setOrders([]);
      setItems([]);
      setProducts([]);
      setCustomers([]);
    }
  };

  const getOrderItems = (orderId) => {
    return items.filter(
      (item) => String(item.order_id || item.orderId) === String(orderId)
    );
  };

  const getProductName = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    return product?.name || "Sản phẩm";
  };

  const getProductUnit = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    return product?.unit || "Cái";
  };

  const getCustomerById = (customerId) => {
    return customers.find((c) => String(c.id) === String(customerId));
  };

  const handleView = (order) => {
    setSelected(order);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá đơn này?")) return;

    try {
      await apiDelete("orders", id);

      setSelected(null);
      fetchOrders();
    } catch (error) {
      console.log("Lỗi xoá đơn hàng:", error);
      alert("❌ Lỗi xoá đơn hàng");
    }
  };

  const openAddOrder = () => {
    setEditingOrder(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditOrder = (order) => {
    const orderItems = getOrderItems(order.id);

    setEditingOrder(order);

    setForm({
      customerId: order.customer_id || "",
      channel: order.channel || "POS",
      paidAmount: Number(order.paid_amount || 0),
      paymentMethod: "cash",
      note: order.note || "",
      items:
        orderItems.length > 0
          ? orderItems.map((item) => ({
              productId: item.product_id || item.productId || "",
              quantity: Number(item.quantity || 1),
              price: Number(item.price || 0),
            }))
          : [
              {
                productId: "",
                quantity: 1,
                price: 0,
              },
            ],
    });

    setShowForm(true);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];

    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    if (field === "productId") {
      const product = products.find((p) => String(p.id) === String(value));
      newItems[index].price = Number(product?.price || 0);
    }

    setForm({
      ...form,
      items: newItems,
    });
  };

  const addItemRow = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          productId: "",
          quantity: 1,
          price: 0,
        },
      ],
    });
  };

  const removeItemRow = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);

    setForm({
      ...form,
      items: newItems.length ? newItems : emptyForm.items,
    });
  };

  const formTotal = form.items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0) * Number(item.price || 0);
  }, 0);

  const saveOrder = async () => {
    if (!form.customerId) {
      alert("Vui lòng chọn khách hàng");
      return;
    }

    const validItems = form.items.filter(
      (item) => item.productId && Number(item.quantity) > 0
    );

    if (!validItems.length) {
      alert("Vui lòng chọn sản phẩm");
      return;
    }

    const payload = {
      customerId: Number(form.customerId),
      channel: form.channel,
      paidAmount: Number(form.paidAmount || 0),
      paymentMethod: form.paymentMethod,
      note: form.note,
      items: validItems.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
    };

    try {
      let res;

      if (editingOrder) {
        res = await apiUpdateFullOrder(editingOrder.id, payload);
      } else {
        res = await apiCreateFullOrder(payload);
      }

      if (res?.data) {
        alert(editingOrder ? "✅ Đã sửa đơn hàng" : "✅ Đã thêm đơn hàng");

        setShowForm(false);
        setEditingOrder(null);
        setForm(emptyForm);

        await fetchOrders();
      } else {
        alert(res?.message || "❌ Lỗi lưu đơn hàng");
      }
    } catch (error) {
      console.log("Lỗi lưu đơn hàng:", error);
      alert("❌ Lỗi lưu đơn hàng");
    }
  };

  const handlePrint = () => {
    if (!selected) return;

    const orderItems = getOrderItems(selected.id);
    const total = Number(selected.total || 0);
    const paidAmount = Number(selected.paid_amount || 0);
    const debtAmount = Number(selected.debt_amount || Math.max(total - paidAmount, 0));

    const customer = getCustomerById(selected.customer_id);

    const formatMoney = (num) =>
      Number(num || 0).toLocaleString("vi-VN") + ",00";

    const orderDate = selected.date
      ? new Date(selected.date).toLocaleDateString("vi-VN")
      : selected.created_at
      ? new Date(selected.created_at).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN");

    const orderTime = selected.created_at
      ? new Date(selected.created_at).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

    const w = window.open("", "_blank");

    w.document.write(`
      <html>
      <head>
        <title>Phiếu giao hàng</title>

        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: "Times New Roman", serif;
            color: #000;
            padding: 10px 20px;
            font-size: 18px;
          }

          .page {
            width: 100%;
            border-top: 4px double #000;
            padding-top: 10px;
          }

          h1 {
            text-align: center;
            font-size: 34px;
            margin: 10px 0 22px;
            font-weight: bold;
          }

          .info-row {
            display: grid;
            grid-template-columns: 1.3fr 0.8fr;
            gap: 30px;
            margin-bottom: 8px;
          }

          .info-left div,
          .info-right div {
            margin-bottom: 8px;
            font-size: 21px;
            font-weight: bold;
          }

          .label {
            display: inline-block;
            min-width: 150px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          .items-table th,
          .items-table td {
            border: 2px solid #000;
            padding: 7px 8px;
            font-size: 20px;
            line-height: 1.2;
          }

          .items-table th {
            text-align: center;
            font-weight: bold;
            font-size: 21px;
          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

          .note-total-row {
            display: grid;
            grid-template-columns: 1.35fr 0.9fr;
            border-left: 2px solid #000;
            border-right: 2px solid #000;
            border-bottom: 2px solid #000;
          }

          .note-box {
            border-right: 2px solid #000;
            padding: 8px;
            min-height: 110px;
            font-size: 21px;
            font-weight: bold;
          }

          .dot-line {
            border-bottom: 2px dotted #000;
            height: 30px;
            margin-top: 6px;
          }

          .total-box table td {
            border-bottom: 2px solid #000;
            padding: 6px 8px;
            font-size: 21px;
            font-weight: bold;
          }

          .total-box table tr:last-child td {
            border-bottom: none;
          }

          .money-text {
            border-left: 2px solid #000;
            border-right: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 6px 8px;
            text-align: right;
            font-size: 21px;
          }

          .debt-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            border-left: 2px solid #000;
            border-right: 2px solid #000;
            border-bottom: 2px solid #000;
            font-size: 21px;
            font-weight: bold;
          }

          .debt-row div {
            padding: 7px 8px;
          }

          .thanks {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            margin: 18px 0 20px;
          }

          .sign-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-top: 10px;
            text-align: center;
            font-size: 22px;
            font-weight: bold;
          }

          .sign-row span {
            display: block;
            font-size: 18px;
            font-weight: normal;
            margin-top: 5px;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="page">
          <h1>PHIẾU GIAO HÀNG</h1>

          <div class="info-row">
            <div class="info-left">
              <div><span class="label">Khách hàng:</span> ${
                customer?.name || "........................................"
              }</div>
              <div><span class="label">SĐT:</span> ${
                customer?.phone || "........................................"
              }</div>
              <div><span class="label">Địa chỉ:</span> ${
                customer?.address || "........................................"
              }</div>
            </div>

            <div class="info-right">
              <div>Ngày: ${orderDate} - ${orderTime}</div>
              <div>Số: ${selected.id}</div>
              <div>Thu ngân: Admin</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 55px;">STT</th>
                <th>Tên hàng hóa</th>
                <th style="width: 90px;">ĐVT</th>
                <th style="width: 75px;">SL</th>
                <th style="width: 90px;">ĐVC</th>
                <th style="width: 75px;">SL</th>
                <th style="width: 150px;">Đơn giá</th>
                <th style="width: 170px;">Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              ${
                orderItems.length > 0
                  ? orderItems
                      .map((i, index) => {
                        const quantity = Number(i.quantity || 0);
                        const price = Number(i.price || 0);
                        const productId = i.product_id || i.productId;
                        const name = getProductName(productId);
                        const unit = getProductUnit(productId);

                        return `
                          <tr>
                            <td class="center">${index + 1}</td>
                            <td>${name}</td>
                            <td class="center">${unit}</td>
                            <td class="right">${quantity}</td>
                            <td class="center"></td>
                            <td class="center"></td>
                            <td class="right">${formatMoney(price)}</td>
                            <td class="right">${formatMoney(quantity * price)}</td>
                          </tr>
                        `;
                      })
                      .join("")
                  : `
                    <tr>
                      <td class="center">1</td>
                      <td>Sản phẩm</td>
                      <td class="center">Cái</td>
                      <td class="right">1</td>
                      <td class="center"></td>
                      <td class="center"></td>
                      <td class="right">${formatMoney(total)}</td>
                      <td class="right">${formatMoney(total)}</td>
                    </tr>
                  `
              }
            </tbody>
          </table>

          <div class="note-total-row">
            <div class="note-box">
              Ghi chú giao hàng:
              <div class="dot-line">${selected.note || ""}</div>
              <div class="dot-line"></div>
            </div>

            <div class="total-box">
              <table>
                <tr>
                  <td>Tiền hàng</td>
                  <td class="right">${formatMoney(total)}đ</td>
                </tr>
                <tr>
                  <td>Tổng thanh toán</td>
                  <td class="right">${formatMoney(total)}đ</td>
                </tr>
                <tr>
                  <td>Ghi nợ</td>
                  <td class="right">${formatMoney(debtAmount)}đ</td>
                </tr>
                <tr>
                  <td>Còn phải thu</td>
                  <td class="right">${formatMoney(Math.max(total - paidAmount - debtAmount, 0))}đ</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="money-text">
            Số tiền viết bằng chữ: ..............................................................
          </div>

          <div class="debt-row">
            <div>Dư nợ trước: 0,00đ</div>
            <div>Nợ tăng: ${formatMoney(debtAmount)}đ</div>
            <div>Dư nợ sau: ${formatMoney(debtAmount)}đ</div>
          </div>

          <div class="thanks">
            Cảm ơn quý khách đã tin tưởng lựa chọn sản phẩm của cửa hàng!
          </div>

          <div class="sign-row">
            <div>
              Khách hàng
              <span>(Ký, họ tên)</span>
            </div>

            <div>
              Người lập
              <span>(Ký, họ tên)</span>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    w.document.close();
  };

  const filtered = orders.filter((order) => {
    const customer = getCustomerById(order.customer_id);

    const text = `${order.id || ""} ${order.channel || ""} ${
      order.date || ""
    } ${customer?.name || ""} ${customer?.phone || ""}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>📄 Đơn hàng</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="🔍 Tìm đơn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <button onClick={fetchOrders} style={btn}>
          Tải lại
        </button>

        <button onClick={openAddOrder} style={btnPrimary}>
          + Thêm đơn
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 2 }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Khách hàng</th>
                <th style={th}>Tổng</th>
                <th style={th}>Đã trả</th>
                <th style={th}>Còn nợ</th>
                <th style={th}>Kênh</th>
                <th style={th}>Ngày</th>
                <th style={th}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((order) => {
                const customer = getCustomerById(order.customer_id);

                return (
                  <tr key={order.id}>
                    <td style={td}>{String(order.id).slice(0, 8)}</td>

                    <td style={td}>
                      {customer?.name || "Khách lẻ"}
                      <br />
                      <small>{customer?.phone || ""}</small>
                    </td>

                    <td style={td}>
                      {Number(order.total || 0).toLocaleString("vi-VN")} đ
                    </td>

                    <td style={td}>
                      {Number(order.paid_amount || 0).toLocaleString("vi-VN")} đ
                    </td>

                    <td style={td}>
                      {Number(order.debt_amount || 0).toLocaleString("vi-VN")} đ
                    </td>

                    <td style={td}>{order.channel || "POS"}</td>

                    <td style={td}>
                      {order.date
                        ? new Date(order.date).toLocaleDateString("vi-VN")
                        : order.created_at
                        ? new Date(order.created_at).toLocaleString("vi-VN")
                        : ""}
                    </td>

                    <td style={td}>
                      <button onClick={() => handleView(order)}>👁</button>{" "}
                      <button onClick={() => openEditOrder(order)}>✏️</button>{" "}
                      <button onClick={() => handleDelete(order.id)}>🗑</button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ ...td, textAlign: "center" }}>
                    Chưa có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={detailBox}>
          <h3>Chi tiết</h3>

          {!selected && <p>Chọn đơn</p>}

          {selected && (
            <>
              <p>
                <b>ID:</b> {selected.id}
              </p>

              <p>
                <b>Khách:</b>{" "}
                {getCustomerById(selected.customer_id)?.name || "Khách lẻ"}
              </p>

              <p>
                <b>Tổng:</b>{" "}
                {Number(selected.total || 0).toLocaleString("vi-VN")} đ
              </p>

              <p>
                <b>Đã trả:</b>{" "}
                {Number(selected.paid_amount || 0).toLocaleString("vi-VN")} đ
              </p>

              <p>
                <b>Còn nợ:</b>{" "}
                {Number(selected.debt_amount || 0).toLocaleString("vi-VN")} đ
              </p>

              <hr />

              <h4>Sản phẩm</h4>

              {getOrderItems(selected.id).length > 0 ? (
                getOrderItems(selected.id).map((item) => {
                  const productId = item.product_id || item.productId;
                  const quantity = Number(item.quantity || 0);
                  const price = Number(item.price || 0);

                  return (
                    <div key={item.id} style={{ marginBottom: 8 }}>
                      <b>{getProductName(productId)}</b>
                      <br />
                      SL: {quantity} | Giá:{" "}
                      {price.toLocaleString("vi-VN")} đ
                    </div>
                  );
                })
              ) : (
                <p>Đơn này chưa có sản phẩm chi tiết</p>
              )}

              <button onClick={handlePrint} style={printBtn}>
                🖨 In đơn
              </button>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div style={modalOverlay} onClick={() => setShowForm(false)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3>{editingOrder ? "✏️ Sửa đơn hàng" : "➕ Thêm đơn hàng"}</h3>

            <label>Khách hàng</label>
            <select
              value={form.customerId}
              onChange={(e) =>
                setForm({ ...form, customerId: e.target.value })
              }
              style={inputFull}
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.phone}
                </option>
              ))}
            </select>

            <label>Kênh bán</label>
            <input
              value={form.channel}
              onChange={(e) =>
                setForm({ ...form, channel: e.target.value })
              }
              style={inputFull}
            />

            <h4>Sản phẩm</h4>

            {form.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 0.7fr 1fr 40px",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <select
                  value={item.productId}
                  onChange={(e) =>
                    updateItem(index, "productId", e.target.value)
                  }
                  style={inputFull}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} | Tồn: {p.stock} | Giá:{" "}
                      {Number(p.price || 0).toLocaleString("vi-VN")} đ
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="SL"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                  style={inputFull}
                />

                <input
                  type="number"
                  placeholder="Giá"
                  value={item.price}
                  onChange={(e) =>
                    updateItem(index, "price", e.target.value)
                  }
                  style={inputFull}
                />

                <button onClick={() => removeItemRow(index)}>X</button>
              </div>
            ))}

            <button onClick={addItemRow} style={btn}>
              + Thêm sản phẩm
            </button>

            <div style={{ marginTop: 12, marginBottom: 10 }}>
              <b>Tổng tiền: {formTotal.toLocaleString("vi-VN")} đ</b>
            </div>

            <label>Khách đã trả</label>
            <input
              type="number"
              value={form.paidAmount}
              onChange={(e) =>
                setForm({ ...form, paidAmount: e.target.value })
              }
              style={inputFull}
            />

            <div style={{ marginBottom: 10 }}>
              <b>
                Còn nợ:{" "}
                {Math.max(
                  formTotal - Number(form.paidAmount || 0),
                  0
                ).toLocaleString("vi-VN")}{" "}
                đ
              </b>
            </div>

            <label>Phương thức thanh toán</label>
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              style={inputFull}
            >
              <option value="cash">Tiền mặt</option>
              <option value="bank">Chuyển khoản</option>
            </select>

            <label>Ghi chú</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={{ ...inputFull, height: 70 }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button onClick={saveOrder} style={btnPrimary}>
                💾 Lưu đơn
              </button>

              <button onClick={() => setShowForm(false)} style={btn}>
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
const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
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

const input = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  minWidth: 220,
};

const detailBox = {
  width: 340,
  background: "#fff",
  padding: 15,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const printBtn = {
  marginTop: 10,
  padding: "8px 12px",
  background: "#2f3e9e",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const btn = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
};

const btnPrimary = {
  padding: "8px 12px",
  background: "#2f43a3",
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

const inputFull = {
  width: "100%",
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  margin: "6px 0 10px",
};