import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

interface OrderSummaryProps {
  productCost: number; // IOrder.productCost
  vat: number;
  deliveryFee: number; // IDeliveryInfo.deliveryFee
  totalAmount: number; // IOrder.totalAmount
  totalWeight: number; // IOrder.totalWeight
  showShippingFee: boolean;
}

export function OrderSummary({
  productCost,
  vat,
  deliveryFee,
  totalAmount,
  totalWeight,
  showShippingFee,
}: OrderSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Card className="p-6">
      <h3 className="mb-6">Order Summary</h3>

      <div className="space-y-4">
        {/* Product Cost (matching IOrder.productCost) */}
        <div className="flex justify-between text-gray-600">
          <span>Product Cost (Excl. VAT)</span>
          <span>{formatPrice(productCost)}</span>
        </div>

        {/* Total Weight (matching IOrder.totalWeight) */}
        {totalWeight > 0 && (
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Total Weight</span>
            <span>{totalWeight.toFixed(2)} kg</span>
          </div>
        )}

        {/* VAT Amount */}
        <div className="flex justify-between text-gray-600">
          <span>VAT (10%)</span>
          <span>{formatPrice(vat)}</span>
        </div>

        {/* Total with VAT */}
        <div className="flex justify-between">
          <span>Total (Incl. VAT)</span>
          <span className="text-gray-900">{formatPrice(productCost + vat)}</span>
        </div>

        {/* Delivery Fee (matching IDeliveryInfo.deliveryFee) */}
        {showShippingFee && (
          <>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivery Fee</span>
              <div className="flex items-center gap-2">
                {deliveryFee === 0 && productCost >= 100000 ? (
                  <>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      FREE
                    </Badge>
                    <span className="text-gray-400 line-through text-sm">
                      {formatPrice(25000)}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-900">{formatPrice(deliveryFee)}</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Free Shipping Info */}
        {showShippingFee && deliveryFee === 0 && productCost >= 100000 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 text-sm">🎉 You've qualified for free shipping!</p>
          </div>
        )}

        <Separator className="my-4" />

        {/* Total Amount (matching IOrder.totalAmount) */}
        <div className="flex justify-between items-center">
          <span className="text-lg">Total Amount</span>
          <span className="text-2xl text-teal-600">{formatPrice(totalAmount)}</span>
        </div>
      </div>
    </Card>
  );
}
