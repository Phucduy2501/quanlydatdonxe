import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "../index.css";

export default function Sidebar() {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);

  const isActive = (path) => location.pathname === path;

  const isGroupActive = (paths) => {
    return paths.some(
      (path) =>
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`)
    );
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  const toggleMenu = (menuName) => {
    setActiveMenu((current) =>
      current === menuName ? null : menuName
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🚌</div>

        <div>
          <h2 className="logo">TransitGo</h2>
          <span className="sidebar-brand-subtitle">
            Quản lý đặt vé xe
          </span>
        </div>
      </div>

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
          onMouseEnter={() => setActiveMenu("booking")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="menu-parent-content">
            <div>
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
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/bookings"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                📋 Danh sách đặt vé
              </NavLink>

              <NavLink
                to="/tickets"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🎟️ Vé xe
              </NavLink>

              <NavLink
                to="/payments"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                💳 Thanh toán
              </NavLink>
            </div>
          )}
        </div>

        {/* CHUYẾN XE */}
        <div
          className={`menu-item menu-parent ${
            isGroupActive(["/trips", "/routes", "/route-stops"])
              ? "active"
              : ""
          }`}
          onClick={() => toggleMenu("trips")}
          onMouseEnter={() => setActiveMenu("trips")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="menu-parent-content">
            <div>
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
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/trips"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🚌 Danh sách chuyến
              </NavLink>

              <NavLink
                to="/routes"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🛣️ Tuyến đường
              </NavLink>

              <NavLink
                to="/route-stops"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                📍 Điểm dừng tuyến
              </NavLink>
            </div>
          )}
        </div>

        {/* BẾN VÀ TRẠM */}
        <div
          className={`menu-item menu-parent ${
            isGroupActive(["/stations", "/bus-stops"])
              ? "active"
              : ""
          }`}
          onClick={() => toggleMenu("stations")}
          onMouseEnter={() => setActiveMenu("stations")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="menu-parent-content">
            <div>
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
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/stations"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🏢 Bến xe
              </NavLink>

              <NavLink
                to="/bus-stops"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🚏 Trạm dừng
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
          onMouseEnter={() => setActiveMenu("buses")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="menu-parent-content">
            <div>
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
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/buses"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🚌 Danh sách xe
              </NavLink>

              <NavLink
                to="/bus-types"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🚐 Loại xe
              </NavLink>

              <NavLink
                to="/bus-seats"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                💺 Sơ đồ ghế
              </NavLink>

              <NavLink
                to="/maintenance"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                🔧 Bảo trì xe
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
            isGroupActive(["/users", "/settings"]) ? "active" : ""
          }`}
          onClick={() => toggleMenu("system")}
          onMouseEnter={() => setActiveMenu("system")}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="menu-parent-content">
            <div>
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
              onClick={(event) => event.stopPropagation()}
            >
              <NavLink
                to="/users"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                👤 Tài khoản
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive: active }) =>
                  `dropdown-link ${active ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                ⚙️ Cấu hình
              </NavLink>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <span>TransitGo Management</span>
        <small>Version 1.0.0</small>
      </div>
    </aside>
  );
}