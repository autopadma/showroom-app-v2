import React, { useState, useEffect } from 'react';
import { Bike, Customer, Sale, AppTab } from '../types';
import { Package, TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';
import { db } from '../services/database';

interface Props {
  stock: Bike[];
  sales: Sale[];
  customers: Customer[];
  onNavigate: (tab: AppTab) => void;
}

const DashboardTab: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    inStock: 0,
    outOfStock: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, recentSalesData] = await Promise.all([
        db.getDashboardStats(),
        db.getRecentSales(5)
      ]);
      
      setStats(statsData);
      setRecentSales(recentSalesData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Package className="text-blue-600" />} label="Available Stock" value={stats.inStock} bgColor="bg-blue-50" />
        <StatCard icon={<TrendingUp className="text-green-600" />} label="Total Sales" value={stats.totalSales} bgColor="bg-green-50" />
        <StatCard icon={<Users className="text-purple-600" />} label="Total Customers" value={stats.totalCustomers} bgColor="bg-purple-50" />
        <StatCard icon={<DollarSign className="text-amber-600" />} label="Total Revenue" value={`৳${stats.totalRevenue.toLocaleString()}`} bgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-800">Recent Sales</h3>
            <button onClick={() => onNavigate('sales')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center group">
              View all <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-50 pb-4">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Customer</th>
                  <th className="pb-4">Model</th>
                  <th className="pb-4">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.map((sale: any, index: number) => (
                  <tr key={index} className="text-sm">
                    <td className="py-4 font-medium text-gray-500">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 font-semibold text-gray-800">{sale.customer}</td>
                    <td className="py-4 text-gray-600">{sale.model}</td>
                    <td className="py-4 font-bold text-indigo-600">৳{Number(sale.price).toLocaleString()}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 italic">No sales recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Stock Status</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-50 flex items-center justify-between">
              <span className="text-gray-600 text-sm font-medium">In Stock</span>
              <span className="font-bold text-indigo-600 text-lg">{stats.inStock}</span>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 flex items-center justify-between">
              <span className="text-gray-600 text-sm font-medium">Out of Stock</span>
              <span className="font-bold text-gray-400 text-lg">{stats.outOfStock}</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('stock')}
            className="w-full mt-8 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center"
          >
            Manage Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, bgColor: string }> = ({ icon, label, value, bgColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${bgColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default DashboardTab;