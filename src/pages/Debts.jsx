import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import * as XLSX from "xlsx"

export default function Debts() {
  const [data, setData] = useState([])
  const [excelData, setExcelData] = useState([])
  const [preview, setPreview] = useState([])
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    setData(data || [])
  }

  // ================= HELPER =================
  const normalize = (str) =>
    str
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")

  const get = (row, keywords = []) => {
    for (let k in row) {
      const nk = normalize(k)
      for (let kw of keywords) {
        if (nk.includes(normalize(kw))) return row[k]
      }
    }
    return ""
  }

  // ================= IMPORT EXCEL =================
  const handleFile = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
        range: 6, // ✅ FIX HEADER
      })

      const mapped = json.map((row, i) => {
        const open = Number(get(row, ["no dau ky"])) || 0
        const inc = Number(get(row, ["tang"])) || 0
        const dec = Number(get(row, ["giam"])) || 0

        return {
          index: i + 1,
          code: get(row, ["ma khach"]),
          name: get(row, ["ten khach"]),
          phone: get(row, ["dien thoai"]),
          email: get(row, ["email"]),
          group_name: get(row, ["nhom"]),
          address: get(row, ["dia chi"]),
          province: get(row, ["tinh"]),
          district: get(row, ["quan"]),
          ward: get(row, ["phuong"]),

          debt_open: open,
          debt_increase: inc,
          debt_decrease: dec,
          debt_end: open + inc - dec,
        }
      })

      setExcelData(mapped)
      setPreview(mapped)
    }

    reader.readAsArrayBuffer(file)
  }

  // ================= SAVE (UPDATE) =================
  const handleSave = async () => {
    for (let v of excelData) {
      if (!v.code) continue

      const { error } = await supabase
        .from("customers")
        .update({
          name: v.name,
          phone: v.phone,
          email: v.email,
          address: v.address,
          province: v.province,
          district: v.district,
          ward: v.ward,
          group_name: v.group_name,
          debt_open: v.debt_open,
          debt_increase: v.debt_increase,
          debt_decrease: v.debt_decrease,
          debt_end: v.debt_end,
        })
        .eq("code", v.code)

      if (error) console.log("Lỗi:", v, error)
    }

    alert("✅ Cập nhật công nợ thành công")
    fetchData()
  }

  // ================= ADD =================
  const handleAdd = async () => {
    if (!form.code) return alert("Thiếu mã khách")

    const debt_end =
      (form.debt_open || 0) +
      (form.debt_increase || 0) -
      (form.debt_decrease || 0)

    const { error } = await supabase
      .from("customers")
      .update({ ...form, debt_end })
      .eq("code", form.code)

    if (error) return alert("❌ Lỗi")

    setShowAdd(false)
    setForm({})
    fetchData()
  }

  // ================= UPDATE =================
  const handleUpdate = async () => {
    const debt_end =
      (editing.debt_open || 0) +
      (editing.debt_increase || 0) -
      (editing.debt_decrease || 0)

    const { error } = await supabase
      .from("customers")
      .update({ ...editing, debt_end })
      .eq("id", editing.id)

    if (error) return alert("❌ Lỗi update")

    setEditing(null)
    fetchData()
  }

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Xoá?")) return
    await supabase.from("customers").delete().eq("id", id)
    fetchData()
  }

  const filtered = data.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="misa-container">
      <h2>💰 Công nợ khách hàng</h2>

      <div className="toolbar">
        <input placeholder="🔍 Tìm..." onChange={(e) => setSearch(e.target.value)} />
        <input type="file" onChange={handleFile} />
        <button onClick={handleSave}>💾 Import công nợ</button>
        <button onClick={() => setShowAdd(true)}>➕ Thêm</button>
      </div>

      {/* PREVIEW */}
      {preview.length > 0 && (
        <div>
          <h4>Preview ({preview.length})</h4>
          <table>
            <tbody>
              {preview.map((r) => (
                <tr key={r.index}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.debt_end}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>SĐT</th>
            <th>Nợ đầu</th>
            <th>Tăng</th>
            <th>Giảm</th>
            <th>Nợ cuối</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.name}</td>
              <td>{c.phone}</td>
              <td>{c.debt_open}</td>
              <td>{c.debt_increase}</td>
              <td>{c.debt_decrease}</td>
              <td style={{ color: "red" }}>{c.debt_end}</td>

              <td>
                <button onClick={() => setEditing(c)}>✏️</button>
                <button onClick={() => handleDelete(c.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>➕ Thêm công nợ</h3>

            <input placeholder="Mã KH" onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input placeholder="Tên" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="SĐT" onChange={(e) => setForm({ ...form, phone: e.target.value })} />

            <input placeholder="Nợ đầu" onChange={(e) => setForm({ ...form, debt_open: Number(e.target.value) })} />
            <input placeholder="Tăng" onChange={(e) => setForm({ ...form, debt_increase: Number(e.target.value) })} />
            <input placeholder="Giảm" onChange={(e) => setForm({ ...form, debt_decrease: Number(e.target.value) })} />

            <button onClick={handleAdd}>💾 Lưu</button>
            <button onClick={() => setShowAdd(false)}>❌</button>
          </div>
        </div>
      )}

      {/* EDIT */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>✏️ Sửa</h3>

            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />

            <input value={editing.debt_open} onChange={(e) => setEditing({ ...editing, debt_open: Number(e.target.value) })} />
            <input value={editing.debt_increase} onChange={(e) => setEditing({ ...editing, debt_increase: Number(e.target.value) })} />
            <input value={editing.debt_decrease} onChange={(e) => setEditing({ ...editing, debt_decrease: Number(e.target.value) })} />

            <button onClick={handleUpdate}>💾</button>
            <button onClick={() => setEditing(null)}>❌</button>
          </div>
        </div>
      )}
    </div>
  )
}