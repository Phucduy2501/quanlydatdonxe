import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./services/supabaseClient";

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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />

        {/* PRIVATE */}
        <Route
          path="/*"
          element={
            user ? <Layout user={user} /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



// 🔥 LAYOUT
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