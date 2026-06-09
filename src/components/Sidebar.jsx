import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../index.css";

export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      <h2 className="logo">MISAeShop</h2>

      <div
        className={`menu-item ${isActive("/") ? "active" : ""}`}
        onClick={() => navigate("/")}
      >
        📊 Tổng quan
      </div>

      {/* ===== BÁO CÁO ===== */}
      <div
        className="menu-item"
        onMouseEnter={() => setActiveMenu("baocao")}
        onMouseLeave={() => setActiveMenu(null)}
      >
        📈 Báo cáo

        {activeMenu === "baocao" && (
          <div className="dropdown-menu small">
            <div onClick={() => navigate("/sales")}>Bán hàng</div>
            <div onClick={() => navigate("/multi-sales")}>Bán đa kênh</div>
            <div onClick={() => navigate("/profit")}>Lợi nhuận</div>
          </div>
        )}
      </div>

      <div
        className={`menu-item ${isActive("/orders") ? "active" : ""}`}
        onClick={() => navigate("/orders")}
      >
        🧾 Đơn hàng
      </div>

      <div
        className={`menu-item ${isActive("/purchase") ? "active" : ""}`}
        onClick={() => navigate("/purchase")}
      >
        🛒 Mua hàng
      </div>

      <div
        className={`menu-item ${isActive("/inventory") ? "active" : ""}`}
        onClick={() => navigate("/inventory")}
      >
        🏬 Kho
      </div>

      <div
        className={`menu-item ${isActive("/cash") ? "active" : ""}`}
        onClick={() => navigate("/cash")}
      >
        💰 Quỹ tiền
      </div>

      <div
        className={`menu-item ${isActive("/expenses") ? "active" : ""}`}
        onClick={() => navigate("/expenses")}
      >
        💸 Chi phí
      </div>

      {/* ===== DANH MỤC ===== */}
      <div
        className="menu-item"
        onMouseEnter={() => setActiveMenu("danhmuc")}
        onMouseLeave={() => setActiveMenu(null)}
      >
        📦 Danh mục

        {activeMenu === "danhmuc" && (
          <div className="dropdown-menu big">
            <div className="column">
              <h4>HÀNG HÓA</h4>
              <div onClick={() => navigate("/product-groups")}>Nhóm hàng</div>
              <div onClick={() => navigate("/products")}>Hàng hóa</div>
              <div onClick={() => navigate("/units")}>Đơn vị</div>
              <div onClick={() => navigate("/price-list")}>Bảng giá</div>
            </div>

            <div className="column">
              <h4>KHÁCH HÀNG</h4>
              <div onClick={() => navigate("/customers")}>Khách hàng</div>
              <div onClick={() => navigate("/customer-groups")}>Nhóm KH</div>
              <div onClick={() => navigate("/membership")}>Hạng thẻ</div>
            </div>

            <div className="column">
              <h4>KHÁC</h4>
              <div onClick={() => navigate("/staff")}>Nhân viên</div>
              <div onClick={() => navigate("/shifts")}>Ca làm</div>
              <div onClick={() => navigate("/channels")}>Kênh</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}