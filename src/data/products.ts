// src/data/products.ts

export const mockProducts = [
  { id: 1, name: "iPhone 15", price: 25000000, stock: 10 },
  { id: 2, name: "MacBook Pro", price: 45000000, stock: 5 },
  { id: 3, name: "AirPods Pro", price: 5500000, stock: 0 },
  { id: 4, name: "iPad Mini", price: 13000000, stock: 2 },
];

export function getTotalProductsCount() {
  return mockProducts.length;
}

export function getOutOfStockCount() {
  return mockProducts.filter(p => p.stock === 0).length;
}
