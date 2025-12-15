/**
 * Mock Orders Data
 * Sample order history for admin dashboard
 */

export interface MockOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'Delivered' | 'Processing' | 'Pending' | 'Cancelled';
  items: number;
}

export const mockOrders: MockOrder[] = [
  {
    id: 'ORD-2024-001',
    customer: 'Nguyen Van A',
    date: '2024-12-06',
    total: 1250000,
    status: 'Delivered',
    items: 3,
  },
  {
    id: 'ORD-2024-002',
    customer: 'Tran Thi B',
    date: '2024-12-06',
    total: 890000,
    status: 'Processing',
    items: 2,
  },
  {
    id: 'ORD-2024-003',
    customer: 'Le Van C',
    date: '2024-12-05',
    total: 2340000,
    status: 'Pending',
    items: 5,
  },
  {
    id: 'ORD-2024-004',
    customer: 'Pham Thi D',
    date: '2024-12-05',
    total: 670000,
    status: 'Cancelled',
    items: 1,
  },
  {
    id: 'ORD-2024-005',
    customer: 'Hoang Van E',
    date: '2024-12-04',
    total: 1890000,
    status: 'Delivered',
    items: 4,
  },
  {
    id: 'ORD-2024-006',
    customer: 'Vo Thi F',
    date: '2024-12-04',
    total: 3450000,
    status: 'Processing',
    items: 6,
  },
  {
    id: 'ORD-2024-007',
    customer: 'Dang Van G',
    date: '2024-12-03',
    total: 560000,
    status: 'Delivered',
    items: 2,
  },
  {
    id: 'ORD-2024-008',
    customer: 'Bui Thi H',
    date: '2024-12-03',
    total: 4580000,
    status: 'Delivered',
    items: 8,
  },
];

// Helper functions
export const getTotalRevenue = (): number => {
  return mockOrders.reduce((sum, order) => sum + order.total, 0);
};

export const getTotalOrders = (): number => {
  return mockOrders.length;
};

export const getOrdersByStatus = (status: MockOrder['status']): MockOrder[] => {
  return mockOrders.filter(order => order.status === status);
};

export const getRecentOrders = (limit: number = 5): MockOrder[] => {
  return mockOrders.slice(0, limit);
};
