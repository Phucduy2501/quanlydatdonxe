import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin } from "../services/api";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("admin@transitgo.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    setLoading(true);

    try {
      const data = await apiLogin(email.trim().toLowerCase(), password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      alert(
        error.message ||
          "Không thể đăng nhập. Vui lòng kiểm tra lại tài khoản!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-background-circle circle-one" />
      <div className="login-background-circle circle-two" />

      <section className="login-container">
        <div className="login-brand">
          <div className="brand-icon">🚌</div>

          <div>
            <h1>TransitGo</h1>
            <p>Di chuyển thông minh, hành trình thuận tiện</p>
          </div>
        </div>

        <div className="login-card">
          <div className="login-header">
            <span className="welcome-text">Chào mừng trở lại</span>
            <h2>Đăng nhập hệ thống</h2>
            <p>
              Nhập thông tin tài khoản để truy cập hệ thống quản lý TransitGo.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Địa chỉ email</label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  id="email"
                  type="email"
                  placeholder="admin@transitgo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">Mật khẩu</label>
              </div>

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading}
                  aria-label={
                    showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                  }
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="default-account">
            <div className="account-icon">🔑</div>

            <div>
              <p>Tài khoản dùng thử</p>
              <span>
                <strong>admin@transitgo.com</strong>
              </span>
              <span>Mật khẩu: 123456</span>
            </div>
          </div>

          <p className="login-footer">
            © 2026 TransitGo. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}