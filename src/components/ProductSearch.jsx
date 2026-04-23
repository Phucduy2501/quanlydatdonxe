import { useState } from "react"

export default function ProductSearch({ products, onSelect }) {
  const [keyword, setKeyword] = useState("")
  const [show, setShow] = useState(false)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(keyword.toLowerCase())
  )

  return (
    <div className="search-box">
      <input
        placeholder="🔍 Tìm sản phẩm..."
        value={keyword}
        onChange={e => {
          setKeyword(e.target.value)
          setShow(true)
        }}
      />

      {show && keyword && (
        <div className="dropdown">
          {filtered.map(p => (
            <div
              key={p.id}
              className="item"
              onClick={() => {
                onSelect(p)
                setKeyword("")
                setShow(false)
              }}
            >
              {p.name} (tồn: {p.stock || 0})
            </div>
          ))}
        </div>
      )}
    </div>
  )
}