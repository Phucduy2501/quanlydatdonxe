import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

export default function SalesMulti() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [channel, setChannel] = useState("POS")

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from("products").select("*")
    setProducts(data || [])
  }

  const add = (p) => {
    setCart(prev => {
      const f = prev.find(i => i.id === p.id)
      if (f) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...p, qty: 1 }]
    })
  }

  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0)

  const checkout = async () => {
    if (!cart.length) return alert("Chưa có hàng")

    const orderId = crypto.randomUUID()

    // order
    await supabase.from("orders").insert([{
      id: orderId,
      total,
      paid: total,
      debt: 0,
      channel // 👈 đa kênh
    }])

    // items
    await supabase.from("order_items").insert(
      cart.map(i => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: i.id,
        quantity: i.qty,
        price: i.price
      }))
    )

    // kho + log
    for (const i of cart) {
      await supabase.from("products")
        .update({ stock: (i.stock || 0) - i.qty })
        .eq("id", i.id)

      await supabase.from("inventory_logs").insert([{
        id: crypto.randomUUID(),
        product_id: i.id,
        type: "export",
        quantity: i.qty,
        note: `Bán (${channel})`
      }])
    }

    // quỹ
    await supabase.from("cashbook").insert([{
      id: crypto.randomUUID(),
      type: "thu",
      amount: total,
      note: `Bán hàng (${channel})`
    }])

    alert("✅ OK")
    setCart([])
  }

  return (
    <div className="misa-container">
      <h2>🛒 Bán hàng đa kênh</h2>

      <div style={{marginBottom:10}}>
        <b>Kênh:</b>{" "}
        <select value={channel} onChange={e=>setChannel(e.target.value)}>
          <option>POS</option>
          <option>Facebook</option>
          <option>Shopee</option>
          <option>TikTok</option>
        </select>
      </div>

      <div style={{display:"flex", gap:20}}>
        <div style={{flex:1}}>
          <h4>Sản phẩm</h4>
          {products.map(p=>(
            <div key={p.id}>
              {p.name} | {p.price?.toLocaleString()} | tồn: {p.stock ?? 0}
              <button onClick={()=>add(p)}>+</button>
            </div>
          ))}
        </div>

        <div style={{width:300}}>
          <h4>Giỏ hàng</h4>
          {cart.map(i=>(
            <div key={i.id}>{i.name} x {i.qty}</div>
          ))}
          <h3>Tổng: {total.toLocaleString()}</h3>
          <button onClick={checkout}>Thanh toán</button>
        </div>
      </div>
    </div>
  )
}