/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN cartApi
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Data Coupling (kết nối thông qua dữ liệu)
*    - Với lớp nào: 
*         + mockProducts (data layer)
*         + ICartItem, IProduct (types layer)
*    - Lý do:
*         - Module chỉ giao tiếp bằng cách nhận dữ liệu (product_id, quantity) 
*           và trả về ICartItem → không phụ thuộc trực tiếp logic nội bộ module khác.
*         - Không chia sẻ global state → mức coupling thấp.
*
* 2. COHESION:
*    - Mức độ: Functional Cohesion
*    - Giữa các thành phần:
*         + getCartItems
*         + handleCheckAvailability
*         + updateCartItemQuantity
*         + removeCartItem
*         → đều phục vụ một mục tiêu duy nhất: xử lý thao tác giỏ hàng.
*    - Lý do:
*         - Tất cả hàm đều liên quan đến nghiệp vụ Cart.
*         - Không chứa logic ngoài phạm vi giỏ hàng.
* --------------------------------------------------------- */

import type { ICartItem, IProduct } from '../types/checkout.types';
import { mockProducts } from '../data/mockProducts';

/**
 * Cart API Service
 * Handles cart-related API calls to Backend
 * 
 * IMPORTANT: Product data, stock, weight, price calculations 
 * are all managed by Backend. Frontend only displays data.
 */

// Helper function to convert mock product to IProduct format
const convertToCartProduct = (product: typeof mockProducts[0]): IProduct => ({
  product_id: product.product_id,
  title: product.title,
  current_price: product.current_price,
  stock: product.stock,
  weight: product.weight,
  status: product.status,
  image: product.imageUrl,
  imageUrl: product.imageUrl,
  category: product.category,
});

// MOCK DATA for UI Development - Using actual mock products
export const MOCK_CART_ITEMS: ICartItem[] = [
  {
    id: 'cart-1',
    product: convertToCartProduct(mockProducts[0]), // The Great Gatsby (Book)
    addedQuantity: 2,
    totalPrice: mockProducts[0].current_price * 2, // Backend calculates this
  },
  {
    id: 'cart-2',
    product: convertToCartProduct(mockProducts[6]), // Abbey Road (CD)
    addedQuantity: 1,
    totalPrice: mockProducts[6].current_price * 1,
  },
  {
    id: 'cart-3',
    product: convertToCartProduct(mockProducts[10]), // The Shawshank Redemption (DVD)
    addedQuantity: 1,
    totalPrice: mockProducts[10].current_price * 1,
  },
  {
    id: 'cart-4',
    product: convertToCartProduct(mockProducts[4]), // Vietnam News Daily (Newspaper)
    addedQuantity: 3,
    totalPrice: mockProducts[4].current_price * 3,
  },
];

/**
 * API: Get Cart Items
 * Fetches cart items from Backend
 * Backend returns: products with current_price, stock, weight, calculated totalPrice
 * 
 * @returns Cart items from Backend
 */
export const getCartItems = async (): Promise<ICartItem[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/cart/items', {
  //   method: 'GET',
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const data = await response.json();
  // return data.cartItems;

  // MOCK: Return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_CART_ITEMS);
    }, 500);
  });
};

/**
 * API: Check Product Availability
 * Checks if requested quantity is available in stock
 * Backend validates against real-time stock data
 * 
 * @param product_id - Product ID to check
 * @param requestQuantity - Requested quantity
 * @returns true if available, false otherwise
 */
export const handleCheckAvailability = async (
  product_id: string,
  requestQuantity: number
): Promise<boolean> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/cart/check-availability', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ product_id, requestQuantity }),
  // });
  // const data = await response.json();
  // return data.available;

  // MOCK: Check against mock data
  const item = MOCK_CART_ITEMS.find((item) => item.product.product_id === product_id);
  if (!item) return false;
  return requestQuantity <= item.product.stock;
};

/**
 * API: Update Cart Item Quantity
 * Updates quantity of a cart item
 * Backend recalculates totalPrice and returns updated cart
 * 
 * @param product_id - Product ID
 * @param newQuantity - New quantity
 * @returns Updated cart item with recalculated totalPrice from Backend
 */
export const updateCartItemQuantity = async (
  product_id: string,
  newQuantity: number
): Promise<ICartItem | null> => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/cart/update-quantity', {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ product_id, quantity: newQuantity }),
  // });
  // const data = await response.json();
  // return data.cartItem;

  // MOCK: Update mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const item = MOCK_CART_ITEMS.find((item) => item.product.product_id === product_id);
      if (!item) {
        resolve(null);
        return;
      }

      // Backend calculates totalPrice
      const updatedItem = {
        ...item,
        addedQuantity: newQuantity,
        totalPrice: item.product.current_price * newQuantity,
      };

      resolve(updatedItem);
    }, 300);
  });
};

/**
 * API: Remove Cart Item
 * Removes an item from cart
 * Backend handles cart state update
 * 
 * @param product_id - Product ID to remove
 * @returns Success status
 */
export const removeCartItem = async (product_id: string): Promise<boolean> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/cart/remove/${product_id}`, {
  //   method: 'DELETE',
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const data = await response.json();
  // return data.success;

  // MOCK: Return success
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 300);
  });
};

/**
 * REMOVED: Weight calculation - Backend provides product.weight
 * REMOVED: Price calculation - Backend calculates totalPrice
 * REMOVED: Stock calculation - Backend manages stock data
 */