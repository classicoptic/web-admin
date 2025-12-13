import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, Check, CreditCard, Calendar, Loader, X, Filter, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import "../pages/page.css"
const OrdersList = () => {
    // State for orders data
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('Recent'); // 'Recent' or 'Oldest'
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    // Create api instance
    const api = axios.create({
        baseURL: 'http://localhost:4000/api'
    });

    // Set up authentication and fetch data
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Get token from localStorage
                const storedToken = localStorage.getItem("token");

                if (!storedToken) {
                    throw new Error("No authentication token found");
                }

                // Set the token in the axios instance
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                setLoading(true);

                // Fetch orders data
                const ordersResponse = await api.get('/admin/get-orders');
                const ordersResult = ordersResponse.data;

                // Process orders to ensure orderId is properly set
                const processedOrders = ordersResult.orders.map(order => {
                    return {
                        ...order,
                        orderId: order._id || order.orderId,
                        orderDate: new Date(order.orderDate || Date.now())
                    };
                });

                setOrders(processedOrders || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.response?.data?.message || err.message);
                setLoading(false);

                // Show error alert for fetch failure
                Swal.fire({
                    title: 'Error!',
                    text: `Failed to load orders: ${err.response?.data?.message || err.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        };

        fetchOrders();
    }, []);

    // Function to get last 6 digits of order ID
    const getLastSixDigits = (orderId) => {
        if (!orderId) return 'N/A';
        return orderId.slice(-6);
    };

    // Get status color and icon
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Calendar size={16} />;
            case 'Shipped': return <Truck size={16} />;
            case 'Delivered': return <Check size={16} />;
            case 'Paid': return <CreditCard size={16} />;
            default: return null;
        }
    };

    // Filter and sort orders
    const filteredOrders = orders.filter(order => {
        if (filterStatus === 'All') return true;
        return order.orderStatus === filterStatus;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === 'Recent') {
            return b.orderDate - a.orderDate;
        } else {
            return a.orderDate - b.orderDate;
        }
    });

    // Handle order click - show modal
    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setSelectedOrderStatus(order.orderStatus || 'Pending');
        setShowModal(true);
        setShowSidebar(false); // Close sidebar when opening modal on mobile
    };

    // Handle status update
    const handleStatusUpdate = (newStatus) => {
        setSelectedOrderStatus(newStatus);
    };

    // Save status changes
    const handleSaveChanges = async () => {
        if (!selectedOrder || selectedOrder.orderStatus === selectedOrderStatus) {
            setShowModal(false);
            return;
        }

        try {
            setUpdatingStatus(true);

            // Make sure the token is set
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Call API to update status
            await api.put(`/admin/update-status/?orderId=${selectedOrder.orderId}`, {
                orderStatus: selectedOrderStatus
            });

            // Update local state
            const updatedOrders = orders.map(order => {
                if (order.orderId === selectedOrder.orderId) {
                    return { ...order, orderStatus: selectedOrderStatus };
                }
                return order;
            });

            setOrders(updatedOrders);
            setUpdatingStatus(false);
            setShowModal(false);

            // Show success message with SweetAlert2
            Swal.fire({
                title: 'Success!',
                text: `Order #${getLastSixDigits(selectedOrder.orderId)} status updated to ${selectedOrderStatus}`,
                icon: 'success',
                confirmButtonText: 'Great!',
                timer: 3000,
                timerProgressBar: true
            });

        } catch (err) {
            console.error('Error updating order status:', err);
            setUpdatingStatus(false);

            // Show error message with SweetAlert2
            Swal.fire({
                title: 'Error!',
                text: `Failed to update order status: ${err.response?.data?.message || err.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    // Toggle sidebar on mobile
    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    if (loading) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4 flex justify-center items-center h-64">
                <div className="text-center">
                    <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p>Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4 text-center text-red-600">
                <p>Error loading orders: {error}</p>
            </div>
        );
    }

    return (
        // Removed negative margins and added proper container sizing
        <div id='orderview' className="w-full max-w-7xl mx-auto p-2 sm:p-4">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Orders Management</h1>

            {/* Mobile Filter Button */}
            <div className="md:hidden mb-4">
                <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg text-blue-700 font-medium shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <Filter size={18} />
                        <span>Filter & Sort</span>
                    </div>
                    <span className="text-sm bg-blue-100 px-2 py-1 rounded-full">
                        {filterStatus !== 'All' ? filterStatus : 'All Orders'}
                    </span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Sidebar - Hidden on mobile by default */}
                <div className={`
                    md:w-64 md:flex-shrink-0 md:block
                    fixed md:static top-0 left-0 h-full md:h-auto z-40 w-3/4 sm:w-72
                    transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                    transition-transform duration-300 ease-in-out
                `}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full md:h-auto">
                        {/* Mobile sidebar header */}
                        <div className="md:hidden p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                            <h3 className="font-semibold text-blue-700">Filters & Sorting</h3>
                            <button
                                onClick={toggleSidebar}
                                className="text-blue-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Filter by status */}
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Filter size={16} /> Filter
                            </h3>
                        </div>
                        <div className="p-2">
                            {['All', 'Pending', 'Shipped', 'Delivered'].map(status => (
                                <button
                                    key={status}
                                    className={`w-full text-left px-4 py-3 rounded-md ${filterStatus === status ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setFilterStatus(status);
                                        setShowSidebar(false);
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Sort by */}
                        <div className="p-4 border-t border-gray-200">
                            <h3 className="text-md font-semibold mb-2">Sort by</h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    className={`w-full text-left px-4 py-2 rounded-md ${sortBy === 'Recent' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setSortBy('Recent');
                                        setShowSidebar(false);
                                    }}
                                >
                                    Recent
                                </button>
                                <button
                                    className={`w-full text-left px-4 py-2 rounded-md ${sortBy === 'Oldest' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setSortBy('Oldest');
                                        setShowSidebar(false);
                                    }}
                                >
                                    Oldest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {showSidebar && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
                        onClick={() => setShowSidebar(false)}
                    ></div>
                )}

                {/* Orders List */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Headers - Hidden on small screens */}
                        <div className="hidden sm:grid sm:grid-cols-3 gap-2 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-600">
                            <div>Order ID</div>
                            <div>Date</div>
                            <div>Status</div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-gray-100">
                            {sortedOrders.length > 0 ? (
                                sortedOrders.map((order) => (
                                    <div
                                        key={order.orderId}
                                        className="p-3 sm:p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => handleOrderClick(order)}
                                    >
                                        {/* Mobile layout */}
                                        <div className="sm:hidden flex justify-between items-center mb-2">
                                            <div className="font-medium text-blue-700">
                                                #{getLastSixDigits(order.orderId)}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(order.orderStatus)}`}>
                                                {getStatusIcon(order.orderStatus)}
                                                {order.orderStatus || 'Pending'}
                                            </span>
                                        </div>
                                        <div className="sm:hidden flex justify-between items-center text-gray-600 text-sm">
                                            <div>
                                                {order.orderDate.toLocaleDateString()}
                                            </div>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>

                                        {/* Desktop layout */}
                                        <div className="hidden sm:grid uppercase sm:grid-cols-3 gap-2">
                                            <div className="font-medium text-blue-600">
                                                {getLastSixDigits(order.orderId)}
                                            </div>
                                            <div>
                                                {order.orderDate.toLocaleDateString()}
                                            </div>
                                            <div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 ${getStatusColor(order.orderStatus)}`}>
                                                    {getStatusIcon(order.orderStatus)}
                                                    {order.orderStatus || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    No orders found with the selected filter
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h2 className="text-lg uppercase sm:text-xl font-semibold text-blue-700">Order #{getLastSixDigits(selectedOrder.orderId)}</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Customer Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-blue-700 mb-3 border-b border-blue-100 pb-2">Customer Information</h3>
                                    <div className="space-y-2">
                                        <div><span className="text-blue-500 font-medium">Name: </span>{selectedOrder.name || 'N/A'}</div>
                                        <div><span className="text-blue-500 font-medium">Email: </span>{selectedOrder.email || 'N/A'}</div>
                                        <div><span className="text-blue-500 font-medium">Phone: </span>{selectedOrder.phone || 'N/A'}</div>
                                        <div><span className="text-blue-500 font-medium">Address: </span>{selectedOrder.address || 'N/A'}</div>
                                    </div>
                                </div>

                                {/* Products Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-blue-700 mb-3 border-b border-blue-100 pb-2">Products</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.products && Array.isArray(selectedOrder.products) ? (
                                            selectedOrder.products.map((product, index) => (
                                                <div key={index} className="flex justify-between items-center pb-2 border-b border-blue-50">
                                                    <div className="text-gray-700">
                                                        <span className="font-medium">{product.name || 'Product'}</span>
                                                        {product.quantity > 1 && <span className="text-sm text-blue-500 ml-2">x{product.quantity}</span>}
                                                    </div>
                                                    <div className="text-gray-700 font-medium">₹{product.price || '0.00'}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-500">No products found</div>
                                        )}
                                        <div className="flex justify-between pt-2 font-semibold">
                                            <span className="text-blue-600">Total:</span>
                                            <span className="text-blue-700">₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Status */}
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-blue-700 mb-3 border-b border-blue-100 pb-2">Update Order Status</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Pending', 'Shipped', 'Delivered'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(status)}
                                            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${selectedOrderStatus === status
                                                ? `${getStatusColor(status)} ring-2 ring-offset-1 ring-blue-400`
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                            {updatingStatus ? (
                                <button className="px-4 py-2 bg-blue-400 rounded-lg text-white flex items-center gap-2">
                                    <Loader size={16} className="animate-spin" /> Updating...
                                </button>
                            ) : (
                                <button
                                    className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
                                    onClick={handleSaveChanges}
                                >
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersList;
