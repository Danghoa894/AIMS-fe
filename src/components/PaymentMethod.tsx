import { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, QrCode, Loader2, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import type { ITransactionInfo, PaymentStatus } from '../types/checkout.types';
import vietQRImage from 'figma:asset/f72e2bbf5286c22cd1fda7423fc6f16d50256bde.png';

interface PaymentMethodProps {
  orderId: string;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onBack: () => void;
  onBackToCart: () => void;
  onPayOrder: (orderId: string) => ITransactionInfo;
  onVerifyPayment: (transactionID: string) => PaymentStatus;
  onProcessCreditCardPayment: (orderID: string, cardInfo: any) => void;
  onDisplayPayOrderSuccess: () => void;
  onDisplay: (qrCodeString: string) => void;
  isLoading: boolean;
}

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
  onDisplay,
  isLoading,
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

  // Initialize payment on mount (handlePayOrder)
  useEffect(() => {
    if (orderId && !transactionInfo) {
      const txnInfo = onPayOrder(orderId);
      setTransactionInfo(txnInfo);
      // Display QR Code
      onDisplay(txnInfo.qrCodeString);
    }
    // Only run when orderId changes or when transactionInfo is null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Polling for payment verification (handleVerifyPayment)
  useEffect(() => {
    if (
      paymentMethod === 'VietQR' &&
      transactionInfo &&
      transactionInfo.paymentStatus === 'PENDING' &&
      isVerifying
    ) {
      const interval = setInterval(() => {
        setVerificationAttempts((prev) => {
          const newCount = prev + 1;

          // Simulate verification API call
          const newStatus = onVerifyPayment(transactionInfo.transactionID);

          // Update transaction info with new status
          if (newStatus === 'SUCCESS') {
            setTransactionInfo({
              ...transactionInfo,
              paymentStatus: 'SUCCESS',
              invoiceStatus: true,
            });
            clearInterval(interval);
            setIsVerifying(false);
            setTimeout(() => {
              onDisplayPayOrderSuccess();
            }, 1500);
          } else if (newStatus === 'FAILED' || newCount >= 10) {
            // Timeout after 10 attempts or explicit failure
            setTransactionInfo({
              ...transactionInfo,
              paymentStatus: newStatus === 'FAILED' ? 'FAILED' : 'ERROR',
              errorMessage: newCount >= 10 ? 'Payment verification timeout' : 'Payment failed',
            });
            clearInterval(interval);
            setIsVerifying(false);
          }

          return newCount;
        });
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [paymentMethod, transactionInfo, isVerifying, onVerifyPayment, onDisplayPayOrderSuccess]);

  // Handler: Initiate VietQR Payment
  const handleInitiateVietQRPayment = () => {
    if (!transactionInfo) return;

    setIsVerifying(true);
    setTransactionInfo({
      ...transactionInfo,
      paymentStatus: 'PENDING',
    });
    setVerificationAttempts(0);
    // The useEffect will handle the verification loop
  };

  // Handler: Process Credit Card Payment
  const handleInitiateCreditCardPayment = () => {
    if (!transactionInfo) return;

    // Validate card data
    if (!cardData.cardholderName || !cardData.cardNumber || !cardData.expiry || !cardData.cvv) {
      alert('Please fill in all card details');
      return;
    }

    // Call parent handler
    onProcessCreditCardPayment(orderId, cardData);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      CREATED: {
        label: 'Payment Ready',
        className: 'bg-gray-200 text-gray-700',
        icon: null,
      },
      PENDING: {
        label: 'Verifying Payment',
        className: 'bg-blue-600 text-white',
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
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
          onValueChange={(v) => !isVerifying && !isLoading && onPaymentMethodChange(v)}
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
                {transactionInfo.paymentStatus === 'PENDING' && (
                  <div className="flex justify-between">
                    <span className="text-teal-700">Verification:</span>
                    <span className="text-teal-900">Attempt {verificationAttempts} / 10</span>
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
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-teal-200 rounded-xl p-6 inline-block shadow-lg">
                {/* Real VietQR Code Image - Can be scanned! */}
                <div className="w-80 h-80 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={vietQRImage} 
                    alt="VietQR Payment Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-teal-700 font-semibold">VietQR Payment</p>
                  <p className="text-gray-600 text-sm">Scan this QR code to complete payment</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-gray-900">Scan to Pay with VietQR</h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  Open your banking app and scan this QR code to complete the payment. The
                  transaction will be automatically verified.
                </p>
              </div>

              {transactionInfo.paymentStatus === 'PENDING' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <p className="text-blue-900 text-sm">
                      <strong>Verifying payment...</strong> Please wait while we confirm your
                      transaction.
                    </p>
                  </div>
                </div>
              )}

              {transactionInfo.paymentStatus === 'SUCCESS' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-900 text-sm">
                      <strong>Payment confirmed!</strong> Redirecting to order confirmation...
                    </p>
                  </div>
                </div>
              )}

              {transactionInfo.paymentStatus === 'CREATED' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Click "Confirm Payment" below to start verification
                  </p>
                </div>
              )}

              {(transactionInfo.paymentStatus === 'FAILED' || transactionInfo.paymentStatus === 'ERROR') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-900 text-sm">
                      <strong>Payment verification failed.</strong> Please try again or contact
                      support.
                    </p>
                  </div>
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isVerifying || isLoading || transactionInfo.paymentStatus === 'PENDING'}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Shipping
          </Button>
          <Button
            onClick={
              paymentMethod === 'VietQR' 
                ? handleInitiateVietQRPayment 
                : handleInitiateCreditCardPayment
            }
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            disabled={
              isVerifying ||
              isLoading ||
              transactionInfo.paymentStatus === 'PENDING' ||
              transactionInfo.paymentStatus === 'SUCCESS'
            }
          >
            {isVerifying || transactionInfo.paymentStatus === 'PENDING' || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : transactionInfo.paymentStatus === 'SUCCESS' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Payment Complete
              </>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </div>
      </Card>

      {/* Processing Overlay */}
      {(isVerifying || isLoading || transactionInfo.paymentStatus === 'PENDING') && (
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