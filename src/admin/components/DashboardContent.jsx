import React from 'react';
import { Package, CreditCard, Users, BarChart3 } from 'lucide-react';
import RecentOrders from './RecentOrders';

const DashboardContent = ({ isOpen }) => {  const stats = [
    { title: 'Total Orders', value: '1,234', icon: <Package />, trend: 'up', trendValue: '12%', color: 'blue' },
    
    { title: 'Customers', value: '892', icon: <Users />, trend: 'up', trendValue: '15%', color: 'purple' },
    
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <RecentOrders />
    </div>
  );
};

export default DashboardContent;