import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, BarChart3,
  CreditCard, Tag, LineChart, Settings,
  Menu, X, LayoutDashboard
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebarElement = document.getElementById('sidebar');
      const menuButton = document.getElementById('menu-button');

      if (isOpen && sidebarElement && !sidebarElement.contains(event.target) &&
        menuButton && !menuButton.contains(event.target)) {
        toggleSidebar();
      }
    };

    // Close sidebar when route changes on mobile
    const handleRouteChange = () => {
      if (isOpen && window.innerWidth < 768) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleRouteChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleRouteChange);
    };
  }, [isOpen, toggleSidebar]);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, title: 'Dashboard', description: 'Overview & stats', path: '/dashboard' },
    { icon: <Users size={20} />, title: 'Users', description: 'Manage customers & details', path: '/users' },
    { icon: <Package size={20} />, title: 'All Orders', description: 'Track & manage orders', path: '/orders' },
    { icon: <ShoppingCart size={20} />, title: 'Add Items', description: 'Add new products', path: '/add-items' },
    { icon: <BarChart3 size={20} />, title: 'Stock Management', description: 'Monitor inventory', path: '/stock' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile menu button - fixed at top left corner */}
     {!isOpen ? (<button
        id="menu-button"
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>) : " "}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 shadow-xl z-20
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          ${isOpen ? 'w-64' : 'w-16 md:w-16'}`}
      >
        <div className="p-4 flex items-center justify-between">
          <Link to="/dashboard" className={`font-bold ${isOpen ? 'block' : 'hidden md:hidden'}`}>
            MotoLab PitShop
          </Link>
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-800 rounded-lg ml-auto">
            {isOpen ? <X size={20} /> : <Menu size={20} className="hidden md:block" />}
          </button>
        </div>

        <nav className="mt-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center p-4 hover:bg-gray-800 transition-colors ${location.pathname === item.path ? 'bg-gray-800' : ''
                }`}
              onClick={() => {
                if (window.innerWidth < 768 && isOpen) {
                  toggleSidebar();
                }
              }}
            >
              <span className={`${!isOpen ? 'mx-auto' : 'mr-4'}`}>{item.icon}</span>
              <div className={`${isOpen ? 'block' : 'hidden'}`}>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-gray-400">{item.description}</div>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content padding - add this to your main content container */}
      <div className={`transition-all duration-300 ${isOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        {/* Your page content goes here */}
      </div>
    </>
  );
};

export default Sidebar;