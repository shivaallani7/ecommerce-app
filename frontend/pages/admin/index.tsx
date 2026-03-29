import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import type { DashboardStats } from '../../types';

const AdminDashboard: NextPage = () => {
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) router.push('/');
  }, [isAuthenticated, isAdmin, router]);

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () =>
      api.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard').then((r) => r.data.data),
    enabled: isAdmin,
  });

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—', color: 'bg-blue-500' },
    { label: 'Total Orders', value: stats?.totalOrders ?? '—', color: 'bg-green-500' },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? '—', color: 'bg-yellow-500' },
    { label: 'Total Products', value: stats?.totalProducts ?? '—', color: 'bg-purple-500' },
    { label: 'Low Stock', value: stats?.lowStockProducts ?? '—', color: 'bg-red-500' },
    { label: '30-day Revenue', value: stats ? `$${stats.revenue.last30Days.toFixed(0)}` : '—', color: 'bg-primary-500' },
  ];

  return (
    <Layout title="Admin Dashboard – ShopAzure">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, color }) => (
            <div key={label} className="card p-6 flex items-center space-x-4">
              <div className={`${color} rounded-xl p-3`}>
                <div className="w-6 h-6 bg-white/30 rounded" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/admin/products', label: 'Manage Products', desc: 'Add, edit, delete products', emoji: '📦' },
            { href: '/admin/orders', label: 'Manage Orders', desc: 'View and update order status', emoji: '🛒' },
            { href: '/admin/users', label: 'Manage Users', desc: 'View and manage customers', emoji: '👥' },
            { href: '/admin/categories', label: 'Categories', desc: 'Organize product categories', emoji: '🏷️' },
          ].map(({ href, label, desc, emoji }) => (
            <Link key={href} href={href}>
              <div className="card p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
                <span className="text-3xl">{emoji}</span>
                <h3 className="font-semibold text-gray-900 mt-3 mb-1">{label}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
