import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function CustomerGroups() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from("customer_groups").select("*");
    setGroups(data || []);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (editing) {
      await supabase
        .from("customer_groups")
        .update({ name })
        .eq("id", editing.id);
      setEditing(null);
    } else {
      await supabase.from("customer_groups").insert([{ name }]);
    }

    setName("");
    fetchGroups();
  };

  const handleEdit = (g) => {
    setName(g.name);
    setEditing(g);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xoá nhóm này?")) return;
    await supabase.from("customer_groups").delete().eq("id", id);
    fetchGroups();
  };

  return (
    <div className="staff-page">
      <h2>👥 Nhóm khách hàng</h2>

      <div className="staff-toolbar">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nhóm..."
        />
        <button onClick={handleSave}>
          {editing ? "✔ Lưu" : "+ Thêm"}
        </button>
      </div>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên nhóm</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {groups.map((g, i) => (
              <tr key={g.id}>
                <td>{i + 1}</td>
                <td>{g.name}</td>
                <td>
                  <button onClick={() => handleEdit(g)}>Sửa</button>
                  <button onClick={() => handleDelete(g.id)}>Xoá</button>
                </td>
              </tr>
            ))}

            {groups.length === 0 && (
              <tr>
                <td colSpan="3" className="empty">
                  Chưa có nhóm
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}