import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User,  CreditCard } from 'lucide-react';
import "../pages/page.css"
const RecentOrders = () => {
  // State management for orders, loading state, and errors
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Get the authentication token from local storage
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }

        // Include the token in the Authorization header
        const response = await axios.get('https://web-backend-eta.vercel.app/api/admin/get-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log(response.data);

        // Check if response has the expected structure
        if (response.data && Array.isArray(response.data.orders)) {
          setOrders(response.data.orders);
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Unexpected data format received from server');
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);

        if (err.response) {
          // Handle specific error codes
          if (err.response.status === 401) {
            setError('Your session has expired. Please log in again.');
          } else if (err.response.status === 403) {
            setError('You do not have permission to view orders.');
          } else {
            setError(`Server error: ${err.response.status}. ${err.response.data?.message || 'Please try again later.'}`);
          }
        } else if (err.request) {
          setError('No response from server. Please check if the API server is running.');
        } else {
          setError(`Failed to fetch orders: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Define fetchOrders outside useEffect to be able to call it from handleRetry
  const retryFetchOrders = () => {
    setError(null);
    setLoading(true);
    // Trigger the effect by forcing a component update
    setOrders([]);
    // Re-run the useEffect
    const fetchOrdersAgain = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await axios.get('https://web-backend-eta.vercel.app/api/admin/get-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && Array.isArray(response.data.orders)) {
          setOrders(response.data.orders);
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          setError('Unexpected data format received from server');
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (err.response) {
          if (err.response.status === 401) {
            setError('Your session has expired. Please log in again.');
          } else if (err.response.status === 403) {
            setError('You do not have permission to view orders.');
          } else {
            setError(`Server error: ${err.response.status}. ${err.response.data?.message || 'Please try again later.'}`);
          }
        } else if (err.request) {
          setError('No response from server. Please check if the API server is running.');
        } else {
          setError(`Failed to fetch orders: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrdersAgain();
  };

  // Function to handle retry
  const handleRetry = () => {
    retryFetchOrders();
  };

  // Function to handle login redirect
  const handleLogin = () => {
    window.location.href = '/adminlogin';
  };

  // Function to format date string
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Delivered' || status === 'Success') return 'bg-green-100 text-green-800';
    if (status === 'Shipped') return 'bg-blue-100 text-blue-800';
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Failed') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div id='dashboard' className="bg-white rounded-lg shadow-md overflow-hidden w-full mx-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
          <div className="flex space-x-2 justify-end">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            {error.includes('log in') && (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No orders found.
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          {/* Desktop view - table format */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={order.orderId || index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 uppercase whitespace-nowrap">
                      {order.orderId ? `${order.orderId.slice(-6)}` : `${order._id?.slice(-6) || index}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{order.name}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                      ₹{order.totalAmount}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - card format */}
          <div className="md:hidden">
            <div className="divide-y divide-gray-200">
              {orders.map((order, index) => (
                <div key={order.orderId || index} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
                        #{order.orderId ? order.orderId.slice(-6) : order._id?.slice(-6) || index}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center mb-2">
                    <User size={14} className="text-gray-400 mr-1" />
                    <div>
                      <div className="font-medium text-sm">{order.name}</div>
                      <div className="text-xs text-gray-500">{order.email}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      {formatDate(order.orderDate)}
                    </div>

                    <div className="flex items-center font-medium">
                      <span className="mr-1 text-gray-500">₹</span>
                      {order.totalAmount}
                    </div>

                    <div className="flex items-center text-gray-500 col-span-2">
                      <CreditCard size={14} className="mr-1" />
                      Payment:
                      <span className={`ml-1 px-1.5 py-0.5 text-xs rounded ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentOrders;