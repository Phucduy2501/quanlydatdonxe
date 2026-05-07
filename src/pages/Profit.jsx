import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

export default function Profit() {
  const [orders, setOrders] = useState([])
  const [purchases, setPurchases] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: o } = await supabase.from("orders").select("*")
    const { data: p } = await supabase.from("purchase_items").select("*")
    const { data: e } = await supabase.from("expenses").select("*")

    setOrders(o || [])
    setPurchases(p || [])
    setExpenses(e || [])
  }

  const revenue = orders.reduce((s, i) => s + (i.total || 0), 0)
  const cost = purchases.reduce((s, i) => s + (i.cost || 0) * (i.quantity || 0), 0)
  const expense = expenses.reduce((s, i) => s + (i.amount || 0), 0)

  const profit = revenue - cost - expense

  const money = (n) => n.toLocaleString("vi-VN") + " đ"

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>📊 Lợi nhuận</h2>

      {/* CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
        gap: 15
      }}>

        {/* Doanh thu */}
        <div style={card("#e3f2fd")}>
          <p>Doanh thu</p>
          <h3>{money(revenue)}</h3>
        </div>

        {/* Nhập hàng */}
        <div style={card("#fff3e0")}>
          <p>Nhập hàng</p>
          <h3>{money(cost)}</h3>
        </div>

        {/* Chi phí */}
        <div style={card("#ffebee")}>
          <p>Chi phí</p>
          <h3>{money(expense)}</h3>
        </div>

        {/* Lợi nhuận */}
        <div style={{
          ...card(profit >= 0 ? "#e8f5e9" : "#ffebee"),
          border: "2px solid " + (profit >= 0 ? "green" : "red")
        }}>
          <p>Lợi nhuận</p>
          <h2 style={{ color: profit >= 0 ? "green" : "red" }}>
            {money(profit)}
          </h2>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ marginTop: 30 }}>
        <p>Tỷ lệ lợi nhuận</p>

        <div style={{
          height: 20,
          background: "#eee",
          borderRadius: 10,
          overflow: "hidden"
        }}>
          <div style={{
            width: revenue ? `${(profit / revenue) * 100}%` : "0%",
            background: profit >= 0 ? "green" : "red",
            height: "100%"
          }} />
        </div>
      </div>
    </div>
  )
}

/* STYLE CARD */
const card = (bg) => ({
  background: bg,
  padding: 15,
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
})