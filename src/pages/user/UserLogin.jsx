import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin } from "../../services/api";
import "./user.css";

export default function UserLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) return alert("Vui lòng nhập email");
    if (!form.password.trim()) return alert("Vui lòng nhập mật khẩu");

    try {
      const res = await apiLogin(form.email, form.password);

      if (res?.user?.role === "admin") {
        alert("Tài khoản admin vui lòng đăng nhập ở trang Admin");
        navigate("/login");
        return;
      }

      localStorage.setItem("customer_token", res.token);
      localStorage.setItem("customer_user", JSON.stringify(res.user));

      alert("Đăng nhập thành công");
      navigate("/user/search");
    } catch (error) {
      alert(error.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="user-auth-page">
      <div className="user-auth-card">
        <div className="auth-logo">🚌</div>

        <h2>Đăng nhập khách hàng</h2>
        <p>Đăng nhập để đặt vé và tra cứu vé của bạn.</p>

        <form onSubmit={handleLogin} className="auth-form">
          <label>Email</label>
          <input
            placeholder="Nhập email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label>Mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button type="submit">Đăng nhập</button>
        </form>

        <div className="auth-bottom">
          Chưa có tài khoản?{" "}
          <span onClick={() => navigate("/user/register")}>Đăng ký ngay</span>
        </div>

        <button className="back-home" onClick={() => navigate("/user")}>
          ← Về trang chủ
        </button>
      </div>
    </div>
  );
}