import { useState } from "react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "Backend riêng đang hoạt động",
      message: "Dữ liệu hiện đang lưu bằng server Node.js, không dùng Supabase nữa.",
    },
  ];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 20,
        }}
      >
        🔔
      </button>

      {notifications.length > 0 && (
        <span
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            background: "red",
            color: "white",
            borderRadius: "50%",
            fontSize: 11,
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {notifications.length}
        </span>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 35,
            width: 280,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 8,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            zIndex: 9999,
            padding: 12,
          }}
        >
          <h4 style={{ margin: "0 0 8px" }}>Thông báo</h4>

          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <b>{n.title}</b>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                {n.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}