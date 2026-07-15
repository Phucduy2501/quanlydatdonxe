import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import "./dashboard.css";

const demoOrders = [
  {
    id: 1,
    code: "DH001",
    customer_name: "Nguyễn Văn An",
    total: 1250000,
    status: "completed",
  },
  {
    id: 2,
    code: "DH002",
    customer_name: "Trần Thị Bình",
    total: 860000,
    status: "pending",
  },
  {
    id: 3,
    code: "DH003",
    customer_name: "Lê Hoàng Nam",
    total: 450000,
    status: "processing",
  },
  {
    id: 4,
    code: "DH004",
    customer_name: "Phạm Thu Hà",
    total: 920000,
    status: "completed",
  },
];

const demoProducts = [
  {
    id: 1,
    name: "Dép EVA màu đen",
    stock: 8,
    min_stock: 10,
    max_stock: 100,
    expiry_date: null,
  },
  {
    id: 2,
    name: "Dép EVA màu trắng",
    stock: 120,
    min_stock: 10,
    max_stock: 100,
    expiry_date: null,
  },
  {
    id: 3,
    name: "Dép EVA màu hồng",
    stock: 25,
    min_stock: 10,
    max_stock: 100,
    expiry_date: null,
  },
  {
    id: 4,
    name: "Dép EVA phối xanh",
    stock: 5,
    min_stock: 10,
    max_stock: 80,
    expiry_date: null,
  },
  {
    id: 5,
    name: "Nước giặt hương hoa",
    stock: 14,
    min_stock: 8,
    max_stock: 60,
    expiry_date: "2026-08-05",
  },
  {
    id: 6,
    name: "Sữa tắm dưỡng ẩm",
    stock: 7,
    min_stock: 5,
    max_stock: 40,
    expiry_date: "2026-07-10",
  },
];

const demoExpenses = [
  {
    id: 1,
    name: "Chi phí quảng cáo",
    amount: 350000,
  },
  {
    id: 2,
    name: "Chi phí vận chuyển",
    amount: 180000,
  },
  {
    id: 3,
    name: "Chi phí đóng gói",
    amount: 120000,
  },
];

const demoCashbook = [
  {
    id: 1,
    type: "thu",
    amount: 3480000,
  },
  {
    id: 2,
    type: "thu",
    amount: 1250000,
  },
  {
    id: 3,
    type: "chi",
    amount: 530000,
  },
  {
    id: 4,
    type: "chi",
    amount: 210000,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState(demoOrders);
  const [products, setProducts] = useState(demoProducts);
  const [expenses, setExpenses] = useState(demoExpenses);
  const [cashbook, setCashbook] = useState(demoCashbook);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = () => {
    if (loading) return;

    setLoading(true);

    setTimeout(() => {
      setOrders([...demoOrders]);
      setProducts([...demoProducts]);
      setExpenses([...demoExpenses]);
      setCashbook([...demoCashbook]);
      setLastUpdated(new Date());
      setLoading(false);
    }, 500);
  };

  const formatMoney = (number) => {
    return new Intl.NumberFormat("vi-VN").format(Number(number || 0));
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Không có";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Không hợp lệ";
    }

    return date.toLocaleDateString("vi-VN");
  };

  const getMinStock = (product) => {
    return Number(product.min_stock ?? product.minStock ?? 10);
  };

  const getMaxStock = (product) => {
    return Number(product.max_stock ?? product.maxStock ?? 500);
  };

  const getExpiryDate = (product) => {
    return product.expiry_date || product.expiryDate || null;
  };

  const revenue = orders.reduce((sum, order) => {
    return sum + Number(order.total || 0);
  }, 0);

  const cost = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  const profit = revenue - cost;

  const stock = products.reduce((sum, product) => {
    return sum + Number(product.stock || 0);
  }, 0);

  const lowStockProducts = products.filter((product) => {
    return Number(product.stock || 0) <= getMinStock(product);
  });

  const overStockProducts = products.filter((product) => {
    return Number(product.stock || 0) >= getMaxStock(product);
  });

  const almostExpiredProducts = products.filter((product) => {
    const expiryValue = getExpiryDate(product);

    if (!expiryValue) return false;

    const now = new Date();
    const expiry = new Date(expiryValue);

    if (Number.isNaN(expiry.getTime())) return false;

    const difference = expiry.getTime() - now.getTime();
    const differenceDays = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    return differenceDays > 0 && differenceDays <= 30;
  });

  const expiredProducts = products.filter((product) => {
    const expiryValue = getExpiryDate(product);

    if (!expiryValue) return false;

    const expiry = new Date(expiryValue);

    if (Number.isNaN(expiry.getTime())) return false;

    return expiry.getTime() < new Date().getTime();
  });

  const totalThu = cashbook
    .filter((item) => item.type === "thu")
    .reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

  const totalChi = cashbook
    .filter((item) => item.type === "chi")
    .reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "processing"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-top">
        <div>
          <h2>Tổng quan</h2>

          <p>
            Xin chào, đây là bảng tổng hợp tình hình kho hàng và bán hàng.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={fetchData}
            className="reload-btn"
            disabled={loading}
          >
            {loading ? "Đang tải..." : "⟳ Tải lại"}
          </button>

          <NotificationBell />
        </div>
      </div>

      <div className="welcome-banner">
        <div className="welcome-left">
          <div className="circle-progress">
            <span />
          </div>

          <div>
            <h3>
              Chào bạn, hãy bắt đầu quản lý cửa hàng hiệu quả hơn
            </h3>

            <p>
              Theo dõi tồn kho, doanh thu, chi phí, đơn hàng và cảnh báo
              hàng hóa ngay trên một màn hình.
            </p>

            <div className="welcome-actions">
              <button
                type="button"
                onClick={() => navigate("/products")}
              >
                Bắt đầu sử dụng
              </button>

              <button
                type="button"
                className="secondary"
                onClick={fetchData}
                disabled={loading}
              >
                {loading ? "Đang cập nhật..." : "Cập nhật dữ liệu"}
              </button>
            </div>
          </div>
        </div>

        <div className="welcome-illustration">
          <div className="shape shape-one" />
          <div className="shape shape-two" />
          <div className="shape shape-three" />
        </div>
      </div>

      <div className="summary-grid">
        <div
          className="summary-card blue"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/orders")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/orders");
          }}
        >
          <p>Doanh thu</p>
          <h3>{formatMoney(revenue)} đ</h3>
          <span>Tổng doanh thu đơn hàng</span>
        </div>

        <div
          className="summary-card red"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/expenses")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/expenses");
          }}
        >
          <p>Chi phí</p>
          <h3>{formatMoney(cost)} đ</h3>
          <span>Tổng chi phí phát sinh</span>
        </div>

        <div
          className="summary-card green"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/profit")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/profit");
          }}
        >
          <p>Lợi nhuận</p>
          <h3>{formatMoney(profit)} đ</h3>
          <span>Doanh thu trừ chi phí</span>
        </div>

        <div
          className="summary-card purple"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/inventory")}
          onKeyDown={(event) => {
            if (event.key === "Enter") navigate("/inventory");
          }}
        >
          <p>Tồn kho</p>
          <h3>{stock}</h3>
          <span>Tổng số lượng hàng tồn</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <Panel
          title="Tồn kho dưới mức tối thiểu"
          onReload={fetchData}
          onView={() => navigate("/inventory")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>SL tồn</th>
                <th>SL tối thiểu</th>
              </tr>
            </thead>

            <tbody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.stock || 0}</td>
                    <td>{getMinStock(product)}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  colSpan={3}
                  text="Không có hàng dưới mức tối thiểu"
                />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Tồn kho vượt mức tối đa"
          onReload={fetchData}
          onView={() => navigate("/inventory")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>SL tồn</th>
                <th>SL tối đa</th>
              </tr>
            </thead>

            <tbody>
              {overStockProducts.length > 0 ? (
                overStockProducts.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.stock || 0}</td>
                    <td>{getMaxStock(product)}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  colSpan={3}
                  text="Không có hàng vượt mức tối đa"
                />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Hàng hóa sắp hết hạn trong 30 ngày"
          onReload={fetchData}
          onView={() => navigate("/inventory")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>Hạn sử dụng</th>
                <th>Số lượng</th>
              </tr>
            </thead>

            <tbody>
              {almostExpiredProducts.length > 0 ? (
                almostExpiredProducts.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{formatDate(getExpiryDate(product))}</td>
                    <td>{product.stock || 0}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  colSpan={3}
                  text="Không có hàng sắp hết hạn"
                />
              )}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Hàng hóa quá hạn sử dụng"
          onReload={fetchData}
          onView={() => navigate("/inventory")}
          lastUpdated={lastUpdated}
          loading={loading}
        >
          <table>
            <thead>
              <tr>
                <th>Tên hàng hóa</th>
                <th>Hạn sử dụng</th>
                <th>Số lượng</th>
              </tr>
            </thead>

            <tbody>
              {expiredProducts.length > 0 ? (
                expiredProducts.slice(0, 5).map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{formatDate(getExpiryDate(product))}</td>
                    <td>{product.stock || 0}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  colSpan={3}
                  text="Không có hàng quá hạn"
                />
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="bottom-grid">
        <StatusBox
          title="Lệnh xuất kho"
          onClick={() => navigate("/orders")}
          values={[
            {
              label: "Quá hạn",
              value: 0,
              color: "#ff9800",
            },
            {
              label: "Chưa thực hiện",
              value: pendingOrders,
              color: "#52c41a",
            },
            {
              label: "Đang thực hiện",
              value: processingOrders,
              color: "#5b6cff",
            },
            {
              label: "Hoàn thành",
              value: completedOrders,
              color: "#111827",
            },
          ]}
        />

        <StatusBox
          title="Lệnh nhập kho"
          onClick={() => navigate("/purchase")}
          values={[
            {
              label: "Quá hạn",
              value: 0,
              color: "#ff9800",
            },
            {
              label: "Chờ nhận hàng",
              value: 2,
              color: "#52c41a",
            },
            {
              label: "Chờ kiểm đếm",
              value: 1,
              color: "#5b6cff",
            },
            {
              label: "Đã hoàn thành",
              value: 4,
              color: "#111827",
            },
          ]}
        />

        <div className="money-box">
          <h3>Quỹ tiền</h3>

          <div
            className="money-row"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/cash")}
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate("/cash");
            }}
          >
            <span>Tổng thu</span>
            <b className="green-text">
              {formatMoney(totalThu)} đ
            </b>
          </div>

          <div
            className="money-row"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/cash")}
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate("/cash");
            }}
          >
            <span>Tổng chi</span>
            <b className="red-text">
              {formatMoney(totalChi)} đ
            </b>
          </div>

          <div className="money-row total">
            <span>Còn lại</span>
            <b>{formatMoney(totalThu - totalChi)} đ</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  onReload,
  onView,
  lastUpdated,
  loading,
}) {
  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <h3>{title}</h3>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          title="Tải lại dữ liệu"
        >
          {loading ? "..." : "⟳"}
        </button>
      </div>

      {children}

      <div className="panel-footer">
        Số liệu tính đến:{" "}
        {lastUpdated.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}

        <button type="button" onClick={onView}>
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-cell">
        {text}
      </td>
    </tr>
  );
}

function StatusBox({ title, values, onClick }) {
  const total = values.reduce((sum, item) => {
    return sum + Number(item.value || 0);
  }, 0);

  return (
    <div className="status-box">
      <div className="status-header">
        <h3>{title}</h3>

        <button type="button" onClick={onClick}>
          Cần thực hiện ➜
        </button>
      </div>

      <div className="status-values">
        {values.map((item) => (
          <div key={`${title}-${item.label}`}>
            <b style={{ color: item.color }}>
              {item.value}
            </b>

            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="status-bars">
        {values.map((item) => (
          <span
            key={`${title}-bar-${item.label}`}
            style={{
              background: item.color,
              flex:
                total === 0
                  ? 1
                  : Math.max(Number(item.value || 0), 0.3),
            }}
          />
        ))}
      </div>
    </div>
  );
}