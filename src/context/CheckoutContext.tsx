/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN CheckoutContext
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: High Data Coupling + Moderate Control Coupling 
*               + External API Coupling
*
*    - Phụ thuộc vào:
*         + React:
*               - createContext, useState, useContext
*         + Types:
*               - IOrder, IDeliveryInfo, ICartItem, ITransactionInfo, PaymentStatus, IProduct
*         + Service Modules (API handlers):
*               - cartApi: handleCheckAvailability, MOCK_CART_ITEMS
*               - deliveryApi: calculateFeeAPI, submitDeliveryInfoAPI
*               - paymentApi: payOrder, verifyPayment, processCreditCardPayment, displayQR
*         + Notification Layer:
*               - useNotification()
*         + State Consumers:
*               - Add to cart, update quantity, remove item
*               - Checkout Flow (Step 1 → Step 4)
*
*    - Lý do:
*         - Module tập trung toàn bộ state và logic checkout → Data Coupling lớn với toàn bộ hệ thống.
*         - Gọi trực tiếp nhiều API mock (cart, delivery, payment) → External Coupling cao.
*         - Gọi notification trong hầu hết các hàm → Coupling với UI Notification layer.
*         - Gồm nhiều hàm logic (addToCart, calculate fees, submit delivery info, verify payment…) 
*           → Control Coupling moderate.
*         - Không có circular dependency.
*
*    → Coupling cao nhưng **đúng bản chất của một Context trung tâm** (state management).
*      Đây là coupling hợp lý, không phải coupling xấu.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: High Functional Cohesion (cao)
*
*    - Các nhóm chức năng:
*         + (1) State chính của giỏ hàng và đơn hàng:
*               - currentOrder, shippingData, orderId, paymentMethod…
*         + (2) Display Helpers:
*               - calculateProductCost, calculateTotalWeight, calculateVAT, calculateTotal
*         + (3) API Handlers:
*               - handleCheckAvailability
*               - handleSubmitDeliveryInfo
*               - handleCalculateFee
*               - handlePayOrder
*               - handleVerifyPayment
*               - handleProcessCreditCardPayment
*               - handleDisplay…
*         + (4) Cart Operations:
*               - addToCart, updateCartItemQuantity, removeCartItem
*               - toggleItemSelection, selectAllItems
*
*    - Lý do:
*         - Toàn bộ logic đều phục vụ **một chức năng duy nhất**:
*           “Quản lý toàn bộ trạng thái và nghiệp vụ của quá trình Checkout”.
*         - Các hàm được nhóm theo đúng domain: Cart → Delivery → Payment.
*         - Không chứa logic UI (trừ notifications — acceptable).
*         - Không chứa logic unrelated như Product Manager, Auth, Dashboard…
*
*    → Cohesion rất cao, đúng trách nhiệm của một Context phức tạp.
*
* ---------------------------------------------------------
*/


import { createContext, useContext, useState, ReactNode } from 'react';
import type { ICartItem, IDeliveryInfo, IOrder, ITransactionInfo, PaymentStatus, IProduct } from '../types/checkout.types'; 
import { handleCheckAvailability, MOCK_CART_ITEMS } from '../services/cartApi';
import { handleCalculateFee as calculateFeeAPI, handleSubmitDeliveryInfo as submitDeliveryInfoAPI } from '../services/deliveryApi';
import { handlePayOrder as payOrder, handleVerifyPayment as verifyPayment, handleProcessCreditCardPayment as processCreditCardPayment, handleDisplay as displayQR } from '../services/paymentApi';
import {useNotification} from "./NotificationContext" 

/**
 * CheckoutContext - UI State Management
 */

// ==================== CONTEXT TYPE ====================
interface CheckoutContextType {
  // State
  currentOrder: IOrder;
  shippingData: IDeliveryInfo;
  orderId: string;
  transactionData: ITransactionInfo | null;
  paymentMethod: string;
  isLoading: boolean;
  selectedItemIds: string[];

  // Setters
  setCurrentOrder: (order: IOrder) => void;
  setShippingData: (data: IDeliveryInfo) => void;
  setOrderId: (id: string) => void;
  setTransactionData: (data: ITransactionInfo | null) => void;
  setPaymentMethod: (method: string) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedItemIds: (ids: string[]) => void;

  // Display Helpers (Read from Backend data)
  calculateProductCost: () => number;
  calculateTotalWeight: () => number;
  calculateVAT: () => number;
  calculateTotal: () => number;

  // Handler Functions (Call Backend APIs)
  handleCheckAvailability: (product_id: string, requestQuantity: number) => Promise<boolean>;
  handleSubmitDeliveryInfo: (deliveryInfo: IDeliveryInfo) => Promise<void>;
  handleCalculateFee: (weight: number, province: string, orderValue: number) => Promise<number>;
  handleRequestToPayOrder: () => void;
  handlePayOrder: (orderIdParam: string) => ITransactionInfo;
  
  // LỖI 1 ĐÃ SỬA: Đảm bảo trả về Promise<PaymentStatus>
  handleVerifyPayment: (transactionID: string) => Promise<PaymentStatus>; 
  
  // LỖI 2 ĐÃ SỬA: Đảm bảo trả về Promise<boolean>
  handleProcessCreditCardPayment: (orderID: string, cardInfo: any) => Promise<boolean>; 
  
  handleDisplayPayOrderSuccess: () => void;
  handleDisplay: (qrCodeString: string) => void;

  // Cart Operations
  addToCart: (product: IProduct, quantity?: number) => void;
  updateCartItemQuantity: (product_id: string, newQuantity: number) => void;
  removeCartItem: (product_id: string) => void;
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: (selected: boolean) => void;
  hasStockIssues: () => boolean;
}

// ==================== CONTEXT CREATION ====================
const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// ==================== PROVIDER COMPONENT ====================
export function CheckoutProvider({ children }: { children: ReactNode }) {

  const {showNotification} = useNotification(); 
  // ==================== STATE VARIABLES ====================
  
  const [currentOrder, setCurrentOrder] = useState<IOrder>({
    products: MOCK_CART_ITEMS, 
    orderId: '',
    orderStatus: 'Pending',
    deliveryInfo: undefined,
    transactionInfo: undefined,
    productCost: 0, 
    totalWeight: 0, 
    totalAmount: 0, 
  });

  const [shippingData, setShippingData] = useState<IDeliveryInfo>({
    deliveryId: '',
    fullName: '',
    phoneNumber: '',
    Email: '',
    address: '',
    province: '',
    deliveryMethod: 'Standard Delivery',
    deliveryFee: 0, 
    note: '',
  });

  const [orderId, setOrderId] = useState<string>('');
  const [transactionData, setTransactionData] = useState<ITransactionInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('VietQR');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    MOCK_CART_ITEMS.map(item => item.id)
  );

  // ==================== DISPLAY HELPERS ====================
  
  const calculateProductCost = (): number => {
    if (currentOrder.productCost > 0) {
      return currentOrder.productCost;
    }
    const selectedItems = currentOrder.products.filter(item => 
      selectedItemIds.includes(item.id)
    );
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTotalWeight = (): number => {
    if (currentOrder.totalWeight > 0) {
      return currentOrder.totalWeight;
    }
    const selectedItems = currentOrder.products.filter(item => 
      selectedItemIds.includes(item.id)
    );
    return selectedItems.reduce((sum, item) => sum + (item.product.weight * item.addedQuantity), 0);
  };

  const calculateVAT = (): number => {
    return calculateProductCost() * 0.1;
  };

  const calculateTotal = (): number => {
    if (currentOrder.totalAmount > 0) {
      return currentOrder.totalAmount;
    }
    return calculateProductCost() + calculateVAT() + shippingData.deliveryFee;
  };

  // ==================== API HANDLERS ====================

  const handleCheckAvailabilityWrapper = async (product_id: string, requestQuantity: number): Promise<boolean> => {
    return await handleCheckAvailability(product_id, requestQuantity);
  };

  const handleCalculateFee = async (weight: number, province: string, orderValue: number): Promise<number> => {
    return await calculateFeeAPI(weight, province, orderValue);
  };

  const handleSubmitDeliveryInfo = async (deliveryInfo: IDeliveryInfo): Promise<void> => {
    setIsLoading(true);
    
    try {
      const weight = calculateTotalWeight();
      const productCost = calculateProductCost();
      
      const fee = await handleCalculateFee(weight, deliveryInfo.province, productCost);
      
      const updatedDeliveryInfo: IDeliveryInfo = {
        ...deliveryInfo,
        deliveryFee: fee,
      };

      const responseDeliveryInfo = await submitDeliveryInfoAPI(updatedDeliveryInfo);
      
      setShippingData(responseDeliveryInfo);

      setCurrentOrder({
        ...currentOrder,
        deliveryInfo: responseDeliveryInfo,
        productCost: productCost,
        totalWeight: weight,
        totalAmount: productCost + calculateVAT() + fee, 
      });

      setIsLoading(false);
      handleRequestToPayOrder();
    } catch (error) {
      console.error('Failed to submit delivery info:', error);
      setIsLoading(false);
      showNotification("error", "Failed to submit delivery info. Please check address details.");
      throw error; // Re-throw để CheckoutFlow có thể bắt lỗi
    }
  };

  const handleRequestToPayOrder = (): void => {
    const newOrderId = `AIMS-${Date.now()}`;
    setOrderId(newOrderId);
    
    setCurrentOrder({
      ...currentOrder,
      orderId: newOrderId,
    });
  };

  const handlePayOrder = (orderIdParam: string): ITransactionInfo => {
    return payOrder(orderIdParam);
  };

  // LỖI 1 ĐÃ SỬA: Bọc hàm đồng bộ trong Promise (hoặc thay bằng API call bất đồng bộ thực)
  const handleVerifyPayment = async (transactionID: string): Promise<PaymentStatus> => {
    // Giả định verifyPayment là một mock đồng bộ hoặc bạn đang gọi một API cần await
    return await Promise.resolve(verifyPayment(transactionID)); 
  };

  // LỖI 2 ĐÃ SỬA: Bọc logic trả về void trong Promise<boolean>
  const handleProcessCreditCardPayment = async (orderID: string, cardInfo: any): Promise<boolean> => {
    setIsLoading(true);
    
    return new Promise(resolve => {
        // MOCK: Giả lập 70% thành công
        setTimeout(() => {
            const success = Math.random() > 0.3;
            
            if (transactionData && success) {
                const updatedTransaction: ITransactionInfo = {
                    ...transactionData,
                    paymentStatus: 'SUCCESS',
                    invoiceStatus: true,
                };
                
                setTransactionData(updatedTransaction);
                
                setCurrentOrder({
                    ...currentOrder,
                    orderStatus: 'Completed',
                    transactionInfo: updatedTransaction,
                });
                
                setIsLoading(false);
                handleDisplayPayOrderSuccess();
                showNotification("success", "Credit card payment processed successfully!");
                resolve(true); // Trả về true nếu thành công
            } else {
                if (transactionData) {
                    const failedTransaction: ITransactionInfo = {
                        ...transactionData,
                        paymentStatus: 'FAILED',
                        errorMessage: 'Credit card payment simulation failed.',
                    };
                    setTransactionData(failedTransaction);
                }
                
                setIsLoading(false);
                showNotification("error", "Credit card payment failed. Please try again.");
                resolve(false); // Trả về false nếu thất bại
            }
        }, 2500);
    });
  };

  const handleDisplayPayOrderSuccess = (): void => {
    console.log('Payment successful, navigate to success page');
  };

  const handleDisplay = (qrCodeString: string): void => {
    console.log('Display QR Code:', qrCodeString);
  };

  // ==================== CART OPERATIONS (Có thông báo) ====================

  const addToCart = (product: IProduct, quantity: number = 1): void => {
    if (quantity > product.stock) {
      showNotification(
        "warning",
        `Only ${product.stock} items available in stock. Cannot add ${quantity}.` 
      )
      return;
    }

    const existingItem = currentOrder.products.find(
      item => item.product.product_id === product.product_id
    );

    if (existingItem) {
      const newTotal = existingItem.addedQuantity + quantity;
      if (newTotal > product.stock) {
        showNotification(
          "warning",
          `Cannot add more. Total quantity exceeds stock (${product.stock} units available).`
        );
        return;
      }
      updateCartItemQuantity(product.product_id, newTotal);
    } else {
      const newCartItem: ICartItem = {
        id: `cart-${Date.now()}-${product.product_id}`,
        product,
        addedQuantity: quantity,
        totalPrice: product.current_price * quantity,
      };

      setCurrentOrder({
        ...currentOrder,
        products: [...currentOrder.products, newCartItem],
      });
      
      setSelectedItemIds([...selectedItemIds, newCartItem.id]);

      showNotification("success", `Added ${quantity} item(s): ${product.title} to cart.`); 
    }
  };

  const updateCartItemQuantity = (product_id: string, newQuantity: number): void => {
    
    setCurrentOrder({
      ...currentOrder,
      products: currentOrder.products.map(item => {
        if (item.product.product_id === product_id) {
          if (newQuantity > item.product.stock) {
            showNotification(
              "error",
              `Update failed: Only ${item.product.stock} items available in stock.` 
            );
            return item;
          }
          if (newQuantity < 1) {
             if (item.addedQuantity > 0) {
                 showNotification("warning", "Quantity cannot be less than 1. Please use the remove button.");
             }
             return item; 
          }
          
          const updatedItem = {
            ...item,
            addedQuantity: newQuantity,
            totalPrice: item.product.current_price * newQuantity,
          };
          showNotification("info", `Quantity updated to ${newQuantity} for ${item.product.title}.`); 
          return updatedItem;
        }
        return item;
      }),
    });
  };

  const removeCartItem = (product_id: string): void => {
    
    const removedItem = currentOrder.products.find(
      (item) => item.product.product_id === product_id
    )

    const removedItemId = removedItem ? removedItem.id : null;

    setCurrentOrder({
      ...currentOrder,
      products: currentOrder.products.filter(item => item.product.product_id !== product_id),
    });

    if (removedItemId) {
      setSelectedItemIds(selectedItemIds.filter(id => id !== removedItemId));
    }

    showNotification(
      "success",
      removedItem ? `Removed item: ${removedItem.product.title} from cart.` 
      : "Item removed from cart."
    )
  };

  const toggleItemSelection = (itemId: string): void => {
    setSelectedItemIds(prevSelected => {
      const isCurrentlySelected = prevSelected.includes(itemId);
      const newSelected = isCurrentlySelected
        ? prevSelected.filter(id => id !== itemId)
        : [...prevSelected, itemId];
      
      showNotification("info", isCurrentlySelected ? "Item deselected." : "Item selected.");
      return newSelected;
    });
  };

  const selectAllItems = (selected: boolean): void => {
    if (selected) {
      setSelectedItemIds(currentOrder.products.map(item => item.id));
      showNotification("info", "All items selected.");
    } else {
      setSelectedItemIds([]);
      showNotification("info", "All items deselected.");
    }
  };

  const hasStockIssues = (): boolean => {
    const selectedItems = currentOrder.products.filter(item => 
      selectedItemIds.includes(item.id)
    );
    return selectedItems.some(item => item.addedQuantity > item.product.stock);
  };

  // ==================== CONTEXT VALUE ====================

  const value: CheckoutContextType = {
    // State
    currentOrder,
    shippingData,
    orderId,
    transactionData,
    paymentMethod,
    isLoading,
    selectedItemIds,

    // Setters
    setCurrentOrder,
    setShippingData,
    setOrderId,
    setTransactionData,
    setPaymentMethod,
    setIsLoading,
    setSelectedItemIds,

    // Display Helpers
    calculateProductCost,
    calculateTotalWeight,
    calculateVAT,
    calculateTotal,

    // API Handlers
    handleCheckAvailability: handleCheckAvailabilityWrapper,
    handleSubmitDeliveryInfo,
    handleCalculateFee,
    handleRequestToPayOrder,
    handlePayOrder,
    handleVerifyPayment,
    handleProcessCreditCardPayment,
    handleDisplayPayOrderSuccess,
    handleDisplay,

    // Cart Operations
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    toggleItemSelection,
    selectAllItems,
    hasStockIssues,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

// ==================== HOOK ====================
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}