import { useState } from "react";

export default function Membership() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");

  return (
    <div className="page">
      <h2>Hạng thẻ</h2>

      <div className="toolbar">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên hạng..." />
        <button onClick={() => {
          if (!name) return;
          setData([...data, { id: Date.now(), name }]);
          setName("");
        }}>+ Thêm</button>
      </div>

      <table>
        <thead><tr><th>Hạng</th></tr></thead>
        <tbody>{data.map(i => <tr key={i.id}><td>{i.name}</td></tr>)}</tbody>
      </table>
    </div>
  );
}