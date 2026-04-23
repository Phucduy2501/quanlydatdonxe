import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./customers.css";

export default function Customers() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // ================= LOAD DATA =================
  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*");
    setData(data || []);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ================= SEARCH =================
  const filtered = data.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ================= ADD CUSTOMER =================
  const handleAdd = async () => {
    if (!form.name || !form.phone) {
      alert("Nhập tên + SĐT");
      return;
    }

    await supabase.from("customers").insert([form]);

    setShowForm(false);
    setForm({ name: "", phone: "", email: "" });

    fetchCustomers();
  };

  // ================= IMPORT =================
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const mapped = json.map(row => ({
        code: row["Mã khách hàng"],
        name: row["Tên khách hàng (*)"],
        group: row["Nhóm khách hàng"],
        phone: row["Điện thoại (*)"],
        debt_limit: row["Số nợ tối đa"],
        debt_day: row["Hạn nợ (ngày)"],
        birthday: row["Ngày sinh"],
        gender: row["Giới tính"],
        member_code: row["Mã thẻ thành viên"],
        rank: row["Hạng thẻ"],
        id_number: row["Số CMND/Hộ chiếu"],
        province: row["Tỉnh thành"],
        district: row["Quận/Huyện"],
        ward: row["Phường/Xã"],
        address: row["Số nhà, đường phố"],
        email: row["Email"],
        company: row["Tên công ty"],
        tax: row["Mã số thuế"],
        note: row["Ghi chú"],
        staff_code: row["Mã nhân viên phụ trách"],
        staff_name: row["Tên nhân viên phụ trách"],
      }));

      await supabase.from("customers").insert(mapped);

      fetchCustomers();
    };

    reader.readAsArrayBuffer(file);
  };

  // ================= EXPORT =================
  const handleExport = () => {
    const exportData = data.map(c => ({
      "Mã khách hàng": c.code,
      "Tên khách hàng (*)": c.name,
      "Nhóm khách hàng": c.group,
      "Điện thoại (*)": c.phone,
      "Số nợ tối đa": c.debt_limit,
      "Hạn nợ (ngày)": c.debt_day,
      "Ngày sinh": c.birthday,
      "Giới tính": c.gender,
      "Mã thẻ thành viên": c.member_code,
      "Hạng thẻ": c.rank,
      "Số CMND/Hộ chiếu": c.id_number,
      "Tỉnh thành": c.province,
      "Quận/Huyện": c.district,
      "Phường/Xã": c.ward,
      "Số nhà, đường phố": c.address,
      "Email": c.email,
      "Tên công ty": c.company,
      "Mã số thuế": c.tax,
      "Ghi chú": c.note,
      "Mã nhân viên phụ trách": c.staff_code,
      "Tên nhân viên phụ trách": c.staff_name,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    const buffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([buffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "khach-hang.xlsx");
  };

  return (
    <div className="customer-container">
      <h2>👤 Quản lý khách hàng</h2>

      {/* TOOLBAR */}
      <div className="customer-toolbar">

        <input
            placeholder="🔍 Tìm khách..."
            onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={() => setShowForm(true)}>
            + Thêm
        </button>

        {/* IMPORT đẹp hơn */}
        <label className="import-btn">
            📥 Import Excel
            <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleImport}
            hidden
            />
        </label>

        {/* EXPORT */}
        <button onClick={handleExport}>
            📤 Xuất Excel
        </button>

        </div>

      {/* TABLE */}
      <div className="table-card">
        <table className="customer-table">
            <thead>
            <tr>
                <th>Mã KH</th>
                <th>Tên</th>
                <th>Nhóm</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Giới tính</th>
                <th>Ngày sinh</th>
                <th>Hạng thẻ</th>
                <th>Mã thẻ</th>
                <th>CMND</th>
                <th>Công ty</th>
                <th>MST</th>
                <th>Tỉnh</th>
                <th>Quận</th>
                <th>Phường</th>
                <th>Địa chỉ</th>
                <th>Nợ tối đa</th>
                <th>Hạn nợ</th>
                <th>Nhân viên</th>
                <th>Ghi chú</th>
            </tr>
            </thead>

            <tbody>
            {filtered.map((c, index) => (
                <tr key={index}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.group}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.gender}</td>
                <td>{c.birthday}</td>
                <td>{c.rank}</td>
                <td>{c.member_code}</td>
                <td>{c.id_number}</td>
                <td>{c.company}</td>
                <td>{c.tax}</td>
                <td>{c.province}</td>
                <td>{c.district}</td>
                <td>{c.ward}</td>
                <td>{c.address}</td>
                <td>{c.debt_limit}</td>
                <td>{c.debt_day}</td>
                <td>{c.staff_name}</td>
                <td>{c.note}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>

      {/* FORM POPUP */}
      {showForm && (
        <div className="modal">
          <div className="modal-box">
            <h3>Thêm khách</h3>

            <input
              placeholder="Tên"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              placeholder="SĐT"
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

            <input
              placeholder="Email"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <div className="modal-btn">
              <button onClick={handleAdd}>Lưu</button>
              <button onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}