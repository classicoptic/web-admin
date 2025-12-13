import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./admin/components/Sidebar";
import Header from "./admin/components/Header";
import DashboardContent from "./admin/components/DashboardContent";
import UsersPage from "./admin/pages/UsersPage";
import AddItemsPage from "./admin/pages/AddItemsPage";
import StockManagementPage from "./admin/pages/StockManagementPage";
import AdminLoginPage from "./admin/pages/AdminLoginPage";
import OrderPage from "./admin/pages/OrderPage";
import { ToastContainer, toast } from "react-toastify";

function ProtectedRoute({ element }) {
  const token = localStorage.getItem("token");
  const isAdmin = localStorage.getItem("isAdmin");

  if (isAdmin !== "true") {
    setTimeout(() => toast.error("Only admin can login"), 100);
    return <Navigate to="/adminlogin" replace />;
  }

  return element;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <Header isOpen={sidebarOpen} />
      <div
        className={`pt-16 ${
          sidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/adminlogin" element={<AdminLoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                element={<DashboardContent isOpen={sidebarOpen} />}
              />
            }
          />
          <Route
            path="/users"
            element={<ProtectedRoute element={<UsersPage />} />}
          />
          <Route
            path="/add-items"
            element={<ProtectedRoute element={<AddItemsPage />} />}
          />
          <Route
            path="/stock"
            element={<ProtectedRoute element={<StockManagementPage />} />}
          />
          <Route
            path="/orders"
            element={<ProtectedRoute element={<OrderPage />} />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
