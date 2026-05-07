import { useState } from "react";

export default function BaseCategory({ title }) {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleAdd = () => {
    if (!name) return;
    setData([...data, { id: Date.now(), name, desc }]);
    setName("");
    setDesc("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{title}</h2>

      {/* FORM */}
      <div style={{ margin: "10px 0", display: "flex", gap: 10 }}>
        <input
          placeholder="Tên..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Mô tả..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button onClick={handleAdd}>+ Thêm</button>
      </div>

      {/* TABLE */}
      <table style={{ width: "100%", marginTop: 10 }}>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}