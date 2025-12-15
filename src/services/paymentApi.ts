/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN paymentApi
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Data Coupling
*    - Với lớp nào:
*         + ITransactionInfo, PaymentStatus (types layer)
*    - Lý do:
*         - Module chỉ giao tiếp qua tham số hoặc giá trị trả về.
*         - Không phụ thuộc vào logic Cart hoặc Delivery.
*         - Không dùng global state → coupling thấp.
*
* 2. COHESION:
*    - Mức độ: Functional Cohesion
*    - Giữa các thành phần:
*         + handlePayOrder
*         + handleVerifyPayment
*         + handleProcessCreditCardPayment
*         + handleDisplay
*    - Lý do:
*         - Tất cả đều liên quan đến xử lý thanh toán (Payment).
*         - Module chuyên trách một nhiệm vụ duy nhất.
* --------------------------------------------------------- */
import type { ITransactionInfo, PaymentStatus } from '../types/checkout.types';

// ==================== PAYMENT API SERVICES ====================
// These functions simulate API calls to the backend Payment Controller
// In production, replace with actual API endpoints

/**
 * handlePayOrder: Initialize payment transaction
 * Simulates: PaymentController.payOrder(orderId)
 * 
 * In production, this would be:
 * POST /api/payment/initialize
 * Body: { orderId, paymentMethod }
 * Response: { transactionInfo }
 */
export const handlePayOrder = (orderIdParam: string): ITransactionInfo => {
  const transactionID = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const transaction: ITransactionInfo = {
    transactionID,
    content: `Payment for Order ${orderIdParam}`,
    dateTime: new Date(),
    paymentStatus: 'CREATED',
    invoiceStatus: false,
    qrCodeString: `QR-${transactionID}-${orderIdParam}`,
  };
  
  return transaction;
};

/**
 * handleVerifyPayment: Verify payment status
 * Simulates: PaymentController.verifyPayment(transactionID)
 * 
 * In production, this would be:
 * GET /api/payment/verify/{transactionID}
 * Response: { paymentStatus }
 */
export const handleVerifyPayment = async (transactionID: string): Promise<PaymentStatus> => {
  // Simulate API call
  console.log('Verifying payment:', transactionID);
  
  // In production, this would call actual payment gateway API
  // For now, simulating verification with random results
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Random status for demo
  const random = Math.random();
  if (random > 0.7) {
    return 'SUCCESS'; // 30% success rate
  } else if (random > 0.4) {
    return 'FAILED'; // 30% failure rate
  } else {
    return 'PENDING'; // 40% still pending
  }
};

/**
 * handleProcessCreditCardPayment: Process credit card payment (PayPal)
 * Simulates: PayOrderController.processCreditCardPayment(orderID, cardInfo)
 * 
 * In production, this would be:
 * POST /api/payment/process-card
 * Body: { orderId, cardInfo }
 * Response: { success: boolean }
 */
export const handleProcessCreditCardPayment = async (
  orderID: string,
  cardInfo: any
): Promise<boolean> => { // SỬA: Trả về Promise<boolean> thay vì Promise<ITransactionInfo>
  // Simulate API delay for payment processing
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // In production, this would process payment through PayPal/Stripe
  // For demo, 70% success rate
  const isSuccess = Math.random() > 0.3;
  
  return isSuccess;
};

/**
 * Mock QR Code Display
 * Simulates: OrderUI.display(qrCodeString)
 */
export const handleDisplay = (qrCodeString: string): void => {
  console.log('Displaying QR Code:', qrCodeString);
  // QR Code display logic is handled in UI component
};