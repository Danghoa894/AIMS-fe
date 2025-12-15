/**
 * Mock Statistics Data
 * Dashboard statistics and metrics
 */

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  bgColor: string;
}

export const mockStats = {
  totalRevenue: {
    label: 'Total Revenue',
    value: '₫125,430,000',
    change: '+12.5%',
    trend: 'up' as const,
    icon: 'TrendingUp',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  totalOrders: {
    label: 'Total Orders',
    value: '1,234',
    change: '+8.2%',
    trend: 'up' as const,
    icon: 'ShoppingBag',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  totalProducts: {
    label: 'Products',
    value: '20', // Will be dynamic based on mockProducts
    change: '-2.4%',
    trend: 'down' as const,
    icon: 'Package',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  totalCustomers: {
    label: 'Customers',
    value: '2,890',
    change: '+15.3%',
    trend: 'up' as const,
    icon: 'Users',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
};
