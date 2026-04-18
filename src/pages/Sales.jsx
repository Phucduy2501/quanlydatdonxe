import { useEffect, useState } from "react";
import "./sales.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Sales() {
  const [data, setData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // giả lập data
  useEffect(() => {
    const fakeData = [
      {
        date: "2026-04-10",
        total: 21092720,
        goods: 21012720,
        fee: 80000,
        discount: 0,
        cash: 10000000,
        bank: 11092720,
      },
      {
        date: "2026-04-11",
        total: 21183455,
        goods: 21478455,
        fee: 335000,
        discount: 0,
        cash: 12000000,
        bank: 9183455,
      },
    ];

    setData(fakeData);
    setFilteredData(fakeData);
  }, []);

  // format tiền
  const formatMoney = (num) =>
    new Intl.NumberFormat("vi-VN").format(num);

  // lọc theo ngày
  const handleFilter = () => {
    if (!fromDate || !toDate) return;

    const filtered = data.filter(
      (item) => item.date >= fromDate && item.date <= toDate
    );

    setFilteredData(filtered);
  };

  // tính tổng
  const totalSum = filteredData.reduce(
    (sum, item) => sum + item.total,
    0
  );

  // IN
  const handlePrint = () => {
    window.print();
  };

  // EXPORT EXCEL
  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      "Ngày": item.date,
      "Tổng": item.total,
      "Tiền hàng": item.goods,
      "Tiền phí": item.fee,
      "Khuyến mãi": item.discount,
      "Tiền mặt": item.cash,
      "Chuyển khoản": item.bank,
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

  return (
    <div className="sales-container">
      <h2>TỔNG HỢP BÁN HÀNG THEO NGÀY</h2>

      {/* FILTER */}
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

        <button onClick={handleFilter}>Lấy dữ liệu</button>
        <button onClick={handlePrint}>In</button>
        <button onClick={handleExport}>Xuất Excel</button>
      </div>

      {/* TABLE */}
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
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td>{item.date}</td>
                <td>{formatMoney(item.total)}</td>
                <td>{formatMoney(item.goods)}</td>
                <td>{formatMoney(item.fee)}</td>
                <td>{formatMoney(item.discount)}</td>
                <td>{formatMoney(item.cash)}</td>
                <td>{formatMoney(item.bank)}</td>
              </tr>
            ))}

            {/* DÒNG TỔNG */}
            <tr style={{ fontWeight: "bold", background: "#eef2ff" }}>
              <td>Tổng</td>
              <td>{formatMoney(totalSum)}</td>
              <td colSpan="5"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}