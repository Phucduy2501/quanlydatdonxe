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

    const channel = supabase
      .channel("realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData)
      .subscribe()

    return () => supabase.removeChannel(channel)
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
  // FILTER
  // =========================
  const filterByDate = (arr) => {
    if (!fromDate || !toDate) return arr
    return arr.filter(i =>
      new Date(i.created_at) >= new Date(fromDate) &&
      new Date(i.created_at) <= new Date(toDate)
    )
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
  // LINE CHART
  // =========================
  const group = {}

  filterOrders.forEach(o => {
    if (!o.created_at) return
    const d = new Date(o.created_at).toLocaleDateString("vi-VN")
    group[d] = (group[d] || 0) + Number(o.total || 0)
  })

  const sortedDates = Object.keys(group).sort(
    (a, b) => new Date(a) - new Date(b)
  )

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
  // PIE (TOP PRODUCT)
  // =========================
  const productMap = {}

  filterItems.forEach(i => {
    const product = products.find(p => p.id === i.product_id)
    const name = product?.name || "Không tên"

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
        label: "VNĐ",
        data: [revenue, cost, profit],
        backgroundColor: ["#4caf50", "#f44336", "#2196f3"]
      }
    ]
  }

  return (
    <div className="dashboard">
      <div className="topbar">
        <h2>📊 Tổng quan</h2>
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
          <h4>💰 Doanh thu</h4>
          <p>{revenue.toLocaleString()} đ</p>
        </div>

        <div className="card red">
          <h4>💸 Chi phí</h4>
          <p>{cost.toLocaleString()} đ</p>
        </div>

        <div className="card blue">
          <h4>📉 Lợi nhuận</h4>
          <p>{profit.toLocaleString()} đ</p>
        </div>

        <div className="card">
          <h4>📦 Tồn kho</h4>
          <p>{stock}</p>
        </div>
      </div>

      {/* CHART */}
      <div className="charts-grid">
        <div className="chart-box big">
          <h4>📈 Doanh thu theo ngày</h4>
          <Line data={lineData} />
        </div>

        <div className="chart-box">
          <h4>📊 Tài chính</h4>
          <Bar data={barData} />
        </div>

        <div className="chart-box">
          <h4>🔥 Top sản phẩm</h4>
          <Pie data={pieData} />
        </div>
      </div>
    </div>
  )
}