import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import * as XLSX from "xlsx"

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [preview, setPreview] = useState([])
  const [excelData, setExcelData] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDebts()
    fetchCustomers()
  }, [])

  const fetchDebts = async () => {
    const { data } = await supabase.from("customer_debts").select("*")
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

  // ===== IMPORT =====
  const handleFile = (e) => {
    if (!customers.length) {
      alert("⚠️ Chưa load khách hàng")
      return
    }

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

      if (!json.length) {
        alert("❌ Không đọc được file")
        return
      }

      console.log("ROW:", json[0])

      const mapped = json.map((row) => {
        // 👉 LẤY THEO INDEX CỘT
        const code = row["__EMPTY"]
        const name = row["__EMPTY_1"]

        const open = parseMoney(row["__EMPTY_5"])
        const inc = parseMoney(row["__EMPTY_6"])
        const dec = parseMoney(row["__EMPTY_7"])

        const cus = customers.find(
          (c) => String(c.code) === String(code)
        )

        const debt_end = open + inc - dec

        return {
          id: crypto.randomUUID(),
          customer_code: code || "",
          customer_name: cus?.name || name || "",
          phone: cus?.phone || "",

          debt_open: open,
          debt_increase: inc,
          debt_decrease: dec,
          debt_end,
        }
      })

      setExcelData(mapped)
      setPreview(mapped)
    }

    reader.readAsArrayBuffer(file)
  }

  // ===== SAVE =====
  const handleSave = async () => {
    if (!excelData.length) {
      alert("⚠️ Không có dữ liệu")
      return
    }

    setLoading(true)

    await supabase.from("customer_debts").delete().neq("id", "")

    const { error } = await supabase
      .from("customer_debts")
      .insert(excelData)

    if (error) {
      console.log(error)
      alert("❌ Lỗi lưu")
    } else {
      alert("✅ Lưu thành công")
      fetchDebts()
      setPreview([])
    }

    setLoading(false)
  }

  const fm = (n) => (n || 0).toLocaleString()

  return (
    <div className="misa-container">
      <h2>💰 Công nợ khách hàng</h2>

      <div className="toolbar">
        <input type="file" onChange={handleFile} />
        <button onClick={handleSave} disabled={loading}>
          💾 Lưu
        </button>
      </div>

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
                <td style={{ color: "red" }}>
                  {fm(r.debt_end)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>SĐT</th>
            <th>Nợ cuối</th>
          </tr>
        </thead>

        <tbody>
          {debts.map((d) => (
            <tr key={d.id}>
              <td>{d.customer_code}</td>
              <td>{d.customer_name}</td>
              <td>{d.phone}</td>
              <td style={{ color: "red" }}>
                {fm(d.debt_end)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}