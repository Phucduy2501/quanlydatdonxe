import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import * as XLSX from "xlsx"

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [preview, setPreview] = useState([])
  const [excelData, setExcelData] = useState([])
  const [customers, setCustomers] = useState([])

  const [search, setSearch] = useState("")
  const [minDebt, setMinDebt] = useState("")
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchDebts()
    fetchCustomers()
  }, [])

  // ===== LOAD =====
  const fetchDebts = async () => {
    const { data } = await supabase
      .from("customer_debts")
      .select("*")
      .order("created_at", { ascending: false })

    setDebts(data || [])
  }

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*")
    setCustomers(data || [])
  }

  // ===== MONEY =====
  const parseMoney = (v) => {
    if (!v) return 0
    return Number(v.toString().replace(/[^0-9\-]/g, "")) || 0
  }

  const fm = (n) => (n || 0).toLocaleString()

  // ===== HIGHLIGHT =====
  const highlight = (text) => {
    if (!search) return text

    const regex = new RegExp(`(${search})`, "gi")
    const parts = text?.toString().split(regex)

    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} style={{ background: "yellow" }}>
          {p}
        </mark>
      ) : (
        p
      )
    )
  }

  // ===== IMPORT =====
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
        range: 7,
      })

      const mapped = json.map((row) => {
        const code = row["__EMPTY"]
        const name = row["__EMPTY_1"]

        const open = parseMoney(row["__EMPTY_5"])
        const inc = parseMoney(row["__EMPTY_6"])
        const dec = parseMoney(row["__EMPTY_7"])

        const cus = customers.find(
          (c) => String(c.code) === String(code)
        )

        return {
          id: crypto.randomUUID(),
          customer_code: code,
          customer_name: cus?.name || name,
          phone: cus?.phone || "",
          debt_open: open,
          debt_increase: inc,
          debt_decrease: dec,
          debt_end: open + inc - dec,
        }
      })

      setPreview(mapped)
      setExcelData(mapped)
    }

    reader.readAsArrayBuffer(file)
  }

  // ===== SAVE =====
  const handleSave = async () => {
    if (!excelData.length) return alert("Không có dữ liệu")

    await supabase.from("customer_debts").delete().neq("id", "")

    await supabase.from("customer_debts").insert(excelData)

    alert("✅ Lưu thành công")
    fetchDebts()
    setPreview([])
  }

  // ===== DELETE =====
  const handleDelete = async (id) => {
    if (!confirm("Xoá?")) return
    await supabase.from("customer_debts").delete().eq("id", id)
    fetchDebts()
  }

  // ===== UPDATE =====
  const handleUpdate = async () => {
    const d = editing

    await supabase
      .from("customer_debts")
      .update({
        debt_open: d.debt_open,
        debt_increase: d.debt_increase,
        debt_decrease: d.debt_decrease,
        debt_end: d.debt_open + d.debt_increase - d.debt_decrease,
      })
      .eq("id", d.id)

    alert("✅ Cập nhật")
    setEditing(null)
    fetchDebts()
  }

  // ===== FILTER =====
  const filtered = debts.filter((d) => {
    const s = search.toLowerCase()

    const matchText =
      d.customer_name?.toLowerCase().includes(s) ||
      d.customer_code?.toLowerCase().includes(s) ||
      d.phone?.includes(s)

    const matchMoney = minDebt
      ? d.debt_end >= Number(minDebt)
      : true

    return matchText && matchMoney
  })

  return (
    <div className="misa-container">
      <h2>💰 Công nợ khách hàng</h2>

      <div className="toolbar">
        <input type="file" onChange={handleFile} />
        <button onClick={handleSave}>💾 Lưu</button>

        {/* SEARCH */}
        <input
          placeholder="🔍 Tìm khách..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTER TIỀN */}
        <input
          placeholder="💰 > số tiền"
          value={minDebt}
          onChange={(e) => setMinDebt(e.target.value)}
        />
      </div>

      {/* PREVIEW */}
      {preview.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>Nợ đầu</th>
              <th>Tăng</th>
              <th>Giảm</th>
              <th>Nợ cuối</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i}>
                <td>{r.customer_code}</td>
                <td>{r.customer_name}</td>
                <td>{fm(r.debt_open)}</td>
                <td>{fm(r.debt_increase)}</td>
                <td>{fm(r.debt_decrease)}</td>
                <td style={{ color: "red" }}>{fm(r.debt_end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* DATA */}
      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>SĐT</th>
            <th>Nợ cuối</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((d) => (
            <tr key={d.id}>
              <td>{highlight(d.customer_code)}</td>
              <td>{highlight(d.customer_name)}</td>
              <td>{d.phone}</td>
              <td style={{ color: "red" }}>
                {fm(d.debt_end)}
              </td>

              <td>
                <button onClick={() => setEditing(d)}>✏️</button>
                <button onClick={() => handleDelete(d.id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* EDIT */}
      {editing && (
        <div className="modal">
          <div className="box">
            <h3>Sửa công nợ</h3>

            <input
              value={editing.debt_open}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  debt_open: Number(e.target.value),
                })
              }
            />

            <input
              value={editing.debt_increase}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  debt_increase: Number(e.target.value),
                })
              }
            />

            <input
              value={editing.debt_decrease}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  debt_decrease: Number(e.target.value),
                })
              }
            />

            <button onClick={handleUpdate}>💾 Lưu</button>
            <button onClick={() => setEditing(null)}>❌ Huỷ</button>
          </div>
        </div>
      )}
    </div>
  )
}