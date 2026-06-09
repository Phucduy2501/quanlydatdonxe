import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Header({ user }) {
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div style={{
      height: 60,
      background: "#fff",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px"
    }}>
      <div>📊 Dashboard</div>

      <div style={{ display: "flex", gap: 10 }}>
        <span>{user?.email}</span>

        <button onClick={logout} style={{
          background: "#ff4d4f",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: 6
        }}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}