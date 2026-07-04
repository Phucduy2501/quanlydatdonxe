import { useEffect, useState } from "react";
import "./sales.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "../services/api";

export default function Sales() {
  const [data, setData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    date: "",
    total: "",
    goods: "",
    fee: "",
    discount: "",
    cash: "",
    bank: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const res = await apiGet("sales");

      if (Array.isArray(res)) {
        const sorted = [...res].sort((a, b) => {
          return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
        });

        setData(sorted);
      } else {
        setData([]);
      }
    } catch (error) {
      console.log("Lỗi tải dữ liệu bán hàng:", error);
      setData([]);
    }
  };

  const formatMoney = (num) => {
    return new Intl.NumberFormat("vi-VN").format(Number(num || 0));
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdd = async () => {
    if (!form.date) {
      alert("Vui lòng chọn ngày");
      return;
    }

    if (!form.total) {
      alert("Vui lòng nhập tổng tiền");
      return;
    }

    try {
      await apiCreate("sales", {
        date: form.date,
        total: Number(form.total || 0),
        goods: Number(form.goods || 0),
        fee: Number(form.fee || 0),
        discount: Number(form.discount || 0),
        cash: Number(form.cash || 0),
        bank: Number(form.bank || 0),
      });

      alert("✅ Thêm dữ liệu bán hàng thành công");

      setForm(emptyForm);
      setShowAdd(false);
      loadSales();
    } catch (error) {
      console.log("Lỗi thêm bán hàng:", error);
      alert("❌ Lỗi thêm dữ liệu");
    }
  };

  const handleEdit = (item) => {
    setEditing(item);

    setForm({
      date: item.date || "",
      total: item.total || "",
      goods: item.goods || "",
      fee: item.fee || "",
      discount: item.discount || "",
      cash: item.cash || "",
      bank: item.bank || "",
    });
  };

  const handleUpdate = async () => {
    if (!editing) return;

    if (!form.date) {
      alert("Vui lòng chọn ngày");
      return;
    }

    try {
      await apiUpdate("sales", editing.id, {
        date: form.date,
        total: Number(form.total || 0),
        goods: Number(form.goods || 0),
        fee: Number(form.fee || 0),
        discount: Number(form.discount || 0),
        cash: Number(form.cash || 0),
        bank: Number(form.bank || 0),
      });

      alert("✅ Cập nhật thành công");

      setEditing(null);
      setForm(emptyForm);
      loadSales();
    } catch (error) {
      console.log("Lỗi cập nhật bán hàng:", error);
      alert("❌ Lỗi cập nhật dữ liệu");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá dòng này?")) return;

    try {
      await apiDelete("sales", id);
      loadSales();
    } catch (error) {
      console.log("Lỗi xoá bán hàng:", error);
      alert("❌ Lỗi xoá dữ liệu");
    }
  };

  const filteredData = data.filter((item) => {
    if (!fromDate && !toDate) return true;

    const itemDate = item.date || "";

    if (fromDate && itemDate < fromDate) return false;
    if (toDate && itemDate > toDate) return false;

    return true;
  });

  const totalSum = filteredData.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const totalGoods = filteredData.reduce(
    (sum, item) => sum + Number(item.goods || 0),
    0
  );

  const totalFee = filteredData.reduce(
    (sum, item) => sum + Number(item.fee || 0),
    0
  );

  const totalDiscount = filteredData.reduce(
    (sum, item) => sum + Number(item.discount || 0),
    0
  );

  const totalCash = filteredData.reduce(
    (sum, item) => sum + Number(item.cash || 0),
    0
  );

  const totalBank = filteredData.reduce(
    (sum, item) => sum + Number(item.bank || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      Ngày: item.date,
      Tổng: Number(item.total || 0),
      "Tiền hàng": Number(item.goods || 0),
      "Tiền phí": Number(item.fee || 0),
      "Khuyến mãi": Number(item.discount || 0),
      "Tiền mặt": Number(item.cash || 0),
      "Chuyển khoản": Number(item.bank || 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(fileData, "bao-cao-ban-hang.xlsx");
  };

  const inputStyle = {
    width: "100%",
    padding: 8,
    border: "1px solid #ddd",
    borderRadius: 6,
    marginBottom: 10,
  };

  const modalStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  const modalBoxStyle = {
    background: "white",
    padding: 24,
    borderRadius: 12,
    width: 420,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  };

  return (
    <div className="sales-container">
      <h2>TỔNG HỢP BÁN HÀNG THEO NGÀY</h2>

      <div className="filter">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button onClick={loadSales}>Lấy dữ liệu</button>
        <button onClick={handlePrint}>In</button>
        <button onClick={handleExport}>Xuất Excel</button>
        <button onClick={() => setShowAdd(true)}>+ Thêm</button>
      </div>

      <div className="table-card">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Tổng</th>
              <th>Tiền hàng</th>
              <th>Tiền phí</th>
              <th>Khuyến mãi</th>
              <th>Tiền mặt</th>
              <th>Chuyển khoản</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td>{formatMoney(item.total)}</td>
                <td>{formatMoney(item.goods)}</td>
                <td>{formatMoney(item.fee)}</td>
                <td>{formatMoney(item.discount)}</td>
                <td>{formatMoney(item.cash)}</td>
                <td>{formatMoney(item.bank)}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>✏️</button>
                  <button onClick={() => handleDelete(item.id)}>🗑</button>
                </td>
              </tr>
            ))}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                  Chưa có dữ liệu bán hàng
                </td>
              </tr>
            )}

            <tr style={{ fontWeight: "bold", background: "#eef2ff" }}>
              <td>Tổng</td>
              <td>{formatMoney(totalSum)}</td>
              <td>{formatMoney(totalGoods)}</td>
              <td>{formatMoney(totalFee)}</td>
              <td>{formatMoney(totalDiscount)}</td>
              <td>{formatMoney(totalCash)}</td>
              <td>{formatMoney(totalBank)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div style={modalStyle} onClick={() => setShowAdd(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3>➕ Thêm dữ liệu bán hàng</h3>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="total"
              placeholder="Tổng"
              value={form.total}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="goods"
              placeholder="Tiền hàng"
              value={form.goods}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="fee"
              placeholder="Tiền phí"
              value={form.fee}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="discount"
              placeholder="Khuyến mãi"
              value={form.discount}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="cash"
              placeholder="Tiền mặt"
              value={form.cash}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="bank"
              placeholder="Chuyển khoản"
              value={form.bank}
              onChange={handleChange}
              style={inputStyle}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={handleAdd}>💾 Lưu</button>
              <button onClick={() => setShowAdd(false)}>❌ Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div style={modalStyle} onClick={() => setEditing(null)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Sửa dữ liệu bán hàng</h3>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="total"
              placeholder="Tổng"
              value={form.total}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="goods"
              placeholder="Tiền hàng"
              value={form.goods}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="fee"
              placeholder="Tiền phí"
              value={form.fee}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="discount"
              placeholder="Khuyến mãi"
              value={form.discount}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="cash"
              placeholder="Tiền mặt"
              value={form.cash}
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              name="bank"
              placeholder="Chuyển khoản"
              value={form.bank}
              onChange={handleChange}
              style={inputStyle}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={handleUpdate}>💾 Cập nhật</button>
              <button onClick={() => setEditing(null)}>❌ Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}