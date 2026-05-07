import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

export default function PriceList() {
  const [lists, setLists] = useState([])
  const [selected, setSelected] = useState(null)

  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])

  const [name, setName] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadLists()
    loadProducts()
  }, [])

  // ================= LOAD =================
  const loadLists = async () => {
    const { data, error } = await supabase
      .from("price_lists")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) setLists(data || [])
  }

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*")
    setProducts(data || [])
  }

  const loadItems = async (listId) => {
    const { data } = await supabase
      .from("price_list_items")
      .select("*, products(name)")
      .eq("price_list_id", listId)

    setItems(data || [])
  }

  // ================= ADD LIST =================
  const addList = async () => {
    if (!name) return alert("Nhập tên bảng giá")

    const { error } = await supabase.from("price_lists").insert([
      { name }
    ])

    if (error) {
      alert("Lỗi: " + error.message)
      return
    }

    setName("")
    loadLists()
  }

  // ================= SELECT =================
  const selectList = (l) => {
    setSelected(l)
    loadItems(l.id)
  }

  // ================= ADD PRODUCT =================
  const addItem = async (p) => {
    const price = p._price

    if (!price) return alert("Nhập giá")

    const { error } = await supabase.from("price_list_items").insert([
      {
        price_list_id: selected.id,
        product_id: p.id,
        price: Number(price),
      },
    ])

    if (error) {
      alert("Lỗi: " + error.message)
      return
    }

    loadItems(selected.id)
  }

  // ================= UPDATE PRICE =================
  const updatePrice = async (item) => {
    const newPrice = prompt("Sửa giá:", item.price)
    if (!newPrice) return

    await supabase
      .from("price_list_items")
      .update({ price: Number(newPrice) })
      .eq("id", item.id)

    loadItems(selected.id)
  }

  // ================= DELETE =================
  const removeItem = async (id) => {
    if (!confirm("Xóa sản phẩm?")) return

    await supabase.from("price_list_items").delete().eq("id", id)
    loadItems(selected.id)
  }

  const removeList = async (id) => {
    if (!confirm("Xóa bảng giá?")) return

    await supabase.from("price_lists").delete().eq("id", id)
    setSelected(null)
    loadLists()
  }

  // ================= FILTER =================
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <h2>💰 Bảng giá</h2>

      {/* ADD LIST */}
      <div className="toolbar">
        <input
          placeholder="Tên bảng giá..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={addList}>+ Thêm</button>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        
        {/* LEFT */}
        <div style={{ width: 220 }}>
          {lists.map((l) => (
            <div
              key={l.id}
              className={`list-item ${
                selected?.id === l.id ? "active" : ""
              }`}
              onClick={() => selectList(l)}
            >
              {l.name}
              <span
                style={{ color: "red", float: "right" }}
                onClick={(e) => {
                  e.stopPropagation()
                  removeList(l.id)
                }}
              >
                x
              </span>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        {selected && (
          <div style={{ flex: 1 }}>
            <h3>{selected.name}</h3>

            {/* SEARCH */}
            <input
              placeholder="🔍 Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* PRODUCTS */}
            <div style={{ marginTop: 10 }}>
              {filteredProducts.map((p) => (
                <div key={p.id} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                  <span style={{ flex: 1 }}>{p.name}</span>

                  <input
                    placeholder="Giá"
                    style={{ width: 100 }}
                    onChange={(e) => (p._price = e.target.value)}
                  />

                  <button onClick={() => addItem(p)}>+ Thêm</button>
                </div>
              ))}
            </div>

            {/* TABLE */}
            <table style={{ marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Giá</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.products?.name}</td>
                    <td>{i.price}</td>
                    <td>
                      <button onClick={() => updatePrice(i)}>Sửa</button>
                      <button onClick={() => removeItem(i.id)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}