import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import * as XLSX from "xlsx"

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const [newItem, setNewItem] = useState({
    name: "",
    stock: 0
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: p } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: l } = await supabase
      .from("inventory_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    setProducts(p || [])
    setLogs(l || [])
  }

  // ================= ADD =================
  const handleAdd = async () => {
    if (!newItem.name) return alert("Thiếu tên")

    await supabase.from("products").insert([{
      name: newItem.name,
      stock: Number(newItem.stock) || 0
    }])

    setShowAdd(false)
    setNewItem({ name: "", stock: 0 })
    load()
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Xoá sản phẩm?")) return
    await supabase.from("products").delete().eq("id", id)
    load()
  }

  // ================= UPDATE =================
  const handleUpdate = async () => {
    await supabase
      .from("products")
      .update({
        name: editing.name,
        stock: editing.stock
      })
      .eq("id", editing.id)

    setEditing(null)
    load()
  }

  // ================= IMPORT / EXPORT =================
  const change = async (p, type) => {
    const qty = Number(prompt("Số lượng?")) || 0
    if (!qty) return

    const newStock =
      type === "import"
        ? (p.stock || 0) + qty
        : (p.stock || 0) - qty

    await supabase.from("products")
      .update({ stock: newStock })
      .eq("id", p.id)

    await supabase.from("inventory_logs").insert([{
      id: crypto.randomUUID(),
      product_id: p.id,
      type,
      quantity: qty,
      note: type === "import" ? "Nhập kho" : "Xuất kho"
    }])

    load()
  }

  // ================= SEARCH =================
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  // ================= EXPORT =================
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(products)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inventory")
    XLSX.writeFile(wb, "kho.xlsx")
  }

  return (
    <div className="misa-container">
      <h2>📦 Kho</h2>

      {/* TOOLBAR */}
      <div className="toolbar">
        <input
          placeholder="🔍 Tìm sản phẩm..."
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={exportExcel}>📤 Xuất Excel</button>
        <button onClick={() => setShowAdd(true)}>➕ Thêm</button>
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Tồn</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.stock ?? 0}</td>
              <td>
                <button onClick={() => change(p, "import")}>📥 Nhập</button>
                <button onClick={() => change(p, "export")}>📤 Xuất</button>
                <button onClick={() => setEditing(p)}>✏️</button>
                <button onClick={() => handleDelete(p.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* LỊCH SỬ */}
      <h3>📜 Lịch sử</h3>
      <table>
        <thead>
          <tr>
            <th>Loại</th>
            <th>Số lượng</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id}>
              <td>{l.type}</td>
              <td>{l.quantity}</td>
              <td>{new Date(l.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL ADD */}
      {showAdd && (
        <div className="modal">
          <div className="modal-box">
            <h3>➕ Thêm sản phẩm</h3>
            <input
              placeholder="Tên"
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              placeholder="Tồn"
              type="number"
              onChange={e => setNewItem({ ...newItem, stock: e.target.value })}
            />

            <button onClick={handleAdd}>Lưu</button>
            <button onClick={() => setShowAdd(false)}>Huỷ</button>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {editing && (
        <div className="modal">
          <div className="modal-box">
            <h3>✏️ Sửa sản phẩm</h3>

            <input
              value={editing.name}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
            />

            <input
              type="number"
              value={editing.stock}
              onChange={e => setEditing({ ...editing, stock: e.target.value })}
            />

            <button onClick={handleUpdate}>Lưu</button>
            <button onClick={() => setEditing(null)}>Huỷ</button>
          </div>
        </div>
      )}
    </div>
  )
}