import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../index.css";

export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const isGroupActive = (paths) => {
    return paths.includes(location.pathname);
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  return (
    <div className="sidebar">
      <h2 className="logo">MISAeShop</h2>

      <NavLink
        to="/"
        className={`menu-item ${isActive("/") ? "active" : ""}`}
        onClick={closeMenu}
      >
        📊 Tổng quan
      </NavLink>

      {/* BÁO CÁO */}
      <div
        className={`menu-item menu-parent ${
          isGroupActive(["/sales", "/multi-sales", "/profit"]) ? "active" : ""
        }`}
        onMouseEnter={() => setActiveMenu("baocao")}
      >
        📈 Báo cáo

        {activeMenu === "baocao" && (
          <div
            className="dropdown-menu small"
            onMouseEnter={() => setActiveMenu("baocao")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <NavLink to="/sales" className="dropdown-link" onClick={closeMenu}>
              Bán hàng
            </NavLink>

            <NavLink
              to="/multi-sales"
              className="dropdown-link"
              onClick={closeMenu}
            >
              Bán đa kênh
            </NavLink>

            <NavLink to="/profit" className="dropdown-link" onClick={closeMenu}>
              Lợi nhuận
            </NavLink>
          </div>
        )}
      </div>

      <NavLink
        to="/orders"
        className={`menu-item ${isActive("/orders") ? "active" : ""}`}
        onClick={closeMenu}
      >
        🧾 Đơn hàng
      </NavLink>

      <NavLink
        to="/purchase"
        className={`menu-item ${isActive("/purchase") ? "active" : ""}`}
        onClick={closeMenu}
      >
        🛒 Mua hàng
      </NavLink>

      <NavLink
        to="/inventory"
        className={`menu-item ${isActive("/inventory") ? "active" : ""}`}
        onClick={closeMenu}
      >
        🏬 Kho
      </NavLink>

      <NavLink
        to="/cash"
        className={`menu-item ${isActive("/cash") ? "active" : ""}`}
        onClick={closeMenu}
      >
        💰 Quỹ tiền
      </NavLink>

      <NavLink
        to="/debts"
        className={`menu-item ${isActive("/debts") ? "active" : ""}`}
        onClick={closeMenu}
      >
        📒 Công nợ
      </NavLink>

      <NavLink
        to="/expenses"
        className={`menu-item ${isActive("/expenses") ? "active" : ""}`}
        onClick={closeMenu}
      >
        💸 Chi phí
      </NavLink>

      {/* DANH MỤC */}
      <div
        className={`menu-item menu-parent ${
          isGroupActive([
            "/product-groups",
            "/products",
            "/units",
            "/price-list",
            "/customers",
            "/customer-groups",
            "/membership",
            "/staff",
            "/shifts",
            "/channels",
          ])
            ? "active"
            : ""
        }`}
        onMouseEnter={() => setActiveMenu("danhmuc")}
      >
        📦 Danh mục

        {activeMenu === "danhmuc" && (
          <div
            className="dropdown-menu big"
            onMouseEnter={() => setActiveMenu("danhmuc")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <div className="column">
              <h4>HÀNG HÓA</h4>

              <NavLink
                to="/product-groups"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Nhóm hàng
              </NavLink>

              <NavLink
                to="/products"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Hàng hóa
              </NavLink>

              <NavLink
                to="/units"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Đơn vị
              </NavLink>

              <NavLink
                to="/price-list"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Bảng giá
              </NavLink>
            </div>

            <div className="column">
              <h4>KHÁCH HÀNG</h4>

              <NavLink
                to="/customers"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Khách hàng
              </NavLink>

              <NavLink
                to="/customer-groups"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Nhóm KH
              </NavLink>

              <NavLink
                to="/membership"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Hạng thẻ
              </NavLink>
            </div>

            <div className="column">
              <h4>KHÁC</h4>

              <NavLink
                to="/staff"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Nhân viên
              </NavLink>

              <NavLink
                to="/shifts"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Ca làm
              </NavLink>

              <NavLink
                to="/channels"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Kênh
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}