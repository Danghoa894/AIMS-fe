import { useNavigate } from 'react-router';
import { useCheckout } from '../../context/CheckoutContext';
import { CartPage as CartPageComponent } from '../../components/CartPage';
import {useNotification} from "../../context/NotificationContext" // 👈 Tích hợp Notification

/**
 * CartPage: Shopping cart page
 * Route: /cart
 * Layout: DefaultLayout
 */
export function CartPage() {
  const navigate = useNavigate();
  const {
    currentOrder,
    selectedItemIds,
    updateCartItemQuantity,
    removeCartItem,
    toggleItemSelection,
    selectAllItems,
    hasStockIssues,
    setCurrentOrder,
  } = useCheckout();

  const {showNotification} = useNotification(); // 👈 Lấy hàm thông báo



  const handleProceedToCheckout = (): void => {
    if (selectedItemIds.length === 0) {
      showNotification("warning", "Please select at least one item to checkout."); // 👈 Thông báo CẢNH BÁO
      return;
    }
    if (!hasStockIssues() && currentOrder.products.length > 0) {
      // Filter order to only include selected items before proceeding
      const selectedProducts = currentOrder.products.filter(item => 
        selectedItemIds.includes(item.id)
      );
      setCurrentOrder({
        ...currentOrder,
        products: selectedProducts,
      });
      navigate('/checkout');
      showNotification("success", "Proceeding to checkout with selected items."); // 👈 Thông báo THÀNH CÔNG
    } else if (currentOrder.products.length === 0) {
      showNotification("info", "Your cart is empty. Please add items to proceed.") // 👈 Thông báo INFO
    } else {
      showNotification(
        "error",
        "Please adjust product quantitites to match available stock." // 👈 Thông báo LỖI
      )
    }
  };

  return (
    <CartPageComponent
      cartItems={currentOrder.products}
      onUpdateQuantity={updateCartItemQuantity}
      onRemoveItem={removeCartItem}
      onProceedToCheckout={handleProceedToCheckout}
      hasStockIssues={hasStockIssues()}
      selectedItemIds={selectedItemIds}
      onToggleItem={toggleItemSelection}
      onSelectAll={selectAllItems}

      notify={showNotification} // Giữ lại notify nếu muốn gọi thông báo từ CartPageComponent
    />
  );
}