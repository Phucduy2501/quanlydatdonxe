import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../index.css";

export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuMap = {
    "Bán hàng": "/sales",
    "Bán hàng đa kênh": "/multi-sales",
    "Mua hàng": "/purchase",
    "Kho": "/inventory",
    "Công nợ": "/debts",
    "Quỹ tiền": "/cash",
    "Lợi nhuận": "/profit",
  };

  return (
    <div style={{ display: "flex", position: "relative" }}>
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">MISAeShop</h2>

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
          {Object.keys(menuMap).map((item) => (
            <p
              key={item}
              className={`menu-child ${
                isActive(menuMap[item]) ? "active" : ""
              }`}
              onClick={() => {
                setActiveMenu(null);
                navigate(menuMap[item]);
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
          {/* HÀNG HÓA */}
          <div className="column">
            <h4>HÀNG HÓA</h4>

            <p
              className={`menu-child ${isActive("/product-groups") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/product-groups");
              }}
            >
              Nhóm hàng hóa
            </p>

            <p
              className={`menu-child ${isActive("/products") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/products");
              }}
            >
              Hàng hóa
            </p>

            <p
              className={`menu-child ${isActive("/units") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/units");
              }}
            >
              Đơn vị tính
            </p>

            <p className="menu-child">In tem mã</p>

            <p
              className={`menu-child ${isActive("/price-list") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/price-list");
              }}
            >
              Bảng giá
            </p>

            <p
              className={`menu-child ${isActive("/inventory") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/inventory");
              }}
            >
              Kho
            </p>
          </div>

          {/* KHÁCH HÀNG */}
          <div className="column">
            <h4>KHÁCH HÀNG</h4>

            <p
              className={`menu-child ${isActive("/customer-groups") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/customer-groups");
              }}
            >
              Nhóm khách hàng
            </p>

           <p
              className={`menu-child ${isActive("/Customers") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/Customers");
              }}
            >
              Khách hàng
            </p>

            <p
              className={`menu-child ${isActive("/membership") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/membership");
              }}
            >
              Hạng thẻ
            </p>
          </div>

          {/* KHÁC */}
          <div className="column">
            <h4>KHÁC</h4>

            <p
              className={`menu-child ${isActive("/staff") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/staff");
              }}
            >
              Nhân viên
            </p>

            <p
              className={`menu-child ${isActive("/shifts") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/shifts");
              }}
            >
              Ca làm việc
            </p>

            <p
              className={`menu-child ${isActive("/channels") ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(null);
                navigate("/channels");
              }}
            >
              Kênh bán hàng
            </p>
          </div>
        </div>
      )}
    </div>
  );
}