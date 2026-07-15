import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("admin@transitgo.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (
      cleanEmail !== "admin@transitgo.com" ||
      cleanPassword !== "123456"
    ) {
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }

    setLoading(true);

    const user = {
      id: 1,
      name: "TransitGo Administrator",
      email: cleanEmail,
      role: "admin",
    };

    localStorage.setItem("token", "transitgo-demo-token");
    localStorage.setItem("user", JSON.stringify(user));

    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 300);
  };

  return (
    <main className="login-page">
      <div className="background-grid" />
      <div className="background-circle circle-one" />
      <div className="background-circle circle-two" />

      <section className="login-container">
        <div className="login-brand">
          <div className="brand-icon">🚌</div>

          <div className="brand-content">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@transitgo.com"
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập →"}
            </button>
          </form>

          <div className="default-account">
            <div className="account-icon">🔑</div>

            <div>
              <p>Tài khoản dùng thử</p>
              <strong>admin@transitgo.com</strong>
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