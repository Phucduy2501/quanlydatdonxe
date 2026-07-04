import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  }
}

function App() {
  const user = getUserFromLocalStorage();

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />

        {/* PRIVATE */}
        <Route
          path="/*"
          element={
            user ? <Layout user={user} /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// LAYOUT
function Layout({ user }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Header user={user} />

        <div style={{ padding: 20 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />

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
            <Route path="/product-groups" element={<ProductGroups />} />
            <Route path="/units" element={<Units />} />
            <Route path="/price-list" element={<PriceList />} />

            {/* CUSTOMER */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customer-groups" element={<CustomerGroups />} />
            <Route path="/membership" element={<Membership />} />

            {/* STAFF */}
            <Route path="/staff" element={<Staff />} />
            <Route path="/shifts" element={<Shifts />} />

            {/* CHANNEL */}
            <Route path="/channels" element={<Channels />} />

            {/* 404 */}
            <Route path="*" element={<div>❌ Không tìm thấy</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}