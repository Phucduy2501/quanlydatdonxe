import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    setOrders(data || [])
  }

  const fetchItems = async (orderId) => {
    const { data } = await supabase
      .from("order_items")
      .select(`
        *,
        products(name)
      `)
      .eq("order_id", orderId)

    setItems(data || [])
  }

  const handleView = async (o) => {
    setSelected(o)
    await fetchItems(o.id)
  }

  const handleDelete = async (id) => {
    if (!confirm("Xoá đơn này?")) return

    await supabase.from("order_items").delete().eq("order_id", id)
    await supabase.from("orders").delete().eq("id", id)

    fetchOrders()
    setSelected(null)
  }

  // 🖨 IN HÓA ĐƠN
  const handlePrint = () => {
    if (!selected) return

    const w = window.open("", "_blank")

    w.document.write(`
    <html>
    <head>
      <title>Hóa đơn</title>
      <style>
        body {
          font-family: Arial;
          padding: 30px;
        }

        h1 {
          text-align: center;
          margin-bottom: 10px;
        }

        .row {
          margin-bottom: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th, td {
          border: 1px solid #000;
          padding: 6px;
          font-size: 14px;
        }

        th {
          background: #f2f2f2;
        }

        .right {
          text-align: right;
        }

        .center {
          text-align: center;
        }

        .no-border td {
          border: none;
        }

        .total {
          font-weight: bold;
        }
      </style>
    </head>

    <body>

      <h1>HÓA ĐƠN BÁN LẺ</h1>

      <div class="row">Họ tên khách hàng: ....................................................</div>
      <div class="row">Địa chỉ: .................................................................</div>

      <table>
        <tr>
          <th>STT</th>
          <th>Tên hàng hóa</th>
          <th>ĐVT</th>
          <th>Số lượng</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
        </tr>

        ${items.map((i, index) => `
          <tr>
            <td class="center">${index + 1}</td>
            <td>${i.products?.name || "Sản phẩm"}</td>
            <td class="center">Cái</td>
            <td class="center">${i.quantity}</td>
            <td class="right">${i.price.toLocaleString()}</td>
            <td class="right">${(i.quantity * i.price).toLocaleString()}</td>
          </tr>
        `).join("")}

        <tr>
          <td colspan="5" class="right total">CỘNG</td>
          <td class="right total">${selected.total.toLocaleString()}</td>
        </tr>
      </table>

      <br/>

      <div class="row">
        Cộng thành tiền (viết bằng chữ): ..................................................
      </div>

      <br/><br/>

      <table class="no-border">
        <tr>
          <td class="center">Người mua hàng</td>
          <td class="center">Người bán hàng</td>
        </tr>
        <tr>
          <td class="center">(Ký, ghi rõ họ tên)</td>
          <td class="center">(Ký, ghi rõ họ tên)</td>
        </tr>
      </table>

      <script>
        window.print()
      </script>

    </body>
    </html>
    `)

    w.document.close()
  }

  const filtered = orders.filter(o =>
    o.id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: 20 }}>
      <h2>📄 Đơn hàng</h2>

      {/* SEARCH */}
      <input
        placeholder="🔍 Tìm đơn..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={input}
      />

      <div style={{ display: "flex", gap: 20 }}>

        {/* LIST */}
        <div style={{ flex: 2 }}>
          <table style={table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tổng</th>
                <th>Kênh</th>
                <th>Ngày</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>{o.id.slice(0, 6)}</td>
                  <td>{o.total?.toLocaleString()}</td>
                  <td>{o.channel || "POS"}</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>

                  <td>
                    <button onClick={() => handleView(o)}>👁</button>
                    <button onClick={() => handleDelete(o.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DETAIL */}
        <div style={detailBox}>
          <h3>Chi tiết</h3>

          {!selected && <p>Chọn đơn</p>}

          {selected && (
            <>
              <p><b>ID:</b> {selected.id}</p>
              <p><b>Tổng:</b> {selected.total?.toLocaleString()} đ</p>

              <hr/>

              {items.map(i => (
                <div key={i.id}>
                  SL: {i.quantity} | {i.price.toLocaleString()}
                </div>
              ))}

              <button onClick={handlePrint} style={printBtn}>
                🖨 In đơn
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

/* STYLE */
const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff"
}

const input = {
  padding: 8,
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #ccc"
}

const detailBox = {
  width: 320,
  background: "#fff",
  padding: 15,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
}

const printBtn = {
  marginTop: 10,
  padding: "8px 12px",
  background: "#2f3e9e",
  color: "#fff",
  border: "none",
  borderRadius: 6
}