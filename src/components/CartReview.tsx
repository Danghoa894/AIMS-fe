/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN CartReview
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Data Coupling + Control Coupling
*
*    - Với lớp/module nào:
*         + UI Components:
*             - Alert, AlertDescription
*             - Button
*             - Card
*         + Icons:
*             - AlertCircle, Minus, Plus
*         + Image Component:
*             - ImageWithFallback
*         + Types:
*             - Product (dữ liệu sản phẩm)
*         + Parent Component:
*             - onUpdateQuantity()
*             - onProceed()
*
*    - Lý do:
*         - Component nhận toàn bộ dữ liệu từ props → Data Coupling (mức thấp & an toàn).
*         - Tất cả hành động (update quantity, next step) đều gọi callback do parent cung cấp → Control Coupling.
*           Đây là kiểu coupling phổ biến trong React và không gây ràng buộc logic xấu.
*         - Không truy cập trực tiếp state bên ngoài → giảm coupling.
*         - Phụ thuộc vào UI components nhưng chỉ phục vụ hiển thị, không ảnh hưởng business logic.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Functional Cohesion (cao)
*
*    - Giữa các thành phần:
*         + formatPrice()
*         + Render danh sách sản phẩm
*         + Render cảnh báo stock
*         + Render phần Quantity Control
*         + Render subtotal
*         + Render nút Proceed
*
*    - Lý do:
*         - Tất cả logic và giao diện trong component phục vụ một chức năng duy nhất:
*               "Review giỏ hàng và kiểm tra tồn kho trước khi checkout."
*         - Không chứa logic không liên quan (ví dụ xử lý cart tổng quan, shipping, thanh toán…).
*         - Mỗi phần UI (stock warning, subtotal, quantity control) đều phục vụ mục tiêu chính.
*         - Hàm helper formatPrice() chỉ phục vụ việc hiển thị → giữ cohesive tốt.
*         - Component tương đối gọn, không có logic ngoài phạm vi → cohesion cao.
*
* ---------------------------------------------------------
*/
import { AlertCircle, Minus, Plus } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Product } from '../App';

interface CartReviewProps {
  products: Product[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onProceed: () => void;
  hasStockIssues: boolean;
}

export function CartReview({
  products,
  onUpdateQuantity,
  onProceed,
  hasStockIssues,
}: CartReviewProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Shopping Cart</h2>
        <p className="text-gray-600 mt-2">Review your items and check availability</p>
      </div>

      {/* Stock Error Banner */}
      {hasStockIssues && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <span className="block mb-1">
              <strong>Stock Issue Detected:</strong>
            </span>
            Some items in your cart exceed the available stock. Please adjust the
            quantities before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {/* Product List */}
      <div className="space-y-4">
        {products.map((product) => {
          const hasIssue = product.quantity > product.stock;
          return (
            <Card
              key={product.id}
              className={`p-4 ${hasIssue ? 'border-red-300 bg-red-50' : ''}`}
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Price: {formatPrice(product.price)}
                  </p>

                  {/* Stock Warning */}
                  {hasIssue && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Only {product.stock} items available</span>
                    </div>
                  )}

                  {/* Quantity Control */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onUpdateQuantity(product.id, Math.max(1, product.quantity - 1))
                        }
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center">{product.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="text-gray-600 text-sm mb-1">Subtotal</p>
                  <p className="text-teal-600">
                    {formatPrice(product.price * product.quantity)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onProceed}
          disabled={hasStockIssues}
          className="bg-teal-600 hover:bg-teal-700 px-8"
          size="lg"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
