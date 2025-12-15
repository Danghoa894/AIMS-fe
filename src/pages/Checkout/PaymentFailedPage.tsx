/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN PaymentFailedPage
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Low Control Coupling
*
*    - Phụ thuộc vào:
*         + Routing: useNavigate, useLocation
*         + Context: useCheckout (để lấy orderId)
*         + UI Component: PaymentFailed
*
*    - Lý do:
*         - Page rất nhỏ, chỉ đọc data + điều hướng.
*         - Không chứa logic thanh toán.
*
*    → Coupling rất thấp.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Functional Cohesion (cao)
*
*    - Lý do:
*         - Là page hiển thị thông báo thất bại duy nhất.
*         - Không chứa UI/logic thừa.
*         - Đúng nhiệm vụ: show error + 2 hành động retry/cancel.
*
*    → Cohesion cao và đúng chức năng.
* ---------------------------------------------------------
*/


import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useCheckout } from '../../context/CheckoutContext';
import { PaymentFailed } from '../../components/PaymentFailed';

export function PaymentFailedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentOrder
  } = useCheckout();

  // Get error message from location state
  const errorMessage = location.state?.errorMessage || 'Payment processing failed. Please try again.';

  // Redirect if no order data
  useEffect(() => {
    if (!currentOrder.orderId) {
      navigate('/cart');
    }
  }, [currentOrder.orderId, navigate]);

  const handleRetryPayment = () => {
    // Navigate back to payment step
    navigate('/checkout');
  };

  const handleCancelOrder = () => {
    // Go to cart (we don't have resetCheckout function)
    navigate('/cart');
  };

  return (
    <PaymentFailed
      orderId={currentOrder.orderId || 'N/A'}
      errorMessage={errorMessage}
      onRetryPayment={handleRetryPayment}
      onCancelOrder={handleCancelOrder}
    />
  );
}