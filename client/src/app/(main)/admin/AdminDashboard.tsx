import { useCallback, useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useToast } from '../../../utils/ToastContext';
import { orderService } from '../../../features/cart/services/orderService';
import { productService } from '../../../features/products/services/productService';
import { userService } from '../../../features/users/services/userService';

interface DashboardStats {
  users: {
    total: number;
    farmers: number;
    consumers: number;
    admins: number;
    newThisMonth: number;
  };
  products: {
    total: number;
    active: number;
    categories: number;
  };
  orders: {
    total: number;
    pending: number;
    revenue: number;
  };
}

export function AdminDashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [userStats, productsData, ordersData] = await Promise.all([
        userService.getStats(),
        productService.getAll(),
        orderService.getAllOrders(1, 1),
      ]);

      const categories = await productService.getCategories();
      const activeProducts = productsData.data.filter((p) => p.isAvailable).length;

      // Calculate revenue from recent orders
      const recentOrders = await orderService.getAllOrders(1, 100);
      const revenue = recentOrders.data
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        users: {
          total: userStats.totalUsers,
          farmers: userStats.farmers,
          consumers: userStats.consumers,
          admins: userStats.admins,
          newThisMonth: userStats.newUsersThisMonth,
        },
        products: {
          total: productsData.total,
          active: activeProducts,
          categories: categories.length,
        },
        orders: {
          total: ordersData.total,
          pending: recentOrders.data.filter((o) => o.status === 'pending').length,
          revenue,
        },
      });
    } catch (error) {
      showToast('Failed to load dashboard stats', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading admin dashboard..." />;
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Users Stats */}
          <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users.total}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">+{stats.users.newThisMonth} this month</p>
              </div>
            </div>
          </Card>

          {/* Products Stats */}
          <Card padding="md" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.products.total}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{stats.products.active} active</p>
              </div>
            </div>
          </Card>

          {/* Orders Stats */}
          <Card padding="md" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.orders.total}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">{stats.orders.pending} pending</p>
              </div>
            </div>
          </Card>

          {/* Revenue Stats */}
          <Card padding="md" className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.orders.revenue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Total earnings</p>
              </div>
            </div>
          </Card>
        </div>

        {/* User Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Breakdown</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-lg">👨‍🌾</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Farmers</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.users.farmers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🛒</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Consumers</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.users.consumers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-lg"></span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Admins</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.users.admins}</span>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href="/admin/users"
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Users</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage user accounts</p>
              </a>
              <a
                href="/admin/products"
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Products</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and moderate listings</p>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
