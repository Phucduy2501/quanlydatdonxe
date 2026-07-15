import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCreate, apiLogin } from "../../services/api";
import "./user.css";

export default function UserRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert("Vui lòng nhập họ tên");
    if (!form.phone.trim()) return alert("Vui lòng nhập số điện thoại");
    if (!form.email.trim()) return alert("Vui lòng nhập email");
    if (!form.password.trim()) return alert("Vui lòng nhập mật khẩu");

    try {
      await apiCreate("users", {
        name: form.name,
        phone: form.phone,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: "customer",
        status: "active",
      });

      const res = await apiLogin(form.email, form.password);

      localStorage.setItem("customer_token", res.token);
      localStorage.setItem("customer_user", JSON.stringify(res.user));

      alert("Đăng ký thành công");
      navigate("/user/search");
    } catch (error) {
      alert(error.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="user-auth-page">
      <div className="user-auth-card">
        <div className="auth-logo">🚌</div>

        <h2>Đăng ký tài khoản</h2>
        <p>Tạo tài khoản để đặt vé xe nhanh hơn.</p>

        <form onSubmit={handleRegister} className="auth-form">
          <label>Họ tên</label>
          <input
            placeholder="Nhập họ tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label>Số điện thoại</label>
          <input
            placeholder="Nhập số điện thoại"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

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

          <button type="submit">Đăng ký</button>
        </form>

        <div className="auth-bottom">
          Đã có tài khoản?{" "}
          <span onClick={() => navigate("/user/login")}>Đăng nhập</span>
        </div>

        <button className="back-home" onClick={() => navigate("/user")}>
          ← Về trang chủ
        </button>
      </div>
    </div>
  );
}