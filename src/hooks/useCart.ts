import { useState } from 'react';
import type { ICartItem, IOrder } from '../types/checkout.types';
import { handleCheckAvailability } from '../services/cartApi';

/**
 * useCart: Custom hook for cart operations
 * Manages cart state and operations
 */
export function useCart(initialOrder: IOrder) {
  const [currentOrder, setCurrentOrder] = useState<IOrder>(initialOrder);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    initialOrder.products.map(item => item.id)
  );

  // ==================== CALCULATION FUNCTIONS ====================

  const calculateProductCost = (): number => {
    const selectedItems = currentOrder.products.filter(item => 
      selectedItemIds.includes(item.id)
    );
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTotalWeight = (): number => {
    const selectedItems = currentOrder.products.filter(item => 
      selectedItemIds.includes(item.id)
    );
    return selectedItems.reduce((sum, item) => 
      sum + item.product.weight * item.addedQuantity, 0
    );
  };

  // ==================== CART OPERATIONS ====================

  const updateCartItemQuantity = (product_id: string, newQuantity: number): void => {
    setCurrentOrder({
      ...currentOrder,
      products: currentOrder.products.map(item => {
        if (item.product.product_id === product_id) {
          const isAvailable = handleCheckAvailability(currentOrder.products, product_id, newQuantity);
          if (!isAvailable && newQuantity > item.addedQuantity) {
            return item;
          }
          
          return {
            ...item,
            addedQuantity: newQuantity,
            totalPrice: item.product.current_price * newQuantity,
          };
        }
        return item;
      }),
    });
  };

  const removeCartItem = (product_id: string): void => {
    setCurrentOrder({
      ...currentOrder,
      products: currentOrder.products.filter(item => item.product.product_id !== product_id),
    });
    setSelectedItemIds(selectedItemIds.filter(id => {
      const item = currentOrder.products.find(p => p.product.product_id === product_id);
      return item ? id !== item.id : true;
    }));
  };

  const toggleItemSelection = (itemId: string): void => {
    setSelectedItemIds(prevSelected => 
      prevSelected.includes(itemId)
        ? prevSelected.filter(id => id !== itemId)
        : [...prevSelected, itemId]
    );
  };

  const selectAllItems = (selected: boolean): void => {
    if (selected) {
      setSelectedItemIds(currentOrder.products.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const hasStockIssues = (): boolean => {
    const selectedItems = currentOrder.products.filter(item => 
      selectedItemIds.includes(item.id)
    );
    return selectedItems.some(item => item.addedQuantity > item.product.stock);
  };

  const filterSelectedItems = (): void => {
    const selectedProducts = currentOrder.products.filter(item => 
      selectedItemIds.includes(item.id)
    );
    setCurrentOrder({
      ...currentOrder,
      products: selectedProducts,
    });
  };

  return {
    currentOrder,
    setCurrentOrder,
    selectedItemIds,
    setSelectedItemIds,
    calculateProductCost,
    calculateTotalWeight,
    updateCartItemQuantity,
    removeCartItem,
    toggleItemSelection,
    selectAllItems,
    hasStockIssues,
    filterSelectedItems,
  };
}
