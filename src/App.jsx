import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Purchase from "./pages/Purchase"
import Customers from "./pages/Customers";
import Debts from "./pages/Debts";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>
        <Sidebar />

        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchase" element={<Purchase />} />   
            <Route path="/customers" element={<Customers />} />
            <Route path="/debts" element={<Debts />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;