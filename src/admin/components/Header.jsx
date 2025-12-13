import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { LogOut } from "lucide-react";
import { toast, ToastContainer } from 'react-toastify';

const Header = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  // Function to get page title from route
  const getPageTitle = () => {
    const path = location.pathname.split("/")[1];
    return path ? path.charAt(0).toUpperCase() + path.slice(1).replace("-", " ") : "Dashboard";
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token"); // Get token if required
        const response = await axios.get("http://localhost:4000/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Admin Data:", response.data);
        setAdminData(response.data.user.fullName);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };

    fetchAdminData();
  }, []); // Runs only once when component mounts

  // Handle logout
  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin"); // Also remove isAdmin flag
    
    setTimeout(() => {
      navigate("/adminlogin");
    }, 300);

      toast.success("Successfully logged out");

    setShowLogout(false);
 
  };
  // Toggle dropdown
  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white -ml-8 shadow-sm flex items-center justify-between px-6 ${isOpen ? "left-60" : "left-24"} transition-all duration-300 z-10`}>
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
      <div className="flex items-center">
        <h1 className="text-xl font-semibold mr-8">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={toggleLogout}
          >
            <img
              src={"https://i.ibb.co/2178bTsx/motolab.jpg"}
              alt="Admin"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium">
              {adminData}
            </span>
          </div>

          {showLogout && (
            <div className="absolute right-0 top-10 bg-white shadow-md rounded-md p-2 border border-gray-200 z-20">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md w-full text-left text-sm font-medium transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;