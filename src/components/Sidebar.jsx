import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";


export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeItem, setActiveItem] = useState("");
  const navigate = useNavigate();
  
  return (
    <div style={{ display: "flex", position: "relative" }}>
      
      <div className="sidebar">
        <h2 className="logo">MISAeShop</h2>

        <div
          className="menu-item active"
          onClick={() => {
            navigate("/");        
            setActiveMenu(null);  
          }}
        >
          📊 Tổng quan
        </div>

        <div
          className="menu-item"
          onMouseEnter={() => setActiveMenu("baocao")}
        >
          📈 Báo cáo
        </div>

        <div className="menu-item">🧾 Đơn hàng</div>
        <div className="menu-item">🛒 Mua hàng</div>
        <div className="menu-item">🏬 Kho</div>
        <div className="menu-item">💰 Quỹ tiền</div>
        <div className="menu-item">💸 Chi phí</div>

        <div
          className="menu-item"
          onMouseEnter={() => setActiveMenu("danhmuc")}
        >
          📦 Danh mục
        </div>
      </div>

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
              className={`menu-child ${activeItem === item ? "active" : ""}`}
              onClick={() => {
                setActiveItem(item);

                if (item === "Bán hàng") {
                  navigate("/sales"); 
                }
              }}
            >
              {item}
            </p>
          ))}
        </div>
      )}

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
            <p className="menu-child">Khách hàng</p>
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