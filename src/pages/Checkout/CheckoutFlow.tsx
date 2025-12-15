/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN CheckoutFlow
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Moderate Control Coupling + Data Coupling
*
*    - Phụ thuộc vào:
*         + Context:
*               - useCheckout (core business flow)
*               - useNotification
*         + Child Components:
*               - ShippingForm
*               - PaymentMethod
*               - OrderSummary
*               - StepIndicator
*         + Routing:
*               - useNavigate
*
*    - Lý do:
*         - Điều hướng checkoutStep trực tiếp → Control Coupling.
*         - Truyền nhiều props sang PaymentMethod và ShippingForm → Data Coupling vừa phải.
*         - Không xử lý logic tính toán/ API, để context đảm nhiệm.
*
*    → Coupling hợp lý cho component điều phối flow.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Sequential Cohesion (cao)
*
*    - Lý do:
*         - Component chịu trách nhiệm duy nhất:
*               “Điều phối từng bước của quy trình Checkout”.
*         - Không chứa validation, logic thanh toán, tính phí.
*         - Chỉ chuyển tiếp dữ liệu & gọi handlers từ Context.
*
*    → Cohesion cao: đúng vai trò parent controller của flow.
* ---------------------------------------------------------
*/


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCheckout } from '../../context/CheckoutContext';
import { useNotification } from '../../context/NotificationContext'; 
import { ShippingForm } from './ShippingForm';
import { PaymentMethod } from './PaymentMethod';
import { OrderSummary } from '../../components/OrderSummary';
import { StepIndicator } from '../../components/StepIndicator';

/**
 * CheckoutFlow: Parent component managing the checkout process
 * Route: /checkout
 * Layout: HeaderOnly
 */
export function CheckoutFlow() {
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState<number>(2); 
  const { showNotification: notify } = useNotification(); 

  const {
    currentOrder,
    shippingData,
    orderId,
    paymentMethod,
    isLoading,
    setPaymentMethod,
    setTransactionData,
    calculateProductCost,
    calculateTotalWeight,
    calculateVAT,
    calculateTotal,
    handleSubmitDeliveryInfo,
    handlePayOrder,
    handleVerifyPayment,
    handleProcessCreditCardPayment,
    handleDisplay,
  } = useCheckout();

  // Navigate to payment step when orderId is set
  useEffect(() => {
    if (orderId && checkoutStep === 2) {
      setCheckoutStep(3);
      notify("success", "Shipping details confirmed. Proceeding to Payment.");
    }
  }, [orderId, checkoutStep, notify]);

  const handleShippingSubmit = async (deliveryInfo: any) => {
    try {
        await handleSubmitDeliveryInfo(deliveryInfo);
    } catch (error) {
        // Lỗi đã được throw từ CheckoutContext và được bắt ở đây
        // Thông báo lỗi đã được gửi từ CheckoutContext
    }
  };

  const handleBackToCart = () => {
    navigate('/cart');
    notify("info", "Returning to Shopping Cart.");
  };

  const handlePaymentSuccess = () => {
    navigate('/order-success');
    notify("success", "Order payment successful! Thank you for your purchase.");
  };

  const handlePaymentFailed = (errorMessage?: string) => {
    notify("error", errorMessage || "Payment processing failed. Please retry.");
  };

  // Redirect if no products in cart
  useEffect(() => {
    if (currentOrder.products.length === 0) {
      navigate('/cart');
      notify("warning", "Your cart is empty. Redirecting to Cart page.");
    }
  }, [currentOrder.products.length, navigate, notify]);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-8 px-6 py-6">
        <StepIndicator currentStep={checkoutStep} />
      </div>

      {/* Checkout Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2">
          {checkoutStep === 2 && (
            <ShippingForm
              shippingData={shippingData}
              onBack={handleBackToCart}
              onBackToCart={handleBackToCart}
              onSubmit={handleShippingSubmit}
              isLoading={isLoading}
              notify={notify}
            />
          )}
          
          {checkoutStep === 3 && (
            <PaymentMethod
              orderId={orderId}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onBack={() => {
                setCheckoutStep(2);
                notify("info", "Returning to Shipping Information step.");
              }}
              onBackToCart={handleBackToCart}
              onPayOrder={handlePayOrder}
              onVerifyPayment={handleVerifyPayment}
              onProcessCreditCardPayment={handleProcessCreditCardPayment}
              onDisplayPayOrderSuccess={handlePaymentSuccess}
              onDisplayPayOrderFailed={handlePaymentFailed}
              onDisplay={handleDisplay}
              onUpdateTransaction={setTransactionData}
              isLoading={isLoading}
              notify={notify}
            />
          )}
        </div>

        {/* Right Column - Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <OrderSummary
              productCost={calculateProductCost()}
              vat={calculateVAT()}
              deliveryFee={shippingData.deliveryFee}
              totalAmount={calculateTotal()}
              totalWeight={calculateTotalWeight()}
              showShippingFee={checkoutStep >= 2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}