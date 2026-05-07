import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");

  // ================= LOAD =================
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= ADD =================
  const addProduct = async () => {
    if (!name) return alert("Nhập tên sản phẩm");

    const { error } = await supabase.from("products").insert([
      {
        name,
        price: Number(price) || 0,
        stock: 0,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setPrice("");
    fetchData();
  };

  // ================= DELETE =================
  const removeProduct = async (id) => {
    if (!confirm("Xóa sản phẩm?")) return;

    await supabase.from("products").delete().eq("id", id);
    fetchData();
  };

  // ================= UPDATE =================
  const updateProduct = async (p) => {
    const newName = prompt("Tên mới:", p.name);
    const newPrice = prompt("Giá mới:", p.price);

    if (!newName) return;

    await supabase
      .from("products")
      .update({
        name: newName,
        price: Number(newPrice) || 0,
      })
      .eq("id", p.id);

    fetchData();
  };

  // ================= FILTER =================
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h2>📦 Sản phẩm</h2>

      {/* ADD */}
      <div className="toolbar">
        <input
          placeholder="Tên sản phẩm..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Giá"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={addProduct}>+ Thêm</button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="🔍 Tìm sản phẩm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginTop: 10 }}
      />

      {/* TABLE */}
      <table style={{ marginTop: 15 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th>Giá</th>
            <th>Tồn</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td>{p.stock || 0}</td>
              <td>
                <button onClick={() => updateProduct(p)}>Sửa</button>
                <button onClick={() => removeProduct(p.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}