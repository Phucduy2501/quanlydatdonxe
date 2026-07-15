import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// CORE
import Dashboard from "./pages/Dashboard";

// SALES
import Sales from "./pages/Sales";
import SalesMulti from "./pages/SalesMulti";
import Orders from "./pages/Orders";

// PURCHASE
import Purchases from "./pages/Purchases";

// FINANCE
import Cashbook from "./pages/Cashbook";
import Expenses from "./pages/Expenses";
import Profit from "./pages/Profit";
import Debts from "./pages/Debts";

// INVENTORY
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";

// CATEGORY
import ProductGroups from "./pages/ProductGroups";
import Units from "./pages/Units";
import PriceList from "./pages/PriceList";

// CUSTOMER
import Customers from "./pages/Customers";
import CustomerGroups from "./pages/CustomerGroups";
import Membership from "./pages/Membership";

// STAFF
import Staff from "./pages/Staff";
import Shifts from "./pages/Shifts";

// CHANNEL
import Channels from "./pages/Channels";

function getUserFromLocalStorage() {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Dữ liệu user không hợp lệ:", error);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return null;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  // Khi navigate sang trang khác, useLocation làm component render lại
  // và đọc lại user mới từ localStorage.
  useLocation();

  const user = getUserFromLocalStorage();

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      {/* PRIVATE AREA */}
      <Route
        path="/*"
        element={
          user ? (
            <Layout user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function Layout({ user }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f7fb",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header user={user} />

        <main
          style={{
            flex: 1,
            padding: "20px",
            overflowX: "auto",
          }}
        >
          <Routes>
            {/* DASHBOARD */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* SALES */}
            <Route path="/sales" element={<Sales />} />
            <Route path="/multi-sales" element={<SalesMulti />} />
            <Route path="/orders" element={<Orders />} />

            {/* PURCHASE */}
            <Route path="/purchase" element={<Purchases />} />

            {/* INVENTORY */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/products" element={<Products />} />

            {/* FINANCE */}
            <Route path="/cash" element={<Cashbook />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/profit" element={<Profit />} />
            <Route path="/debts" element={<Debts />} />

            {/* CATEGORY */}
            <Route
              path="/product-groups"
              element={<ProductGroups />}
            />
            <Route path="/units" element={<Units />} />
            <Route path="/price-list" element={<PriceList />} />

            {/* CUSTOMER */}
            <Route path="/customers" element={<Customers />} />
            <Route
              path="/customer-groups"
              element={<CustomerGroups />}
            />
            <Route path="/membership" element={<Membership />} />

            {/* STAFF */}
            <Route path="/staff" element={<Staff />} />
            <Route path="/shifts" element={<Shifts />} />

            {/* CHANNEL */}
            <Route path="/channels" element={<Channels />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    background: "#ffffff",
                    borderRadius: "12px",
                  }}
                >
                  <h2>404</h2>
                  <p>Không tìm thấy trang bạn yêu cầu.</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}