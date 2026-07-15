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

// ĐẶT VÉ
import BookingList from "./pages/BookingList";
import Tickets from "./pages/Tickets";
import Payments from "./pages/Payments";

// CHUYẾN XE
import Trips from "./pages/Trips";
import RoutesPage from "./pages/RoutesPage";
import RouteStops from "./pages/RouteStops";

// BẾN VÀ TRẠM
import Stations from "./pages/Stations";
import BusStops from "./pages/BusStops";

// PHƯƠNG TIỆN
import Buses from "./pages/Buses";
import BusTypes from "./pages/BusTypes";
import BusSeats from "./pages/BusSeats";
import Maintenance from "./pages/Maintenance";

// SALES / BÁO CÁO
import Sales from "./pages/Sales";
import SalesMulti from "./pages/SalesMulti";
import Orders from "./pages/Orders";

import Drivers from "./pages/Drivers";
import Reviews from "./pages/Reviews";
import Notifications from "./pages/Notifications";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

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
  // Giúp App render lại khi chuyển trang
  useLocation();

  const user = getUserFromLocalStorage();

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* PRIVATE AREA */}
      <Route
        path="/*"
        element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}
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

            {/* ĐẶT VÉ */}
            <Route path="/bookings" element={<BookingList />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/payments" element={<Payments />} />

            {/* CHUYẾN XE */}
            <Route path="/trips" element={<Trips />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/route-stops" element={<RouteStops />} />

            {/* BẾN VÀ TRẠM */}
            <Route path="/stations" element={<Stations />} />
            <Route path="/bus-stops" element={<BusStops />} />

            {/* PHƯƠNG TIỆN */}
            <Route path="/buses" element={<Buses />} />
            <Route path="/bus-types" element={<BusTypes />} />
            <Route path="/bus-seats" element={<BusSeats />} />
            <Route path="/maintenance" element={<Maintenance />} />

            {/* SALES / BÁO CÁO */}
            <Route path="/sales" element={<Sales />} />
            <Route path="/multi-sales" element={<SalesMulti />} />
            <Route path="/orders" element={<Orders />} />

            {/* PURCHASE */}
            <Route path="/purchase" element={<Purchases />} />

            {/* INVENTORY */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/products" element={<Products />} />

            {/* TÀI XẾ */}
            <Route path="/drivers" element={<Drivers />} />

            {/* ĐÁNH GIÁ */}
            <Route path="/reviews" element={<Reviews />} />

            {/* THÔNG BÁO */}
            <Route path="/notifications" element={<Notifications />} />

            {/* HỆ THỐNG */}
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />

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