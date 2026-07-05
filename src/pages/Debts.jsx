import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [preview, setPreview] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [minDebt, setMinDebt] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadDebts();
    loadCustomers();
  }, []);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  // ================= LOAD DATA =================
  const loadDebts = async () => {
    try {
      const res = await apiGet("customerDebts");

      const arr = toArray(res);

      const sorted = [...arr].sort((a, b) => {
        const da = new Date(a.created_at || a.createdAt || 0);
        const db = new Date(b.created_at || b.createdAt || 0);
        return db - da;
      });

      setDebts(sorted);
    } catch (error) {
      console.log("Lỗi tải công nợ:", error);
      setDebts([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiGet("customers");
      setCustomers(toArray(res));
    } catch (error) {
      console.log("Lỗi tải khách hàng:", error);
      setCustomers([]);
    }
  };

  // ================= MONEY =================
  const parseMoney = (v) => {
    if (!v) return 0;
    return Number(v.toString().replace(/[^0-9-]/g, "")) || 0;
  };

  const fm = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  const calcDebtEnd = (d) => {
    return (
      Number(d.debt_open || 0) +
      Number(d.debt_increase || 0) -
      Number(d.debt_decrease || 0)
    );
  };

  // ================= IMPORT EXCEL =================
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
        range: 7,
      });

      const mapped = json
        .map((row) => {
          const code =
            row["__EMPTY"] ||
            row["Mã"] ||
            row["Mã khách"] ||
            row["Mã khách hàng"] ||
            "";

          const name =
            row["__EMPTY_1"] ||
            row["Tên"] ||
            row["Tên khách"] ||
            row["Tên khách hàng"] ||
            "";

          const open = parseMoney(row["__EMPTY_5"] || row["Nợ đầu"]);
          const inc = parseMoney(row["__EMPTY_6"] || row["Nợ tăng"]);
          const dec = parseMoney(row["__EMPTY_7"] || row["Nợ giảm"]);

          const cus = customers.find(
            (c) => String(c.code) === String(code)
          );

          return {
            customer_code: code,
            customer_name: cus?.name || name,
            phone: cus?.phone || "",
            debt_open: open,
            debt_increase: inc,
            debt_decrease: dec,
            debt_end: open + inc - dec,
          };
        })
        .filter((item) => item.customer_code || item.customer_name);

      setPreview(mapped);
      setExcelData(mapped);
    };

    reader.readAsArrayBuffer(file);
  };

  // ================= SAVE EXCEL =================
  const handleSaveExcel = async () => {
    if (!excelData.length) {
      alert("Không có dữ liệu Excel");
      return;
    }

    try {
      for (const item of excelData) {
        await apiCreate("customerDebts", item);
      }

      alert("✅ Lưu công nợ thành công");

      setPreview([]);
      setExcelData([]);

      loadDebts();
    } catch (error) {
      console.log("Lỗi lưu công nợ:", error);
      alert("❌ Lỗi lưu công nợ");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Xoá công nợ này?")) return;

    try {
      await apiDelete("customerDebts", id);
      alert("✅ Đã xoá");
      loadDebts();
    } catch (error) {
      console.log("Lỗi xoá công nợ:", error);
      alert("❌ Lỗi xoá công nợ");
    }
  };

  // ================= UPDATE =================
  const handleUpdate = async () => {
    if (!editing) return;

    try {
      const payload = {
        customer_code: editing.customer_code || "",
        customer_name: editing.customer_name || "",
        phone: editing.phone || "",
        debt_open: Number(editing.debt_open || 0),
        debt_increase: Number(editing.debt_increase || 0),
        debt_decrease: Number(editing.debt_decrease || 0),
        debt_end: calcDebtEnd(editing),
      };

      await apiUpdate("customerDebts", editing.id, payload);

      alert("✅ Cập nhật thành công");

      setEditing(null);
      loadDebts();
    } catch (error) {
      console.log("Lỗi cập nhật công nợ:", error);
      alert("❌ Lỗi cập nhật công nợ");
    }
  };

  // ================= FILTER =================
  const filtered = debts.filter((d) => {
    const s = search.toLowerCase();

    const matchText =
      (d.customer_name || "").toLowerCase().includes(s) ||
      (d.customer_code || "").toLowerCase().includes(s) ||
      (d.phone || "").includes(s);

    const matchMoney = minDebt
      ? Number(d.debt_end || 0) >= Number(minDebt)
      : true;

    return matchText && matchMoney;
  });

  const totalDebt = filtered.reduce(
    (sum, d) => sum + Number(d.debt_end || 0),
    0
  );

  return (
    <div className="misa-container">
      <h2>💰 Công nợ khách hàng</h2>

      <div style={{ marginBottom: 15 }}>
        <b style={{ color: "red" }}>
          Tổng nợ cuối: {fm(totalDebt)}
        </b>
      </div>

      <div className="toolbar">
        <input type="file" accept=".xlsx,.xls" onChange={handleFile} />

        <button onClick={handleSaveExcel}>💾 Lưu</button>

        <input
          placeholder="🔍 Tìm khách..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          placeholder="💰 > số tiền"
          value={minDebt}
          onChange={(e) => setMinDebt(e.target.value)}
        />

        <button onClick={loadDebts}>⟳ Tải lại</button>
      </div>

      {/* PREVIEW EXCEL */}
      {preview.length > 0 && (
        <>
          <h3>Preview Excel</h3>

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
              </tr>
            </thead>

            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>
                  <td>{r.customer_code}</td>
                  <td>{r.customer_name}</td>
                  <td>{r.phone}</td>
                  <td>{fm(r.debt_open)}</td>
                  <td>{fm(r.debt_increase)}</td>
                  <td>{fm(r.debt_decrease)}</td>
                  <td style={{ color: "red", fontWeight: "bold" }}>
                    {fm(r.debt_end)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* DATA */}
      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
            <th>SĐT</th>
            <th>Nợ đầu</th>
            <th>Nợ tăng</th>
            <th>Nợ giảm</th>
            <th>Nợ cuối</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                Chưa có dữ liệu công nợ
              </td>
            </tr>
          ) : (
            filtered.map((d) => (
              <tr key={d.id}>
                <td>{d.customer_code}</td>
                <td>{d.customer_name}</td>
                <td>{d.phone}</td>
                <td>{fm(d.debt_open)}</td>
                <td>{fm(d.debt_increase)}</td>
                <td>{fm(d.debt_decrease)}</td>
                <td style={{ color: "red", fontWeight: "bold" }}>
                  {fm(d.debt_end)}
                </td>

                <td>
                  <button onClick={() => setEditing(d)}>✏️</button>
                  <button onClick={() => handleDelete(d.id)}>🗑</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* EDIT MODAL */}
      {editing && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>✏️ Sửa công nợ</h3>

            <input
              placeholder="Mã khách"
              value={editing.customer_code || ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  customer_code: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              placeholder="Tên khách"
              value={editing.customer_name || ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  customer_name: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              placeholder="SĐT"
              value={editing.phone || ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  phone: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Nợ đầu"
              value={editing.debt_open || 0}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  debt_open: Number(e.target.value),
                })
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Nợ tăng"
              value={editing.debt_increase || 0}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  debt_increase: Number(e.target.value),
                })
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Nợ giảm"
              value={editing.debt_decrease || 0}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  debt_decrease: Number(e.target.value),
                })
              }
              style={inputStyle}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={handleUpdate}>💾 Lưu</button>
              <button onClick={() => setEditing(null)}>❌ Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  background: "#fff",
  padding: 20,
  borderRadius: 10,
  width: 450,
};

const inputStyle = {
  width: "100%",
  padding: 8,
  marginBottom: 10,
  border: "1px solid #ccc",
  borderRadius: 6,
};