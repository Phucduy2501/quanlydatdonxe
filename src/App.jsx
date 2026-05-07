import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

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
import Products from "./pages/Products"; // 🔥 thêm cái này

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
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Sidebar />

        <div style={{ flex: 1, padding: 20 }}>
          <Routes>

            {/* DASHBOARD */}
            <Route path="/" element={<Dashboard />} />

            {/* SALES */}
            <Route path="/sales" element={<Sales />} />
            <Route path="/multi-sales" element={<SalesMulti />} />
            <Route path="/orders" element={<Orders />} />

            {/* PURCHASE */}
            <Route path="/purchase" element={<Purchases />} />

            {/* INVENTORY */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/products" element={<Products />} /> {/* 🔥 QUAN TRỌNG */}

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
            <Route path="*" element={<div>❌ Không tìm thấy trang</div>} />

          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;