import { useEffect, useState } from "react";
import { apiGet, apiCreate, apiUpdate } from "../services/api";

export default function Settings() {
  const [settings, setSettings] = useState(null);

  const [form, setForm] = useState({
    company_name: "TransitGo",
    phone: "",
    email: "",
    address: "",
    tax_code: "",
    note: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiGet("settings");
      const data = Array.isArray(res) ? res[0] : res?.data?.[0];

      if (data) {
        setSettings(data);
        setForm({
          company_name: data.company_name || "TransitGo",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          tax_code: data.tax_code || "",
          note: data.note || "",
        });
      }
    } catch (error) {
      console.log("Lỗi tải cấu hình:", error);
    }
  };

  const saveSettings = async () => {
    try {
      if (settings?.id) {
        await apiUpdate("settings", settings.id, form);
      } else {
        await apiCreate("settings", form);
      }

      alert("✅ Đã lưu cấu hình");
      loadSettings();
    } catch (error) {
      alert(error.message || "Lỗi lưu cấu hình");
    }
  };

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <h2>⚙️ Cấu hình hệ thống</h2>
          <p style={desc}>Thiết lập thông tin doanh nghiệp và thông tin in ấn.</p>
        </div>

        <button onClick={loadSettings} style={btnLight}>⟳ Tải lại</button>
      </div>

      <div style={card}>
        <div style={grid}>
          <div>
            <label style={label}>Tên công ty</label>
            <input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              style={inputFull}
            />
          </div>

          <div>
            <label style={label}>Số điện thoại</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inputFull}
            />
          </div>

          <div>
            <label style={label}>Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputFull}
            />
          </div>

          <div>
            <label style={label}>Mã số thuế</label>
            <input
              value={form.tax_code}
              onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
              style={inputFull}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Địa chỉ</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={inputFull}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Ghi chú</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={{ ...inputFull, height: 90 }}
            />
          </div>
        </div>

        <button onClick={saveSettings} style={btnPrimary}>
          💾 Lưu cấu hình
        </button>
      </div>
    </div>
  );
}

const page = { padding: 24, background: "#f5f7fb", minHeight: "100vh" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 };
const desc = { color: "#6b7280", marginTop: 4 };
const card = { background: "#fff", padding: 18, borderRadius: 12, boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)" };
const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 18 };
const label = { display: "block", marginBottom: 6, fontWeight: 700 };
const inputFull = { width: "100%", padding: 11, border: "1px solid #d1d5db", borderRadius: 8, boxSizing: "border-box" };
const btnPrimary = { padding: "10px 14px", background: "#3045a5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const btnLight = { padding: "10px 14px", background: "#fff", color: "#3045a5", border: "1px solid #c7d2fe", borderRadius: 8, cursor: "pointer" };