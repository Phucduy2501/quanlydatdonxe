import { useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../index.css";

export default function Sidebar() {
  const location = useLocation();

  const [activeMenu, setActiveMenu] = useState(null);

  const closeTimer = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isGroupActive = (paths) => {
    return paths.some(
      (path) =>
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`)
    );
  };

  const openMenu = (menuName) => {
    clearTimeout(closeTimer.current);
    setActiveMenu(menuName);
  };

  const keepMenuOpen = () => {
    clearTimeout(closeTimer.current);
  };

  const closeMenuWithDelay = () => {
    clearTimeout(closeTimer.current);

    closeTimer.current = setTimeout(() => {
      setActiveMenu(null);
    }, 250);
  };

  const closeMenu = () => {
    clearTimeout(closeTimer.current);
    setActiveMenu(null);
  };

  const toggleMenu = (menuName) => {
    clearTimeout(closeTimer.current);

    setActiveMenu((currentMenu) =>
      currentMenu === menuName ? null : menuName
    );
  };

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🚌</div>

        <div>
          <h2 className="logo">TransitGo</h2>

          <span className="sidebar-brand-subtitle">
            Quản lý đặt vé xe
          </span>
        </div>
      </div>

      {/* MENU */}
      <div className="sidebar-menu">
        {/* TỔNG QUAN */}
        <NavLink
          to="/dashboard"
          className={`menu-item ${
            isActive("/dashboard") ? "active" : ""
          }`}
          onClick={closeMenu}
        >
          <span className="menu-icon">📊</span>
          <span>Tổng quan</span>
        </NavLink>

        {/* ĐẶT VÉ */}
        <div
          className={`menu-item menu-parent ${
            isGroupActive([
              "/bookings",
              "/tickets",
              "/payments",
            ])
              ? "active"
              : ""
          }`}
          onClick={() => toggleMenu("booking")}
          onMouseEnter={() => openMenu("booking")}
          onMouseLeave={closeMenuWithDelay}
        >
          <div className="menu-parent-content">
            <div className="menu-parent-left">
              <span className="menu-icon">🎫</span>
              <span>Đặt vé</span>
            </div>

            <span className="menu-arrow">
              {activeMenu === "booking" ? "‹" : "›"}
            </span>
          </div>

          {activeMenu === "booking" && (
            <div
              className="dropdown-menu small"
              onMouseEnter={keepMenuOpen}
              onMouseLeave={closeMenuWithDelay}
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/bookings"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>📋</span>
                <span>Danh sách đặt vé</span>
              </NavLink>

              <NavLink
                to="/tickets"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🎟️</span>
                <span>Vé xe</span>
              </NavLink>

              <NavLink
                to="/payments"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>💳</span>
                <span>Thanh toán</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* CHUYẾN XE */}
        <div
          className={`menu-item menu-parent ${
            isGroupActive([
              "/trips",
              "/routes",
              "/route-stops",
            ])
              ? "active"
              : ""
          }`}
          onClick={() => toggleMenu("trips")}
          onMouseEnter={() => openMenu("trips")}
          onMouseLeave={closeMenuWithDelay}
        >
          <div className="menu-parent-content">
            <div className="menu-parent-left">
              <span className="menu-icon">🗺️</span>
              <span>Chuyến xe</span>
            </div>

            <span className="menu-arrow">
              {activeMenu === "trips" ? "‹" : "›"}
            </span>
          </div>

          {activeMenu === "trips" && (
            <div
              className="dropdown-menu small"
              onMouseEnter={keepMenuOpen}
              onMouseLeave={closeMenuWithDelay}
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/trips"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🚌</span>
                <span>Danh sách chuyến</span>
              </NavLink>

              <NavLink
                to="/routes"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🛣️</span>
                <span>Tuyến đường</span>
              </NavLink>

              <NavLink
                to="/route-stops"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>📍</span>
                <span>Điểm dừng tuyến</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* BẾN VÀ TRẠM */}
        <div
          className={`menu-item menu-parent ${
            isGroupActive([
              "/stations",
              "/bus-stops",
            ])
              ? "active"
              : ""
          }`}
          onClick={() => toggleMenu("stations")}
          onMouseEnter={() => openMenu("stations")}
          onMouseLeave={closeMenuWithDelay}
        >
          <div className="menu-parent-content">
            <div className="menu-parent-left">
              <span className="menu-icon">🚏</span>
              <span>Bến và trạm</span>
            </div>

            <span className="menu-arrow">
              {activeMenu === "stations" ? "‹" : "›"}
            </span>
          </div>

          {activeMenu === "stations" && (
            <div
              className="dropdown-menu small"
              onMouseEnter={keepMenuOpen}
              onMouseLeave={closeMenuWithDelay}
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/stations"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🏢</span>
                <span>Bến xe</span>
              </NavLink>

              <NavLink
                to="/bus-stops"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🚏</span>
                <span>Trạm dừng</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* PHƯƠNG TIỆN */}
        <div
          className={`menu-item menu-parent ${
            isGroupActive([
              "/buses",
              "/bus-types",
              "/bus-seats",
              "/maintenance",
            ])
              ? "active"
              : ""
          }`}
          onClick={() => toggleMenu("buses")}
          onMouseEnter={() => openMenu("buses")}
          onMouseLeave={closeMenuWithDelay}
        >
          <div className="menu-parent-content">
            <div className="menu-parent-left">
              <span className="menu-icon">🚍</span>
              <span>Phương tiện</span>
            </div>

            <span className="menu-arrow">
              {activeMenu === "buses" ? "‹" : "›"}
            </span>
          </div>

          {activeMenu === "buses" && (
            <div
              className="dropdown-menu small"
              onMouseEnter={keepMenuOpen}
              onMouseLeave={closeMenuWithDelay}
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/buses"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🚌</span>
                <span>Danh sách xe</span>
              </NavLink>

              <NavLink
                to="/bus-types"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🚐</span>
                <span>Loại xe</span>
              </NavLink>

              <NavLink
                to="/bus-seats"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>💺</span>
                <span>Sơ đồ ghế</span>
              </NavLink>

              <NavLink
                to="/maintenance"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>🔧</span>
                <span>Bảo trì xe</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* TÀI XẾ */}
        <NavLink
          to="/drivers"
          className={`menu-item ${
            isActive("/drivers") ? "active" : ""
          }`}
          onClick={closeMenu}
        >
          <span className="menu-icon">👨‍✈️</span>
          <span>Tài xế</span>
        </NavLink>

        {/* KHÁCH HÀNG */}
        <NavLink
          to="/customers"
          className={`menu-item ${
            isActive("/customers") ? "active" : ""
          }`}
          onClick={closeMenu}
        >
          <span className="menu-icon">👥</span>
          <span>Khách hàng</span>
        </NavLink>

        {/* NHÂN VIÊN */}
        <NavLink
          to="/staff"
          className={`menu-item ${
            isActive("/staff") ? "active" : ""
          }`}
          onClick={closeMenu}
        >
          <span className="menu-icon">🧑‍💼</span>
          <span>Nhân viên</span>
        </NavLink>

        {/* ĐÁNH GIÁ */}
        <NavLink
          to="/reviews"
          className={`menu-item ${
            isActive("/reviews") ? "active" : ""
          }`}
          onClick={closeMenu}
        >
          <span className="menu-icon">⭐</span>
          <span>Đánh giá</span>
        </NavLink>

        {/* THÔNG BÁO */}
        <NavLink
          to="/notifications"
          className={`menu-item ${
            isActive("/notifications") ? "active" : ""
          }`}
          onClick={closeMenu}
        >
          <span className="menu-icon">🔔</span>
          <span>Thông báo</span>
        </NavLink>

        {/* HỆ THỐNG */}
        <div
          className={`menu-item menu-parent ${
            isGroupActive([
              "/users",
              "/settings",
            ])
              ? "active"
              : ""
          }`}
          onClick={() => toggleMenu("system")}
          onMouseEnter={() => openMenu("system")}
          onMouseLeave={closeMenuWithDelay}
        >
          <div className="menu-parent-content">
            <div className="menu-parent-left">
              <span className="menu-icon">⚙️</span>
              <span>Hệ thống</span>
            </div>

            <span className="menu-arrow">
              {activeMenu === "system" ? "‹" : "›"}
            </span>
          </div>

          {activeMenu === "system" && (
            <div
              className="dropdown-menu small"
              onMouseEnter={keepMenuOpen}
              onMouseLeave={closeMenuWithDelay}
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/users"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>👤</span>
                <span>Tài khoản</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <span>⚙️</span>
                <span>Cấu hình</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <span>TransitGo Management</span>
        <small>Version 1.0.0</small>
      </div>
    </aside>
  );
}