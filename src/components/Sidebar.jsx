import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../index.css";

export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 mapping route
  const menuMap = {
    "Bán hàng": "/sales",
    "Mua hàng": "/purchase",
    "Kho": "/warehouse",
    "Công nợ": "/debts",
    "Quỹ tiền": "/cash",
    "Lợi nhuận": "/profit",
  };

  // 🔥 check active theo URL
  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", position: "relative" }}>
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">MISAeShop</h2>

        {/* Tổng quan */}
        <div
          className={`menu-item ${isActive("/") ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          📊 Tổng quan
        </div>

        {/* Báo cáo */}
        <div
          className="menu-item"
          onMouseEnter={() => setActiveMenu("baocao")}
        >
          📈 Báo cáo
        </div>

        {/* Các menu khác */}
        <div className="menu-item" onClick={() => navigate("/orders")}>
          🧾 Đơn hàng
        </div>

        <div className="menu-item" onClick={() => navigate("/purchase")}>
          🛒 Mua hàng
        </div>

        <div className="menu-item">🏬 Kho</div>
        <div className="menu-item">💰 Quỹ tiền</div>
        <div className="menu-item">💸 Chi phí</div>

        {/* Danh mục */}
        <div
          className="menu-item"
          onMouseEnter={() => setActiveMenu("danhmuc")}
        >
          📦 Danh mục
        </div>
      </div>

      {/* DROPDOWN BÁO CÁO */}
      {activeMenu === "baocao" && (
        <div
          className="dropdown-menu"
          onMouseEnter={() => setActiveMenu("baocao")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          {[
            "Bán hàng",
            "Bán hàng đa kênh",
            "Mua hàng",
            "Kho",
            "Công nợ",
            "Quỹ tiền",
            "Lợi nhuận",
          ].map((item) => (
            <p
              key={item}
              className={`menu-child ${
                isActive(menuMap[item]) ? "active" : ""
              }`}
              onClick={() => {
                setActiveMenu(null);

                if (menuMap[item]) {
                  navigate(menuMap[item]);
                }
              }}
            >
              {item}
            </p>
          ))}
        </div>
      )}

      {/* DROPDOWN DANH MỤC */}
      {activeMenu === "danhmuc" && (
        <div
          className="dropdown-menu big"
          onMouseEnter={() => setActiveMenu("danhmuc")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="column">
            <h4>HÀNG HÓA</h4>
            <p className="menu-child">Nhóm hàng hóa</p>
            <p className="menu-child">Hàng hóa</p>
            <p className="menu-child">Đơn vị tính</p>
            <p className="menu-child">In tem mã</p>
            <p className="menu-child">Bảng giá</p>
            <p className="menu-child">Kho</p>
          </div>

          <div className="column">
            <h4>KHÁCH HÀNG</h4>
            <p className="menu-child">Nhóm khách hàng</p>
            <p
              className={`menu-child ${isActive("/customers") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);   // 🔥 QUAN TRỌNG
                navigate("/customers");
              }}
            >
              Khách hàng
            </p>
            <p className="menu-child">Hạng thẻ</p>
          </div>

          <div className="column">
            <h4>KHÁC</h4>
            <p className="menu-child">Nhân viên</p>
            <p className="menu-child">Ca làm việc</p>
            <p className="menu-child">Kênh bán hàng</p>
          </div>
        </div>
      )}
    </div>
  );
}