/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN PaymentMethod
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: High Control Coupling + High Data Coupling
*
*    - Phụ thuộc vào:
*         + CheckoutFlow thông qua props:
*               - onPayOrder, onVerifyPayment, onProcessCreditCardPayment
*               - onDisplayPayOrderSuccess / Failed
*               - onUpdateTransaction
*               - notify()
*         + UI Components:
*               - Tabs, Buttons, Badge, Cards, Inputs
*         + Types:
*               - ITransactionInfo, PaymentStatus
*
*    - Lý do:
*         - Nhận 10+ callback từ parent → Control Coupling cao.
*         - Nhận và mutate transactionInfo nhiều lần → Data Coupling cao.
*         - Payment logic được embed trong UI component.
*
*    → Coupling cao nhưng chấp nhận được vì PaymentMethod là
*      step phức tạp nhất của flow.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Multiple Functional Cohesion (trung bình–cao)
*
*    - Các nhóm chức năng:
*         + VietQR payment (QR timer, polling, verification)
*         + Credit Card payment (form + validation)
*         + Payment result display
*         + Retry + cancel + switch method
*
*    - Lý do:
*         - Component xử lý nhiều luồng logic khác nhau.
*         - Tất cả hành vi đều xoay quanh mục đích:
*               “Xử lý thanh toán cho đơn hàng”.
*         - Dù nhiều chức năng, vẫn cohesive theo domain.
*
*    → Cohesion tốt nhưng file quá lớn (~900+ lines),
*      chưa tách PaymentService riêng.
* ---------------------------------------------------------
*/


import { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, QrCode, Loader2, ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import type { ITransactionInfo, PaymentStatus } from '../../types/checkout.types';

interface PaymentMethodProps {
  orderId: string;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onBack: () => void;
  onBackToCart: () => void;
  onPayOrder: (orderId: string) => ITransactionInfo;
  onVerifyPayment: (transactionID: string) => Promise<PaymentStatus>;
  onProcessCreditCardPayment: (orderID: string, cardInfo: any) => Promise<boolean>;
  onDisplayPayOrderSuccess: () => void;
  onDisplayPayOrderFailed: (errorMessage?: string) => void;
  onDisplay: (qrCodeString: string) => void;
  onUpdateTransaction?: (txn: ITransactionInfo) => void;
  isLoading: boolean;
  notify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

/**
 * PaymentMethod: Step 3 of checkout - Payment processing
 * Handles: VietQR and Credit Card (PayPal) payment methods
 */
export function PaymentMethod({
  orderId,
  paymentMethod,
  onPaymentMethodChange,
  onBack,
  onBackToCart,
  onPayOrder,
  onVerifyPayment,
  onProcessCreditCardPayment,
  onDisplayPayOrderSuccess,
  onDisplayPayOrderFailed,
  onDisplay,
  onUpdateTransaction,
  isLoading,
  notify,
}: PaymentMethodProps) {
  const [transactionInfo, setTransactionInfo] = useState<ITransactionInfo | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: '',
  });
  const [qrTimer, setQrTimer] = useState(60); 
  const [isQrExpired, setIsQrExpired] = useState(false);
  const [hasPaymentBeenMade, setHasPaymentBeenMade] = useState(false);

  // Initialize payment on mount 
  useEffect(() => {
    if (orderId && !transactionInfo) {
      const txnInfo = onPayOrder(orderId);
      setTransactionInfo(txnInfo);
      
      if (paymentMethod === 'VietQR') {
        onDisplay(txnInfo.qrCodeString);
        startQrTimer();
        notify("info", "VietQR transaction initiated. Please scan the QR code to pay.");
      } else if (paymentMethod === 'CreditCard') {
        notify("info", "Credit Card payment selected. Please enter your card details.");
      }
    }
  }, [orderId, transactionInfo, onPayOrder, onDisplay, paymentMethod, notify]);

  // QR Code Timer Countdown
  const startQrTimer = () => {
    setQrTimer(60);
    setIsQrExpired(false);
    
    const timer = setInterval(() => {
      setQrTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsQrExpired(true);
          handleQrExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  // Polling for payment verification
  useEffect(() => {
    if (
      paymentMethod === 'VietQR' &&
      transactionInfo &&
      transactionInfo.paymentStatus === 'PENDING' &&
      !isQrExpired
    ) {
      const interval = setInterval(async () => {
        const newCount = verificationAttempts + 1;

        try {
          // Simulate verification API call
          const newStatus = await onVerifyPayment(transactionInfo.transactionID);

          // Update transaction info with new status
          if (newStatus === 'SUCCESS') {
            const updatedTxn: ITransactionInfo = {
              ...transactionInfo,
              paymentStatus: 'SUCCESS',
              invoiceStatus: true,
            };
            setTransactionInfo(updatedTxn);
            setHasPaymentBeenMade(true);
            setVerificationAttempts(newCount);
            
            if (onUpdateTransaction) {
              onUpdateTransaction(updatedTxn);
            }
            
            clearInterval(interval);
            setIsVerifying(false);
            notify("success", "VietQR payment successfully verified!");
          } else if (newStatus === 'FAILED' || newCount >= 30) {
            const errorMsg = newCount >= 30 ? 'QR code expired. Payment timeout.' : 'Payment failed';
            
            const failedTxn: ITransactionInfo = {
              ...transactionInfo,
              paymentStatus: 'FAILED',
              errorMessage: errorMsg,
            };
            
            setTransactionInfo(failedTxn);
            setVerificationAttempts(newCount); 
            
            if (onUpdateTransaction) {
              onUpdateTransaction(failedTxn);
            }
            
            clearInterval(interval);
            setIsVerifying(false);
            setIsQrExpired(true);
            notify("error", errorMsg);
          } else {
            setVerificationAttempts(newCount);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          setVerificationAttempts(newCount);
          notify("error", "Error during payment verification. Please check network.");
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [
    paymentMethod, 
    transactionInfo, 
    isVerifying, 
    onVerifyPayment, 
    onUpdateTransaction,
    isQrExpired,
    verificationAttempts,
    notify
  ]);

  // Handler: QR Code Expired
  const handleQrExpired = () => {
    if (transactionInfo) {
      const expiredTxn: ITransactionInfo = {
        ...transactionInfo,
        paymentStatus: 'FAILED',
        errorMessage: 'QR code has expired. Please try again.',
      };
      
      setTransactionInfo(expiredTxn);
      
      if (onUpdateTransaction) {
        onUpdateTransaction(expiredTxn);
      }
      notify("warning", "QR Code has expired. Please generate a new one to continue.");
    }
  };

  // Handler: Simulate VietQR Payment (Mock function for demo)
  const simulateVietQRPayment = () => {
    if (transactionInfo && !isQrExpired) {
      
      // 1. Kích hoạt thông báo trước
      notify("success", "Simulated successful payment signal sent. Waiting for bank verification...");

      // 2. SỬA LỖI: Sử dụng setTimeout để tách biệt việc kích hoạt thông báo và cập nhật state
      setTimeout(() => {
        const successTxn: ITransactionInfo = {
          ...transactionInfo,
          paymentStatus: 'PENDING', // Đặt lại PENDING để kích hoạt polling
          invoiceStatus: false,
        };
        
        setTransactionInfo(successTxn);
        
      }, 100); 
    }
  };

  // Handler: Process Credit Card Payment
  const handleInitiateCreditCardPayment = async () => {
    if (!transactionInfo) return;

    // Validate card data
    if (!cardData.cardholderName || !cardData.cardNumber || !cardData.expiry || !cardData.cvv) {
      notify("error", "Please fill in all card details.");
      return;
    }

    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16 || !/^\d+$/.test(cleanCardNumber)) {
      notify("error", "Please enter a valid 16-digit card number.");
      return;
    }

    const [month, year] = cardData.expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      notify("error", "Please enter a valid expiry date in MM/YY format.");
      return;
    }

    if (cardData.cvv.length < 3 || cardData.cvv.length > 4 || !/^\d+$/.test(cardData.cvv)) {
      notify("error", "Please enter a valid CVV (3-4 digits).");
      return;
    }

    setIsVerifying(true);
    notify("info", "Sending card details for processing...");

    try {
      const success = await onProcessCreditCardPayment(orderId, cardData);
      
      if (success) {
        const successTxn: ITransactionInfo = {
          ...transactionInfo,
          paymentStatus: 'SUCCESS',
          invoiceStatus: true,
        };
        
        setTransactionInfo(successTxn);
        setHasPaymentBeenMade(true);
        
        if (onUpdateTransaction) {
          onUpdateTransaction(successTxn);
        }
        notify("success", "Credit card payment successful!");
      } else {
        const failedTxn: ITransactionInfo = {
          ...transactionInfo,
          paymentStatus: 'FAILED',
          errorMessage: 'Credit card payment failed. Please try again.',
        };
        
        setTransactionInfo(failedTxn);
        
        if (onUpdateTransaction) {
          onUpdateTransaction(failedTxn);
        }
        notify("error", "Credit card payment failed. Please check your details and try again.");
      }
    } catch (error) {
      const errorTxn: ITransactionInfo = {
        ...transactionInfo,
        paymentStatus: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Payment processing error',
      };
      
      setTransactionInfo(errorTxn);
      
      if (onUpdateTransaction) {
        onUpdateTransaction(errorTxn);
      }
      notify("error", "An unexpected error occurred during credit card processing.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handler: Confirm payment and navigate
  const handleConfirmPayment = () => {
    if (!transactionInfo) return;

    if (transactionInfo.paymentStatus === 'SUCCESS') {
      onDisplayPayOrderSuccess();
    } else {
      onDisplayPayOrderFailed(transactionInfo.errorMessage || 'Payment not completed');
      notify("warning", "Payment is not yet successful. Please complete the transaction.");
    }
  };

  // Handler: Retry payment after failure
  const handleRetryPayment = () => {
    if (!transactionInfo) return;

    const retryTxn: ITransactionInfo = {
      ...transactionInfo,
      paymentStatus: 'CREATED',
      errorMessage: undefined,
    };
    
    setTransactionInfo(retryTxn);
    setVerificationAttempts(0);
    setIsVerifying(false);
    setHasPaymentBeenMade(false);
    
    if (paymentMethod === 'VietQR') {
      startQrTimer();
      notify("info", "New transaction initiated. Please scan to pay.");
    } else if (paymentMethod === 'CreditCard') {
      notify("info", "Payment form reset. Please try entering your card details again.");
    }
    
    if (onUpdateTransaction) {
      onUpdateTransaction(retryTxn);
    }
  };

  // Handler: Cancel payment and go back to cart
  const handleCancelPayment = () => {
    if (transactionInfo) {
      const cancelledTxn: ITransactionInfo = {
        ...transactionInfo,
        paymentStatus: 'CANCELLED',
      };
      
      if (onUpdateTransaction) {
        onUpdateTransaction(cancelledTxn);
      }
    }
    
    onBackToCart();
    notify("warning", "Payment process cancelled. Returning to cart.");
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      CREATED: {
        label: 'Payment Ready',
        className: 'bg-gray-200 text-gray-700',
        icon: null,
      },
      PENDING: {
        label: 'Waiting for Payment',
        className: 'bg-blue-600 text-white',
        icon: <Clock className="w-3 h-3" />,
      },
      SUCCESS: {
        label: 'Payment Successful',
        className: 'bg-green-600 text-white',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      FAILED: {
        label: 'Payment Failed',
        className: 'bg-red-600 text-white',
        icon: <XCircle className="w-3 h-3" />,
      },
      CANCELLED: {
        label: 'Payment Cancelled',
        className: 'bg-gray-400 text-white',
        icon: <XCircle className="w-3 h-3" />,
      },
      REFUNDED: {
        label: 'Payment Refunded',
        className: 'bg-orange-500 text-white',
        icon: null,
      },
      ERROR: {
        label: 'Payment Error',
        className: 'bg-red-600 text-white',
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.icon && <span className="mr-1">{config.icon}</span>}
        {config.label}
      </Badge>
    );
  };

  if (!transactionInfo) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Payment Method</h2>
          <p className="text-gray-600 mt-2">
            Choose your preferred payment method and complete your order
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onBackToCart}
          className="text-gray-600 hover:text-gray-900"
          disabled={isVerifying || isLoading}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>
      </div>

      <Card className="p-6">
        <Tabs 
          value={paymentMethod} 
          onValueChange={(v: string) => {
            if (!isVerifying && !isLoading) {
              onPaymentMethodChange(v);
              
              setHasPaymentBeenMade(false);
              if (v === 'VietQR' && transactionInfo) {
                startQrTimer();
              }
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="VietQR" className="flex items-center gap-2" disabled={isVerifying || isLoading}>
              <QrCode className="w-4 h-4" />
              VietQR
            </TabsTrigger>
            <TabsTrigger value="CreditCard" className="flex items-center gap-2" disabled={isVerifying || isLoading}>
              <CreditCard className="w-4 h-4" />
              Credit Card
            </TabsTrigger>
          </TabsList>

          {/* VietQR Payment */}
          <TabsContent value="VietQR" className="space-y-6">
            {/* Transaction Info Display (ITransactionInfo) */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-teal-900">Transaction Information</h4>
                {getStatusBadge(transactionInfo.paymentStatus)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-teal-700">Transaction ID:</span>
                  <span className="text-teal-900 font-mono">{transactionInfo.transactionID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal-700">Date/Time:</span>
                  <span className="text-teal-900">
                    {transactionInfo.dateTime.toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal-700">Content:</span>
                  <span className="text-teal-900">{transactionInfo.content}</span>
                </div>
                {transactionInfo.paymentStatus === 'PENDING' && !isQrExpired && (
                  <div className="flex justify-between">
                    <span className="text-teal-700">Time Remaining:</span>
                    <span className="text-teal-900 font-mono">
                      {Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                {transactionInfo.errorMessage && (
                  <div className="flex justify-between">
                    <span className="text-teal-700">Error:</span>
                    <span className="text-red-600">{transactionInfo.errorMessage}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center space-y-4">
              {/* QR Code Display - Hiển thị khi chưa thanh toán và QR chưa hết hạn */}
              {transactionInfo.paymentStatus !== 'SUCCESS' && !isQrExpired && (
                <>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 inline-block">
                    <div className="w-64 h-64 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src="https://media-cdn-v2.laodong.vn/storage/newsportal/2021/6/15/920631/4128Nh_2021-06-15_Lu.jpeg"
                        alt="VietQR Sample"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Demo button to simulate payment (remove in production) */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-yellow-800 text-sm mb-2">
                      <strong>Demo:</strong> Click below to simulate successful payment
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={simulateVietQRPayment}
                      className="w-full"
                    >
                      Simulate Successful Payment
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-gray-900">Scan to Pay with VietQR</h3>
                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                      Open your banking app and scan this QR code to complete the payment. 
                      {transactionInfo.paymentStatus === 'PENDING' && (
                        <> The QR code will expire in <strong>{qrTimer} seconds</strong>.</>
                      )}
                    </p>
                  </div>

                  {transactionInfo.paymentStatus === 'PENDING' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-center gap-2 justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <p className="text-blue-900 text-sm">
                          <strong>Waiting for payment...</strong> Please scan the QR code to complete payment.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* QR Code đã hết hạn */}
              {isQrExpired && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-red-900 font-semibold mb-2">QR Code Expired</h3>
                  <p className="text-red-800 text-sm mb-4">
                    The QR code has expired. Please try again to generate a new one.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleRetryPayment}
                    className="w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate New QR Code
                  </Button>
                </div>
              )}

              {/* Đã thanh toán thành công - QR biến mất */}
              {transactionInfo.paymentStatus === 'SUCCESS' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-green-900 font-semibold mb-2">Payment Successful!</h3>
                  <p className="text-green-800 text-sm mb-4">
                    Your payment has been processed successfully. Click the button below to confirm and view your order details.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Credit Card Payment */}
          <TabsContent value="CreditCard" className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-900 text-sm">
                💳 <strong>PayPal Sandbox:</strong> This is a test environment. Use sandbox
                credentials for testing.
              </p>
            </div>

            {/* Card Form - Only show when not processing and not successful */}
            {transactionInfo.paymentStatus !== 'SUCCESS' && (
              <div className="space-y-4">
                {/* Cardholder Name */}
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">
                    Cardholder Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cardholderName"
                    type="text"
                    placeholder="John Doe"
                    value={cardData.cardholderName}
                    onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
                    disabled={isLoading || isVerifying}
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">
                    Card Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                      setCardData({ ...cardData, cardNumber: formatted });
                    }}
                    maxLength={19}
                    disabled={isLoading || isVerifying}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Expiry Date */}
                  <div className="space-y-2">
                    <Label htmlFor="expiry">
                      Expiry Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted =
                          value.length >= 2 ? `${value.slice(0, 2)}/${value.slice(2, 4)}` : value;
                        setCardData({ ...cardData, expiry: formatted });
                      }}
                      maxLength={5}
                      disabled={isLoading || isVerifying}
                    />
                  </div>

                  {/* CVV */}
                  <div className="space-y-2">
                    <Label htmlFor="cvv">
                      CVV <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setCardData({ ...cardData, cvv: value });
                      }}
                      maxLength={4}
                      disabled={isLoading || isVerifying}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Credit Card Payment Status */}
            {isVerifying && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <p className="text-blue-900">
                    <strong>Processing payment...</strong> Please wait while we verify your card details.
                  </p>
                </div>
              </div>
            )}

            {transactionInfo.paymentStatus === 'SUCCESS' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-2 justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-green-900 font-semibold text-center mb-2">Payment Successful!</h3>
                <p className="text-green-800 text-sm text-center mb-4">
                  Your credit card payment has been processed successfully. 
                  Click the button below to confirm and view your order details.
                </p>
              </div>
            )}

            {transactionInfo.paymentStatus === 'FAILED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-2 justify-center mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-red-900 font-semibold text-center mb-2">Payment Failed</h3>
                <p className="text-red-800 text-sm text-center mb-4">
                  {transactionInfo.errorMessage || 'Payment processing failed. Please try again.'}
                </p>
                <Button
                  variant="outline"
                  onClick={handleRetryPayment}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isVerifying || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Shipping
          </Button>

          {/* Cancel Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelPayment}
            className="flex-1"
            disabled={isLoading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Order
          </Button>

          {/* Main Confirm Payment Button - Luôn hiển thị */}
          <Button
            onClick={handleConfirmPayment}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            disabled={isVerifying || isLoading}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : transactionInfo.paymentStatus === 'SUCCESS' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm & View Order
              </>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </div>
      </Card>

      {/* Processing Overlay */}
      {(isVerifying || isLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-8 max-w-sm">
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 text-teal-600 mx-auto animate-spin" />
              <div>
                <h3 className="text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-gray-600 text-sm">
                  Please wait while we process your transaction...
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}