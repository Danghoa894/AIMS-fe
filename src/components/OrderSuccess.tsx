/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN OrderSuccess (UI Component)
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Data Coupling
*
*    - Phụ thuộc vào:
*         + UI Components:
*               - Card, Button, Separator, Badge
*         + Icons:
*               - CheckCircle, Package, Mail, Phone, MapPin, Weight
*         + Types:
*               - IOrder, ITransactionInfo, IDeliveryInfo
*         + Parent module:
*               - Nhận props: currentOrder, transactionData, shippingData
*
*    - Lý do:
*         - Component chỉ nhận props và render UI → Data Coupling thuần túy.
*         - Không thay đổi state global / không gọi navigate.
*         - Các formatPrice, formatDate là utilities nội bộ → không làm tăng coupling.
*       → Coupling rất thấp, thuộc dạng UI presentational component chuẩn.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Functional Cohesion (cao)
*
*    - Các chức năng:
*         + Render giao diện xác nhận đơn hàng.
*         + Format dữ liệu hiển thị (giá tiền, thời gian).
*         + Hiển thị chi tiết order, shipping, phí, summary.
*         + In đơn hàng / quay lại trang chủ.
*
*    - Lý do:
*         - Mọi chức năng nhằm phục vụ một mục tiêu:
*           “Hiển thị chi tiết đơn hàng sau khi thanh toán thành công”.
*         - Không chứa logic điều hướng, không xử lý validation, không xử lý giao dịch.
*         - Các hàm format nằm trong phạm vi hiển thị UI → cohesive.
*         - Component khá lớn nhưng vẫn tập trung vào một chức năng chính.
*       → Cohesion rất cao và là mô-đun trình bày (presentation) thuần túy.
*
* ---------------------------------------------------------
*/


import { CheckCircle, Package, Mail, Phone, MapPin, Weight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import type { IOrder, ITransactionInfo, IDeliveryInfo } from '../types/checkout.types';

interface OrderSuccessProps {
  currentOrder: IOrder;
  transactionData: ITransactionInfo;
  shippingData: IDeliveryInfo;
}

export function OrderSuccess({ currentOrder, transactionData, shippingData }: OrderSuccessProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-600 text-white';
      case 'PENDING':
        return 'bg-blue-600 text-white';
      case 'FAILED':
      case 'ERROR':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-teal-600">AIMS - An Internet Media Store</h1>
        </div>
      </header>

      {/* Success Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Icon and Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-green-600 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been confirmed and will be processed
            shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Order Details Card (IOrder) */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-teal-600" />
              <h3>Order Information</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono">{currentOrder.orderId}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Order Status</p>
                <Badge className="mt-1">{currentOrder.orderStatus}</Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono">{transactionData.transactionID}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <Badge className={`mt-1 ${getStatusBadgeClass(transactionData.paymentStatus)}`}>
                  {transactionData.paymentStatus}
                </Badge>
              </div>

              {transactionData.invoiceStatus && (
                <div>
                  <p className="text-sm text-gray-500">Invoice Status</p>
                  <Badge className="mt-1 bg-green-600 text-white">
                    Invoice Generated
                  </Badge>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p>{formatDate(transactionData.dateTime)}</p>
              </div>

              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Total Weight</p>
                  <p>{currentOrder.totalWeight.toFixed(2)} kg</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping Information Card (IDeliveryInfo) */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-teal-600" />
              <h3>Shipping Information</h3>
            </div>

            <div className="space-y-3">
              {shippingData.deliveryId && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Delivery ID</p>
                    <p className="font-mono">{shippingData.deliveryId}</p>
                  </div>
                  <Separator />
                </>
              )}

              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p>{shippingData.fullName}</p>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p>{shippingData.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{shippingData.Email}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p>{shippingData.address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Province / City</p>
                <p>{shippingData.province}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Delivery Method</p>
                <p>{shippingData.deliveryMethod}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Delivery Fee</p>
                <p>
                  {shippingData.deliveryFee === 0 ? (
                    <Badge className="bg-green-100 text-green-700">FREE</Badge>
                  ) : (
                    formatPrice(shippingData.deliveryFee)
                  )}
                </p>
              </div>

              {shippingData.note && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Note</p>
                    <p className="text-sm">{shippingData.note}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="p-6 mb-8">
          <h3 className="mb-4">Payment Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Product Cost (Excl. VAT)</span>
              <span>{formatPrice(currentOrder.productCost)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Total Weight</span>
              <span>{currentOrder.totalWeight.toFixed(2)} kg</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>VAT (10%)</span>
              <span>{formatPrice(currentOrder.productCost * 0.1)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>
                {shippingData.deliveryFee === 0 ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    FREE
                  </Badge>
                ) : (
                  formatPrice(shippingData.deliveryFee)
                )}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg">Total Amount Paid</span>
              <span className="text-2xl text-teal-600">
                {formatPrice(currentOrder.totalAmount)}
              </span>
            </div>
          </div>

          {/* Products List */}
          <Separator className="my-4" />
          <h4 className="mb-3">Ordered Products</h4>
          <div className="space-y-2">
            {currentOrder.products.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product.title} × {item.addedQuantity}
                </span>
                <span className="text-gray-900">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.print()}
            className="sm:w-auto"
          >
            Print Order Details
          </Button>
          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 sm:w-auto"
            onClick={() => (window.location.href = '/')}
          >
            Continue Shopping
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm">
            📧 <strong>Confirmation Email:</strong> A confirmation email has been sent to{' '}
            <strong>{shippingData.Email}</strong> with your order details and tracking
            information.
          </p>
        </div>
      </div>
    </div>
  );
}