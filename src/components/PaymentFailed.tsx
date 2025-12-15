import {
  XCircle,
  RotateCcw,
  Home,
  Ban,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useNavigate } from "react-router";

interface PaymentFailedProps {
  orderId: string;
  errorMessage?: string;
  onRetryPayment: () => void;
  onCancelOrder: () => void;
}

export function PaymentFailed({
  orderId,
  errorMessage,
  onRetryPayment,
  onCancelOrder,
}: PaymentFailedProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Error Icon and Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-red-600 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-4">
            We encountered an issue processing your payment.
            Please try again or contact support.
          </p>
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-800 text-sm">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        <Card className="p-6 mb-6">
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-mono text-lg">{orderId}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Your order has been
                created but payment is pending. You can retry
                the payment or cancel the order.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onCancelOrder}
            className="sm:flex-1"
          >
            <Ban className="w-5 h-5 mr-2" />
            Cancel Order
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleGoHome}
            className="sm:flex-1"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Button>

          <Button
            size="lg"
            onClick={onRetryPayment}
            className="sm:flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Retry Payment
          </Button>
        </div>

        {/* Support Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="w-4 h-4" />
            <a href="tel:+84234567890" className="underline">
              +84 234 567 890
            </a>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            <a
              href="mailto:support@aims.com"
              className="underline"
            >
              support@aims.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}