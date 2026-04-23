import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Purchase() {
  const [data, setData] = useState([]);
  const [excelData, setExcelData] = useState([]);

  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  // ================= DEBOUNCE =================
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchDebounce(search);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  // ================= FETCH (OPTIMIZED) =================
  const fetchData = async () => {
    let query = supabase
      .from("order_items")
      .select(`
        quantity,
        price,
        product_id,
        products(name),
        orders(created_at)
      `);

    const { data: items } = await query;

    const map = {};

    items.forEach(i => {
      const date = new Date(i.orders.created_at);

      if (fromDate && toDate) {
        if (date < new Date(fromDate) || date > new Date(toDate)) return;
      }

      const id = i.product_id;
      if (!map[id]) {
        map[id] = {
          id,
          name: i.products?.name || "N/A",
          qty: 0,
          value: 0
        };
      }

      map[id].qty += i.quantity;
      map[id].value += i.quantity * i.price;
    });

    const result = Object.values(map).map(r => ({
      ...r,
      avg: r.qty ? r.value / r.qty : 0
    }));

    setData(result);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= SEARCH =================
  const filtered = data.filter(d =>
    d.name.toLowerCase().includes(searchDebounce.toLowerCase())
  );

  // ================= PAGINATION =================
  const totalPage = Math.ceil(filtered.length / pageSize);
  const current = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalAll = filtered.reduce((s, r) => s + r.value, 0);

  // ================= EXPORT EXCEL =================
  const handleExport = () => {
    const exportData = filtered.map(r => ({
      SKU: r.id,
      "Tên hàng": r.name,
      "SL mua": r.qty,
      "Đơn giá TB": Math.round(r.avg),
      "Giá trị": r.value
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Purchase");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array"
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream"
    });

    saveAs(blob, "mua-hang.xlsx");
  };

  // ================= READ EXCEL =================
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      setExcelData(json);
    };

    reader.readAsArrayBuffer(file);
  };

  const formatMoney = (n) =>
    new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="misa-container">

      {/* HEADER */}
      <div className="header">
        <h2>📦 Mua hàng theo hàng hóa</h2>

        <div className="toolbar">
          <input
            placeholder="🔍 Tìm sản phẩm..."
            onChange={e => setSearch(e.target.value)}
          />

          <input type="date" onChange={e => setFromDate(e.target.value)} />
          <input type="date" onChange={e => setToDate(e.target.value)} />

          <button onClick={fetchData}>Lấy dữ liệu</button>
          <button onClick={handleExport}>Xuất Excel</button>

          <input type="file" accept=".xlsx, .xls" onChange={handleFile} />
        </div>
      </div>

      {/* CHART */}
      <div className="table-card">
        <h3>📊 Top sản phẩm (theo giá trị)</h3>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={filtered.slice(0, 5)}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TABLE */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Tên hàng</th>
              <th>SL mua</th>
              <th>Đơn giá TB</th>
              <th>Giá trị</th>
            </tr>
          </thead>

          <tbody>
            {current.map(row => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.qty}</td>
                <td>{formatMoney(row.avg)}</td>
                <td>{formatMoney(row.value)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan="4">Tổng</td>
              <td>{formatMoney(totalAll)} đ</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>←</button>
        <span>{page} / {totalPage}</span>
        <button disabled={page === totalPage} onClick={() => setPage(page + 1)}>→</button>
      </div>

      {/* EXCEL PREVIEW */}
      {excelData.length > 0 && (
        <div className="table-card">
          <h3>📊 Dữ liệu Excel</h3>
          <table>
            <thead>
              <tr>
                {Object.keys(excelData[0]).map(k => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}