import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const channel = supabase
      .channel("orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        setCount(c => c + 1)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div style={{ position: "relative" }}>
      🔔
      {count > 0 && (
        <span style={{
          position: "absolute",
          top: -5,
          right: -10,
          background: "red",
          color: "white",
          borderRadius: "50%",
          padding: "2px 6px",
          fontSize: 12
        }}>
          {count}
        </span>
      )}
    </div>
  )
}