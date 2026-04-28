import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import * as XLSX from "xlsx"

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [excelData, setExcelData] = useState([])
  const [preview, setPreview] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [newCus, setNewCus] = useState({
    code: "",
    name: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    ward: ""
  })

  const inputStyle = {
  width: "100%",
  padding: 8,
  border: "1px solid #ddd",
  borderRadius: 6,
  marginBottom: 10
}

const btnSave = {
  background: "#2ecc71",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: 6,
  cursor: "pointer"
}

const btnCancel = {
  background: "#e74c3c",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: 6,
  cursor: "pointer"
}

  // ================= LOAD =================
  useEffect(() => {
    fetchCustomers()
  }, [])




  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })

    setCustomers(data || [])
  }

  // ================= NORMALIZE =================
  const normalize = (str) =>
    str
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")

  const get = (row, keywords = []) => {
    const keys = Object.keys(row)

    for (let k of keys) {
      const nk = normalize(k)

      for (let kw of keywords) {
        const nkw = normalize(kw)

        if (
          nk.includes(nkw) ||
          nkw.includes(nk) ||
          (nk.includes("sdt") && nkw.includes("dien"))
        ) {
          return row[k]
        }
      }
    }
    return ""
  }

  // ================= DATE =================
  const formatDate = (v) => {
    if (!v) return null

    if (typeof v === "string" && v.includes("/")) {
      let [m, d, y] = v.split("/")
      if (y.length === 2) y = "19" + y
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    }

    const d = new Date(v)
    if (isNaN(d)) return null
    return d.toISOString().split("T")[0]
  }

  // ================= IMPORT =================
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result)
      const wb = XLSX.read(data, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
        range: 3,
      })

      const mapped = json.map((row, i) => ({
        index: i + 1,
        code: get(row, ["ma khach"]),
        name: get(row, ["ten khach"]),
        phone: get(row, ["dien thoai", "sdt", "tel"]),
        email: get(row, ["email"]),
        address: get(row, ["dia chi"]),
        province: get(row, ["tinh"]),
        district: get(row, ["quan"]),
        ward: get(row, ["phuong"]),
        birthday: get(row, ["ngay sinh"]),
        raw: row,
      }))

      setExcelData(mapped)
      setPreview(mapped)
    }

    reader.readAsArrayBuffer(file)
  }

  // ================= SAVE =================
  const handleSave = async () => {
    if (!excelData.length) return alert("Không có dữ liệu")

    setLoading(true)

    const clean = excelData.map((v) => ({
      id: crypto.randomUUID(),
      code: v.code || "",
      name: v.name || "",
      phone: v.phone || "",
      email: v.email || "",
      address: v.address || "",
      province: v.province || "",
      district: v.district || "",
      ward: v.ward || "",
      birthday: formatDate(v.birthday) || null,
    }))

    const { error } = await supabase.from("customers").insert(clean)

    if (error) {
      console.log(error)
      alert("❌ Lỗi insert")
    } else {
      alert("✅ Lưu thành công")
      await fetchCustomers()
    }

    setLoading(false)
  }

  // ================= ADD =================
  const handleAdd = async () => {
    if (!newCus.name) return alert("Thiếu tên")
    if (!newCus.phone) return alert("Thiếu SĐT")

    const { error } = await supabase.from("customers").insert([
      {
        name: newCus.name,
        phone: newCus.phone,
        address: newCus.address
      }
    ])

    if (error) {
      alert("Lỗi insert")
      console.log(error)
      return
    }

    alert("Thêm thành công")

    setShowAdd(false)
    setNewCus({ name: "", phone: "", address: "" })

    fetchCustomers() // reload lại list
  }


  const handleDelete = async (id) => {
  if (!confirm("Xoá khách này?")) return

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)

  if (error) {
    alert("❌ Lỗi xoá")
    console.log(error)
    return
  }

  fetchCustomers()
}



  const handleUpdate = async () => {
  const { error } = await supabase
    .from("customers")
    .update({
      name: editing.name,
      phone: editing.phone,
      address: editing.address,
      province: editing.province,
      district: editing.district,
      ward: editing.ward
    })
    .eq("id", editing.id)

  if (error) {
    alert("❌ Lỗi update")
    console.log(error)
    return
  }

  alert("✅ Cập nhật thành công")
  setEditing(null)
  fetchCustomers()
}

  // ================= SEARCH =================
  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  // ================= EXPORT =================
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Customers")
    XLSX.writeFile(wb, "customers.xlsx")
  }

  return (
    <div className="misa-container">
      <h2>👤 Quản lý khách hàng</h2>

      <div className="toolbar">
        <input placeholder="🔍 Tìm..." onChange={(e) => setSearch(e.target.value)} />
        <input type="file" onChange={handleFile} />

        <button onClick={handleSave} disabled={loading}>
          💾 Lưu
        </button>

        <button onClick={exportExcel}>📤 Xuất</button>

        <button onClick={() => setShowAdd(true)}>➕ Thêm</button>
      </div>

      {/* PREVIEW */}
      {preview.length > 0 && (
        <div>
          <h4>Preview ({preview.length})</h4>
          <table>
            <thead>
              <tr>
                {Object.keys(preview[0].raw).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>
                  {Object.values(r.raw).map((v, idx) => (
                    <td key={idx}>{v}</td>
                  ))}
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
            <th>Địa chỉ</th>
            <th>Tỉnh</th>
            <th>Quận</th>
            <th>Phường</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.name}</td>
              <td>{c.phone}</td>
              <td>{c.address}</td>
              <td>{c.province}</td>
              <td>{c.district}</td>
              <td>{c.ward}</td>
              <td>
                <button onClick={() => setEditing(c)}>✏️</button>
                <button onClick={() => handleDelete(c.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
          onClick={() => setShowAdd(false)} // click ngoài để đóng
        >
          <div
            onClick={(e) => e.stopPropagation()} // chặn click xuyên
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: 420,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}
          >
            <h3 style={{ marginBottom: 15 }}>➕ Thêm khách hàng</h3>

            {/* MÃ */}
            <input
              placeholder="Mã khách"
              value={newCus.code}
              onChange={(e) =>
                setNewCus({ ...newCus, code: e.target.value })
              }
              style={inputStyle}
            />

            {/* TÊN */}
            <input
              placeholder="Tên khách *"
              value={newCus.name}
              autoFocus
              onChange={(e) =>
                setNewCus({ ...newCus, name: e.target.value })
              }
              style={inputStyle}
            />

            {/* SĐT */}
            <input
              placeholder="SĐT *"
              value={newCus.phone}
              onChange={(e) =>
                setNewCus({ ...newCus, phone: e.target.value })
              }
              style={inputStyle}
            />

            {/* ĐỊA CHỈ */}
            <input
              placeholder="Địa chỉ"
              value={newCus.address}
              onChange={(e) =>
                setNewCus({ ...newCus, address: e.target.value })
              }
              style={inputStyle}
            />

            {/* TỈNH */}
            <input
              placeholder="Tỉnh"
              value={newCus.province}
              onChange={(e) =>
                setNewCus({ ...newCus, province: e.target.value })
              }
              style={inputStyle}
            />

            {/* QUẬN */}
            <input
              placeholder="Quận"
              value={newCus.district}
              onChange={(e) =>
                setNewCus({ ...newCus, district: e.target.value })
              }
              style={inputStyle}
            />

            {/* PHƯỜNG */}
            <input
              placeholder="Phường"
              value={newCus.ward}
              onChange={(e) =>
                setNewCus({ ...newCus, ward: e.target.value })
              }
              style={inputStyle}
            />

            {/* BUTTON */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 15
              }}
            >
              <button style={btnSave} onClick={handleAdd}>
                💾 Lưu
              </button>

              <button
                style={btnCancel}
                onClick={() => setShowAdd(false)}
              >
                ❌ Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: 420
            }}
          >
            <h3>✏️ Sửa khách hàng</h3>

            <input
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
              style={inputStyle}
            />

            <input
              value={editing.phone}
              onChange={(e) =>
                setEditing({ ...editing, phone: e.target.value })
              }
              style={inputStyle}
            />

            <input
              value={editing.address}
              onChange={(e) =>
                setEditing({ ...editing, address: e.target.value })
              }
              style={inputStyle}
            />

            <input
              value={editing.province}
              onChange={(e) =>
                setEditing({ ...editing, province: e.target.value })
              }
              style={inputStyle}
            />

            <input
              value={editing.district}
              onChange={(e) =>
                setEditing({ ...editing, district: e.target.value })
              }
              style={inputStyle}
            />

            <input
              value={editing.ward}
              onChange={(e) =>
                setEditing({ ...editing, ward: e.target.value })
              }
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnSave} onClick={handleUpdate}>
                💾 Lưu
              </button>

              <button style={btnCancel} onClick={() => setEditing(null)}>
                ❌ Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}