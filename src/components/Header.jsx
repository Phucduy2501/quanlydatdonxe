import { useNavigate } from "react-router-dom";

export default function Header({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });

    // ép reload để App.jsx đọc lại localStorage
    window.location.reload();
  };

  return (
    <div
      style={{
        height: 50,
        background: "white",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
      }}
    >
      <div>
        📊 Dashboard
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span>{user?.email || "admin@gmail.com"}</span>

        <button
          onClick={handleLogout}
          style={{
            background: "#ff4d4f",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}