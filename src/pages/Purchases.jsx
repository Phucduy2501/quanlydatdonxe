import { useEffect, useState } from "react";
import { apiGet } from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Purchases() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [excelData, setExcelData] = useState([]);

  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchDebounce(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const load = async () => {
    try {
      const productsData = await apiGet("products");
      const inventoryData = await apiGet("inventory");
      const purchasesData = await apiGet("purchases");

      setProducts(toArray(productsData));
      setInventory(toArray(inventoryData));
      setPurchases(toArray(purchasesData));
    } catch (error) {
      console.log("Lỗi tải dữ liệu mua hàng:", error);
      setProducts([]);
      setInventory([]);
      setPurchases([]);
    }
  };

  const formatMoney = (n) =>
    Number(n || 0).toLocaleString("vi-VN") + " đ";

  const getDateValue = (item) => {
    return item.date || item.created_at || item.createdAt;
  };

  const inDateRange = (item) => {
    if (!fromDate && !toDate) return true;

    const dateValue = getDateValue(item);
    if (!dateValue) return true;

    const d = new Date(dateValue);

    if (fromDate) {
      const from = new Date(fromDate);
      if (d < from) return false;
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }

    return true;
  };

  // Tính dữ liệu mua hàng theo sản phẩm.
  // Nếu có inventory type = import thì lấy theo nhập kho.
  // Nếu chưa có dữ liệu nhập kho thì fallback tạm theo stock hiện tại.
  const importLogs = inventory.filter(
    (i) => i.type === "import" && inDateRange(i)
  );

  const productMap = {};

  if (importLogs.length > 0) {
    importLogs.forEach((log) => {
      const productId = log.product_id || log.productId;
      const product = products.find(
        (p) => String(p.id) === String(productId)
      );

      if (!product) return;

      if (!productMap[product.id]) {
        productMap[product.id] = {
          id: product.id,
          sku: product.sku || product.id,
          name: product.name || "Không tên",
          qty: 0,
          avg: Number(product.cost_price || product.price || 0),
          value: 0,
          stock: Number(product.stock || 0),
        };
      }

      const qty = Number(log.quantity || 0);
      const price = Number(product.cost_price || product.price || 0);

      productMap[product.id].qty += qty;
      productMap[product.id].value += qty * price;
    });
  } else {
    products.forEach((product) => {
      const qty = Number(product.stock || 0);
      const price = Number(product.cost_price || product.price || 0);

      productMap[product.id] = {
        id: product.id,
        sku: product.sku || product.id,
        name: product.name || "Không tên",
        qty,
        avg: price,
        value: qty * price,
        stock: qty,
      };
    });
  }

  const rows = Object.values(productMap);

  const filtered = rows.filter((row) => {
    const text = `${row.sku || ""} ${row.name || ""}`.toLowerCase();
    return text.includes(searchDebounce.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => b.value - a.value);

  const totalPage = Math.max(Math.ceil(sorted.length / pageSize), 1);

  const current = sorted.slice((page - 1) * pageSize, page * pageSize);

  const totalQty = filtered.reduce((s, r) => s + Number(r.qty || 0), 0);
  const totalValue = filtered.reduce((s, r) => s + Number(r.value || 0), 0);
  const totalPurchases = purchases
    .filter(inDateRange)
    .reduce((s, r) => s + Number(r.total || 0), 0);

  const topChartData = sorted.slice(0, 6).map((row) => ({
    name: row.name,
    value: Number(row.value || 0),
  }));

  const handleExport = () => {
    const exportData = filtered.map((row) => ({
      SKU: row.sku,
      "Tên hàng": row.name,
      "SL mua / tồn": row.qty,
      "Đơn giá TB": Math.round(row.avg || 0),
      "Giá trị": row.value,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Purchase");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "mua-hang-theo-hang-hoa.xlsx");
  };

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

  return (
    <div style={pageStyle}>
      <div style={header}>
        <div>
          <h2 style={{ margin: 0 }}>📦 Mua hàng theo hàng hóa</h2>
          <p style={desc}>
            Theo dõi giá trị hàng nhập, tồn kho, sản phẩm mua nhiều và xuất báo cáo.
          </p>
        </div>

        <button onClick={load} style={reloadBtn}>
          ⟳ Tải lại
        </button>
      </div>

      <div style={filterBox}>
        <input
          placeholder="🔍 Tìm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={input}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={input}
        />

        <button onClick={load} style={btn}>
          Lấy dữ liệu
        </button>

        <button onClick={handleExport} style={primaryBtn}>
          Xuất Excel
        </button>

        <label style={fileBtn}>
          Import Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div style={cardGrid}>
        <div style={card("#e3f2fd", "#2196f3")}>
          <p>Tổng mặt hàng</p>
          <h3>{filtered.length}</h3>
          <span>Số sản phẩm đang thống kê</span>
        </div>

        <div style={card("#e8f5e9", "#16a34a")}>
          <p>Tổng số lượng</p>
          <h3>{totalQty}</h3>
          <span>Tổng SL nhập / tồn</span>
        </div>

        <div style={card("#fff3e0", "#ff9800")}>
          <p>Giá trị hàng hóa</p>
          <h3>{formatMoney(totalValue)}</h3>
          <span>Tính theo đơn giá sản phẩm</span>
        </div>

        <div style={card("#fce7f3", "#e91e63")}>
          <p>Tổng phiếu mua</p>
          <h3>{formatMoney(totalPurchases)}</h3>
          <span>Từ bảng purchases</span>
        </div>
      </div>

      <div style={section}>
        <div style={sectionHeader}>
          <h3>📊 Top sản phẩm theo giá trị</h3>
          <span style={badge}>{topChartData.length} sản phẩm</span>
        </div>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={topChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="value" fill="#2f43a3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={section}>
        <div style={sectionHeader}>
          <h3>Danh sách hàng hóa</h3>
          <span style={badge}>Trang {page} / {totalPage}</span>
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>SKU</th>
              <th style={th}>Tên hàng</th>
              <th style={th}>SL mua / tồn</th>
              <th style={th}>Đơn giá TB</th>
              <th style={th}>Giá trị</th>
            </tr>
          </thead>

          <tbody>
            {current.map((row) => (
              <tr key={row.id}>
                <td style={td}>{row.sku}</td>
                <td style={td}>{row.name}</td>
                <td style={td}>{row.qty}</td>
                <td style={td}>{formatMoney(row.avg)}</td>
                <td style={td}>{formatMoney(row.value)}</td>
              </tr>
            ))}

            {current.length === 0 && (
              <tr>
                <td colSpan="5" style={{ ...td, textAlign: "center" }}>
                  Chưa có dữ liệu hàng hóa
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr style={{ fontWeight: "bold", background: "#f8fafc" }}>
              <td style={td} colSpan="2">Tổng</td>
              <td style={td}>{totalQty}</td>
              <td style={td}></td>
              <td style={td}>{formatMoney(totalValue)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={btn}
          >
            ← Trước
          </button>

          <span>{page} / {totalPage}</span>

          <button
            disabled={page === totalPage}
            onClick={() => setPage(page + 1)}
            style={btn}
          >
            Sau →
          </button>
        </div>
      </div>

      {excelData.length > 0 && (
        <div style={section}>
          <div style={sectionHeader}>
            <h3>📄 Dữ liệu Excel vừa import</h3>
            <span style={badge}>{excelData.length} dòng</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  {Object.keys(excelData[0]).map((key) => (
                    <th key={key} style={th}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {excelData.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i} style={td}>
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ color: "#6b7280" }}>
            Đang xem trước 10 dòng đầu. Nếu muốn import dữ liệu này vào PostgreSQL,
            cần làm thêm API import riêng.
          </p>
        </div>
      )}
    </div>
  );
}

/* STYLE */
const pageStyle = {
  padding: 24,
  background: "#f4f7fb",
  minHeight: "100vh",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const desc = {
  margin: "6px 0 0",
  color: "#6b7280",
};

const reloadBtn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

const filterBox = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  background: "white",
  padding: 14,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const input = {
  padding: 9,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  minWidth: 170,
};

const btn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "9px 14px",
  border: "none",
  borderRadius: 8,
  background: "#2f43a3",
  color: "white",
  cursor: "pointer",
};

const fileBtn = {
  padding: "9px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#f9fafb",
  cursor: "pointer",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const card = (bg, borderColor) => ({
  background: bg,
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  borderLeft: `5px solid ${borderColor}`,
});

const section = {
  background: "white",
  padding: 18,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const badge = {
  background: "#eef2ff",
  color: "#2f43a3",
  padding: "5px 10px",
  borderRadius: 999,
  fontWeight: 600,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  background: "#2f43a3",
  color: "white",
  padding: 10,
  textAlign: "left",
};

const td = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
};

const pagination = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 12,
  marginTop: 14,
};