import { useEffect, useState } from "react"
import { supabase } from "../services/supabaseClient"
import NotificationBell from "../components/NotificationBell"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js"

import { Line, Bar, Pie } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
)

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])
  const [expenses, setExpenses] = useState([])

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: o } = await supabase.from("orders").select("*")
    const { data: i } = await supabase.from("order_items").select("*")
    const { data: p } = await supabase.from("products").select("*")
    const { data: e } = await supabase.from("expenses").select("*")

    setOrders(o || [])
    setItems(i || [])
    setProducts(p || [])
    setExpenses(e || [])
  }

  // =========================
  // FILTER FIX (QUAN TRỌNG)
  // =========================
  const filterByDate = (arr) => {
    if (!fromDate || !toDate) return arr

    const from = new Date(fromDate)
    const to = new Date(toDate)
    to.setHours(23, 59, 59)

    return arr.filter(i => {
      if (!i.created_at) return false
      const d = new Date(i.created_at)
      return d >= from && d <= to
    })
  }

  const filterOrders = filterByDate(orders)
  const filterItems = filterByDate(items)
  const filterExpenses = filterByDate(expenses)

  // =========================
  // KPI
  // =========================
  const revenue = filterOrders.reduce((s, o) => s + Number(o.total || 0), 0)
  const cost = filterExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const profit = revenue - cost

  const stock = products.reduce((s, p) => s + Number(p.stock || 0), 0)

  // =========================
  // GROUP BY DATE (FIX SAI NGÀY)
  // =========================
  const group = {}

  filterOrders.forEach(o => {
    if (!o.created_at) return

    const d = new Date(o.created_at)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD

    group[key] = (group[key] || 0) + Number(o.total || 0)
  })

  const sortedDates = Object.keys(group).sort()

  const lineData = {
    labels: sortedDates,
    datasets: [
      {
        label: "Doanh thu",
        data: sortedDates.map(d => group[d]),
        borderColor: "#4caf50",
        backgroundColor: "rgba(76,175,80,0.2)",
        tension: 0.4
      }
    ]
  }

  // =========================
  // TOP PRODUCT (FIX CHẬM)
  // =========================
  const productMap = {}

  filterItems.forEach(i => {
    const name =
      products.find(p => p.id === i.product_id)?.name || "Không tên"

    productMap[name] =
      (productMap[name] || 0) + Number(i.quantity * i.price)
  })

  const sortedProducts = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const pieData = {
    labels: sortedProducts.map(p => p[0]),
    datasets: [
      {
        data: sortedProducts.map(p => p[1]),
        backgroundColor: ["#4caf50", "#2196f3", "#ff9800", "#e91e63", "#9c27b0"]
      }
    ]
  }

  // =========================
  // BAR
  // =========================
  const barData = {
    labels: ["Doanh thu", "Chi phí", "Lợi nhuận"],
    datasets: [
      {
        data: [revenue, cost, profit],
        backgroundColor: ["#4caf50", "#f44336", "#2196f3"]
      }
    ]
  }

  return (
    <div className="dashboard">
      <div className="topbar">
        <h2>Tổng quan</h2>
        <NotificationBell />
      </div>

      {/* FILTER */}
      <div className="filter">
        <input type="date" onChange={e => setFromDate(e.target.value)} />
        <input type="date" onChange={e => setToDate(e.target.value)} />
      </div>

      {/* KPI */}
      <div className="cards">
        <div className="card green">
          <h4>Doanh thu</h4>
          <p>{revenue.toLocaleString()} đ</p>
        </div>

        <div className="card red">
          <h4>Chi phí</h4>
          <p>{cost.toLocaleString()} đ</p>
        </div>

        <div className="card blue">
          <h4>Lợi nhuận</h4>
          <p>{profit.toLocaleString()} đ</p>
        </div>

        <div className="card">
          <h4>Tồn kho</h4>
          <p>{stock}</p>
        </div>
      </div>

      {/* CHART */}
      <div className="charts-grid">
        <div className="chart-box big">
          <h4>Doanh thu theo ngày</h4>
          <Line data={lineData} />
        </div>

        <div className="chart-box">
          <h4>Tài chính</h4>
          <Bar data={barData} />
        </div>

        <div className="chart-box">
          <h4>Top sản phẩm</h4>
          <Pie data={pieData} />
        </div>
      </div>
    </div>
  )
}