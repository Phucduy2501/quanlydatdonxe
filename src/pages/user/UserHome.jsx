import { useNavigate } from "react-router-dom";
import "./user.css";

function getCustomer() {
  const raw = localStorage.getItem("customer_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function UserHome() {
  const navigate = useNavigate();
  const customer = getCustomer();

  const logoutCustomer = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    navigate("/user");
    window.location.reload();
  };

  return (
    <div className="user-web">
      <header className="user-navbar">
        <div className="user-brand" onClick={() => navigate("/user")}>
          <div className="brand-icon">🚌</div>
          <div>
            <h2>TransitGo</h2>
            <span>Đặt vé xe nhanh chóng</span>
          </div>
        </div>

        <nav>
          <button onClick={() => navigate("/user")}>Trang chủ</button>
          <button onClick={() => navigate("/user/search")}>Tìm chuyến</button>
          <button onClick={() => navigate("/user/my-ticket")}>Tra cứu vé</button>

          {customer ? (
            <>
              <button className="user-name-btn">👤 {customer.name || customer.email}</button>
              <button onClick={logoutCustomer}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/user/login")}>Đăng nhập</button>
              <button onClick={() => navigate("/user/register")}>Đăng ký</button>
            </>
          )}

          <button className="admin-link" onClick={() => navigate("/login")}>
            Admin
          </button>
        </nav>
      </header>

      <section className="hero-new">
        <div className="hero-overlay"></div>

        <div className="hero-left">
          <div className="hero-badge">🎫 Nền tảng đặt vé xe trực tuyến</div>

          <h1>
            Đặt vé xe dễ dàng,
            <br />
            đi đâu cũng tiện
          </h1>

          <p>
            Tìm chuyến xe, chọn lịch khởi hành, đặt vé và tra cứu thông tin vé
            nhanh chóng ngay trên hệ thống TransitGo.
          </p>

          <div className="hero-actions">
            <button onClick={() => navigate("/user/search")}>
              Tìm chuyến ngay →
            </button>

            <button
              className="outline"
              onClick={() => navigate("/user/my-ticket")}
            >
              Tra cứu vé
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <b>120+</b>
              <span>Chuyến xe</span>
            </div>
            <div>
              <b>20+</b>
              <span>Tuyến đường</span>
            </div>
            <div>
              <b>5.000+</b>
              <span>Khách hàng</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="quick-search-card">
            <h3>🔍 Tìm chuyến nhanh</h3>
            <p>Nhập thông tin để tìm chuyến xe phù hợp.</p>

            <div className="quick-form">
              <label>Điểm đi</label>
              <input placeholder="VD: Đà Nẵng" />

              <label>Điểm đến</label>
              <input placeholder="VD: Huế" />

              <label>Ngày đi</label>
              <input type="date" />

              <button onClick={() => navigate("/user/search")}>
                Tìm chuyến xe
              </button>
            </div>
          </div>

          <div className="floating-ticket">
            <span>🎫</span>
            <div>
              <b>Vé điện tử</b>
              <p>Tra cứu nhanh bằng mã vé</p>
            </div>
          </div>
        </div>
      </section>

      <section className="popular-section">
        <div className="section-title">
          <h2>Tuyến xe phổ biến</h2>
          <p>Các tuyến được khách hàng lựa chọn nhiều.</p>
        </div>

        <div className="popular-grid">
          <div className="popular-card">
            <div className="route-icon">🌉</div>
            <h3>Đà Nẵng → Huế</h3>
            <p>Khởi hành mỗi ngày</p>
            <b>Từ 120.000đ</b>
          </div>

          <div className="popular-card">
            <div className="route-icon">🏖️</div>
            <h3>Đà Nẵng → Hội An</h3>
            <p>Nhiều khung giờ linh hoạt</p>
            <b>Từ 80.000đ</b>
          </div>

          <div className="popular-card">
            <div className="route-icon">⛰️</div>
            <h3>Huế → Quảng Bình</h3>
            <p>Xe chất lượng cao</p>
            <b>Từ 180.000đ</b>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <div className="section-title">
          <h2>Đặt vé chỉ với 3 bước</h2>
          <p>Quy trình đơn giản, dễ sử dụng cho mọi khách hàng.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span>01</span>
            <h3>Tìm chuyến</h3>
            <p>Nhập điểm đi, điểm đến và ngày khởi hành.</p>
          </div>

          <div className="step-card">
            <span>02</span>
            <h3>Đặt vé</h3>
            <p>Đăng nhập, chọn chuyến xe và nhập thông tin hành khách.</p>
          </div>

          <div className="step-card">
            <span>03</span>
            <h3>Tra cứu vé</h3>
            <p>Kiểm tra vé bằng mã vé hoặc số điện thoại.</p>
          </div>
        </div>
      </section>
    </div>
  );
}