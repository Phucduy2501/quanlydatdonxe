import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyCustomer = {
    code: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    birthday: "",
  };

  const [newCus, setNewCus] = useState(emptyCustomer);

  const inputStyle = {
    width: "100%",
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 6,
    marginBottom: 10,
  };

  const btnSave = {
    background: "#2ecc71",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
  };

  const btnCancel = {
    background: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
  };

  // ================= LOAD DATA TỪ BACKEND =================
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await apiGet("customers");

      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setCustomers(sorted);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.log("Lỗi tải khách hàng:", error);
      setCustomers([]);
    }
  };

  // ================= NORMALIZE EXCEL HEADER =================
  const normalize = (str) =>
    str
      ?.toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const get = (row, keywords = []) => {
    const keys = Object.keys(row);

    for (let k of keys) {
      const nk = normalize(k);

      for (let kw of keywords) {
        const nkw = normalize(kw);

        if (
          nk.includes(nkw) ||
          nkw.includes(nk) ||
          (nk.includes("sdt") && nkw.includes("dien"))
        ) {
          return row[k];
        }
      }
    }

    return "";
  };

  // ================= DATE =================
  const formatDate = (v) => {
    if (!v) return "";

    if (typeof v === "string" && v.includes("/")) {
      let [m, d, y] = v.split("/");

      if (!m || !d || !y) return "";

      if (y.length === 2) y = "20" + y;

      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    const d = new Date(v);

    if (isNaN(d)) return "";

    return d.toISOString().split("T")[0];
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
        range: 3,
      });

      const mapped = json.map((row, i) => ({
        index: i + 1,
        code: get(row, ["ma khach", "ma khach hang", "ma kh"]),
        name: get(row, ["ten khach", "ten khach hang", "khach hang"]),
        phone: get(row, ["dien thoai", "sdt", "tel", "phone"]),
        email: get(row, ["email"]),
        address: get(row, ["dia chi", "address"]),
        province: get(row, ["tinh", "thanh pho"]),
        district: get(row, ["quan", "huyen"]),
        ward: get(row, ["phuong", "xa"]),
        birthday: get(row, ["ngay sinh", "birthday"]),
        raw: row,
      }));

      setExcelData(mapped);
      setPreview(mapped);
    };

    reader.readAsArrayBuffer(file);
  };

  // ================= SAVE EXCEL VÀO BACKEND =================
  const handleSave = async () => {
    if (!excelData.length) {
      alert("Không có dữ liệu Excel để lưu");
      return;
    }

    setLoading(true);

    try {
      const clean = excelData.map((v) => ({
        code: v.code || "KH" + Date.now() + Math.floor(Math.random() * 1000),
        name: v.name || "",
        phone: v.phone || "",
        email: v.email || "",
        address: v.address || "",
        province: v.province || "",
        district: v.district || "",
        ward: v.ward || "",
        birthday: formatDate(v.birthday),
      }));

      for (const item of clean) {
        await apiCreate("customers", item);
      }

      alert("✅ Lưu dữ liệu Excel thành công");

      setExcelData([]);
      setPreview([]);

      await fetchCustomers();
    } catch (error) {
      console.log("Lỗi lưu Excel:", error);
      alert("❌ Lỗi lưu dữ liệu Excel");
    }

    setLoading(false);
  };

  // ================= ADD =================
  const handleAdd = async () => {
    if (!newCus.name) {
      alert("Thiếu tên khách hàng");
      return;
    }

    if (!newCus.phone) {
      alert("Thiếu SĐT");
      return;
    }

    try {
      await apiCreate("customers", {
        code: newCus.code || "KH" + Date.now(),
        name: newCus.name,
        phone: newCus.phone,
        email: newCus.email || "",
        address: newCus.address || "",
        province: newCus.province || "",
        district: newCus.district || "",
        ward: newCus.ward || "",
        birthday: newCus.birthday || "",
      });

      alert("✅ Thêm khách hàng thành công");

      setShowAdd(false);
      setNewCus(emptyCustomer);

      fetchCustomers();
    } catch (error) {
      console.log("Lỗi thêm khách hàng:", error);
      alert("❌ Lỗi thêm khách hàng");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Xoá khách hàng này?")) return;

    try {
      await apiDelete("customers", id);
      fetchCustomers();
    } catch (error) {
      console.log("Lỗi xoá khách hàng:", error);
      alert("❌ Lỗi xoá khách hàng");
    }
  };

  // ================= UPDATE =================
  const handleUpdate = async () => {
    if (!editing?.name) {
      alert("Thiếu tên khách hàng");
      return;
    }

    if (!editing?.phone) {
      alert("Thiếu SĐT");
      return;
    }

    try {
      await apiUpdate("customers", editing.id, {
        code: editing.code || "",
        name: editing.name || "",
        phone: editing.phone || "",
        email: editing.email || "",
        address: editing.address || "",
        province: editing.province || "",
        district: editing.district || "",
        ward: editing.ward || "",
        birthday: editing.birthday || "",
      });

      alert("✅ Cập nhật thành công");

      setEditing(null);
      fetchCustomers();
    } catch (error) {
      console.log("Lỗi cập nhật khách hàng:", error);
      alert("❌ Lỗi cập nhật khách hàng");
    }
  };

  // ================= SEARCH =================
  const filtered = customers.filter((c) => {
    const text = `${c.code || ""} ${c.name || ""} ${c.phone || ""} ${
      c.address || ""
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  // ================= EXPORT EXCEL =================
  const exportExcel = () => {
    const dataExport = customers.map((c) => ({
      "Mã khách": c.code || "",
      "Tên khách": c.name || "",
      "SĐT": c.phone || "",
      Email: c.email || "",
      "Địa chỉ": c.address || "",
      Tỉnh: c.province || "",
      Quận: c.district || "",
      Phường: c.ward || "",
      "Ngày sinh": c.birthday || "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers.xlsx");
  };

  return (
    <div className="misa-container">
      <h2>👤 Quản lý khách hàng</h2>

      <div className="toolbar">
        <input
          placeholder="🔍 Tìm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input type="file" accept=".xlsx,.xls" onChange={handleFile} />

        <button onClick={handleSave} disabled={loading}>
          {loading ? "Đang lưu..." : "💾 Lưu"}
        </button>

        <button onClick={exportExcel}>📤 Xuất</button>

        <button onClick={() => setShowAdd(true)}>➕ Thêm</button>
      </div>

      {/* PREVIEW EXCEL */}
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

          {filtered.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                Chưa có dữ liệu khách hàng
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MODAL ADD */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowAdd(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: 420,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginBottom: 15 }}>➕ Thêm khách hàng</h3>

            <input
              placeholder="Mã khách"
              value={newCus.code}
              onChange={(e) => setNewCus({ ...newCus, code: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="Tên khách *"
              value={newCus.name}
              autoFocus
              onChange={(e) => setNewCus({ ...newCus, name: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="SĐT *"
              value={newCus.phone}
              onChange={(e) => setNewCus({ ...newCus, phone: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="Email"
              value={newCus.email}
              onChange={(e) => setNewCus({ ...newCus, email: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="Địa chỉ"
              value={newCus.address}
              onChange={(e) =>
                setNewCus({ ...newCus, address: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Tỉnh"
              value={newCus.province}
              onChange={(e) =>
                setNewCus({ ...newCus, province: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Quận"
              value={newCus.district}
              onChange={(e) =>
                setNewCus({ ...newCus, district: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Phường"
              value={newCus.ward}
              onChange={(e) => setNewCus({ ...newCus, ward: e.target.value })}
              style={inputStyle}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 15,
              }}
            >
              <button style={btnSave} onClick={handleAdd}>
                💾 Lưu
              </button>

              <button style={btnCancel} onClick={() => setShowAdd(false)}>
                ❌ Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: 420,
            }}
          >
            <h3>✏️ Sửa khách hàng</h3>

            <input
              placeholder="Mã khách"
              value={editing.code || ""}
              onChange={(e) =>
                setEditing({ ...editing, code: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Tên khách"
              value={editing.name || ""}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="SĐT"
              value={editing.phone || ""}
              onChange={(e) =>
                setEditing({ ...editing, phone: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Email"
              value={editing.email || ""}
              onChange={(e) =>
                setEditing({ ...editing, email: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Địa chỉ"
              value={editing.address || ""}
              onChange={(e) =>
                setEditing({ ...editing, address: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Tỉnh"
              value={editing.province || ""}
              onChange={(e) =>
                setEditing({ ...editing, province: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Quận"
              value={editing.district || ""}
              onChange={(e) =>
                setEditing({ ...editing, district: e.target.value })
              }
              style={inputStyle}
            />

            <input
              placeholder="Phường"
              value={editing.ward || ""}
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
  );
}