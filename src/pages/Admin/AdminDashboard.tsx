import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Eye,
  Edit,
  LayoutDashboard,
  LogOut,
  User,
  Home,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import ProductManagerPage from '../productManager/ProductManager/ProductManagerPage';
import { useNotification } from '../../context/NotificationContext';
import { mockOrders, getTotalRevenue, getTotalOrders, getRecentOrders } from '../../data/orders';
import { mockProducts, getTotalProductsCount, getOutOfStockCount } from '../../data/products';

/**
 * AdminDashboard: Main admin dashboard page
 * Route: /admin (Protected)
 * Features:
 * - Tab navigation: Dashboard | Products
 * - Overview statistics (from mock data)
 * - Recent orders table (from mock data)
 * - Product management (integrated ProductManagerPage with mock data)
 * - User info display
 * - Logout functionality
 */
export function AdminDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products'>('dashboard');
  
  // Get user info from localStorage
  const userStr = localStorage.getItem('aims_admin_user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Admin User', email: 'admin@aims.com', role: 'Admin' };

  // Logout handler
  const handleLogout = () => {
    // Clear auth tokens and user data
    localStorage.removeItem('aims_admin_token');
    sessionStorage.removeItem('aims_admin_token');
    localStorage.removeItem('aims_admin_user');
    
    // Show success notification
    showNotification('success', 'Logged out successfully');
    
    // Redirect to login
    navigate('/login');
  };

  // Navigate to home
  const handleGoHome = () => {
    navigate('/');
  };

  // Utility function: Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Mock data
  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(getTotalRevenue()),
      change: '+12.5%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Total Orders',
      value: getTotalOrders().toString(),
      change: '+8.2%',
      trend: 'up' as const,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Products',
      value: getTotalProductsCount().toString(),
      change: getOutOfStockCount() > 0 ? `-${getOutOfStockCount()} out of stock` : 'All in stock',
      trend: getOutOfStockCount() > 0 ? 'down' as const : 'up' as const,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Customers',
      value: '2,890',
      change: '+15.3%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentOrders = getRecentOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700';
      case 'Processing':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900">AIMS Admin</h3>
                <p className="text-xs text-gray-500">An Internet Media Store</p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>

              {/* Back to Store */}
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Store
              </Button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4" />
              Products
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' ? (
          <>
            {/* Dashboard View */}
            <div className="mb-8">
              <h1 className="text-gray-900 mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">
                Welcome back! Here&apos;s what&apos;s happening with your store.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span
                        className={
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-gray-900">{stat.value}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-gray-900 mb-1">Recent Orders</h2>
                  <p className="text-sm text-gray-600">
                    Latest orders from your store
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  View All Orders
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="text-teal-600">{order.id}</span>
                        </TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(order.date).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.items} items</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Products View */}
            <ProductManagerPage />
          </>
        )}
      </div>
    </div>
  );
}