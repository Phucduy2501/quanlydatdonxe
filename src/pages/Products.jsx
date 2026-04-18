import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function Products() {
  const [products, setProducts] = useState([]);

  const fetchData = async () => {
    const { data } = await supabase.from("products").select("*");
    setProducts(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h2>Sản phẩm</h2>

      {products.map((p) => (
        <div key={p.id}>
          {p.name} - {p.price}
        </div>
      ))}
    </div>
  );
}