/* ---------------------------------------------------------
 * ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN CartPage
 * ---------------------------------------------------------
 * 1. COUPLING:
 *    - Mức độ: Data Coupling + Control Coupling
 *
 *    - Với lớp/module nào:
 *         + UI Components:
 *             - Button, Card, Separator, Checkbox
 *         + Image component:
 *             - ImageWithFallback
 *         + Icons:
 *             - Minus, Plus, Trash2, ShoppingBag, AlertCircle
 *         + Types:
 *             - ICartItem (product & cart structure)
 *         + Parent component:
 *             - onUpdateQuantity()
 *             - onRemoveItem()
 *             - onToggleItem()
 *             - onSelectAll()
 *             - onProceedToCheckout()
 *             - notify()
 *
 *    - Lý do:
 *         - Component **không tự xử lý logic giỏ hàng**, toàn bộ cập nhật state được chuyển
 *           ra ngoài qua props → đây là **Control Coupling** (cha điều khiển con thông qua callback).
 *         - CartPage chỉ nhận dữ liệu cartItems qua props → **Data Coupling** là chủ yếu.
 *         - Không truy cập trực tiếp business logic bên ngoài → coupling thấp và an toàn.
 *         - Phụ thuộc vào nhiều UI module nhưng chỉ ở mức giao diện, không ảnh hưởng logic,
 *           phù hợp với kiến trúc React component-based.
 *
 * ---------------------------------------------------------
 * 2. COHESION:
 *    - Mức độ: Functional Cohesion (rất cao)
 *
 *    - Giữa các thành phần:
 *         + formatPrice()
 *         + calculateCartTotal()
 *         + Các render block:
 *             - Select All
 *             - Cart Items list
 *             - Quantity update controls
 *             - Cart Summary (Selected items, warnings, checkout button)
 *         + Xử lý hiển thị cảnh báo stock, selected items
 *
 *    - Lý do:
 *         - Mọi thành phần trong component phục vụ **một chức năng duy nhất**:
 *             "Hiển thị và xử lý giao diện giỏ hàng cho người dùng."
 *         - Tách rõ từng phần UI nhưng tất cả đều xoay quanh nghiệp vụ Cart.
 *         - Các hàm helper chỉ dùng nội bộ và liên quan chặt chẽ đến tính toán giỏ hàng.
 *         - Không chứa logic ngoài phạm vi giỏ hàng (ví dụ: không có logic sản phẩm, login…)
 *           → cohesion rất tốt.
 *         - Dù component dài, nhưng không tách rời nhiệm vụ → vẫn giữ functional cohesion.
 *
 * ---------------------------------------------------------
 */
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { ICartItem } from "../types/checkout.types";

interface CartPageProps {
  cartItems: ICartItem[];
  onUpdateQuantity: (
    product_id: string,
    quantity: number,
  ) => void;
  onRemoveItem: (product_id: string) => void;
  onProceedToCheckout: () => void;
  hasStockIssues: boolean;
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  onSelectAll: (selected: boolean) => void;
  notify: (
    type: "success" | "error" | "warning" | "info",
    message: string,
  ) => void;
}

export function CartPage({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  hasStockIssues,
  selectedItemIds,
  onToggleItem,
  onSelectAll,
  notify,
}: CartPageProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const calculateCartTotal = () => {
    const selectedItems = cartItems.filter((item) =>
      selectedItemIds.includes(item.id),
    );
    return selectedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );
  };

  const allSelected =
    cartItems.length > 0 &&
    cartItems.every((item) =>
      selectedItemIds.includes(item.id),
    );
  const selectedCount = selectedItemIds.length;
  const hasNoSelection = selectedItemIds.length === 0;

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <ShoppingBag className="w-24 h-24 text-gray-300" />
        <h2 className="text-gray-400">Your cart is empty</h2>
        <p className="text-gray-500 text-sm">
          Add some items to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Shopping Cart</h1>
        <p className="text-gray-600 mt-2">
          Review your items and proceed to checkout
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Select All Header */}
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={(checked: boolean) =>
                  onSelectAll(checked === true)
                }
              />
              <label
                htmlFor="select-all"
                className="text-sm cursor-pointer"
              >
                Select All ({selectedCount} of{" "}
                {cartItems.length} selected)
              </label>
            </div>
          </Card>

          {cartItems.map((item) => {
            const isSelected = selectedItemIds.includes(
              item.id,
            );
            const hasIssue =
              isSelected &&
              item.addedQuantity > item.product.stock;
            const isDeactivated =
              item.product.status === "DEACTIVATED";

            return (
              <Card
                key={item.id}
                className={`p-6 ${hasIssue ? "border-red-300 bg-red-50" : ""} ${
                  !isSelected ? "opacity-60" : ""
                } ${isDeactivated ? "border-gray-300" : ""}`}
              >
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox
                      id={`select-${item.id}`}
                      checked={isSelected}
                      onCheckedChange={() =>
                        onToggleItem(item.id)
                      }
                    />
                  </div>

                  {/* Product Image */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={item.product.image || ""}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate">
                      {item.product.title}
                    </h3>
                    <p className="text-teal-600 mt-2">
                      {formatPrice(item.product.current_price)}{" "}
                      × {item.addedQuantity}
                    </p>
                    <p className="text-gray-900 mt-1">
                      Total: {formatPrice(item.totalPrice)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        Stock Available:
                      </span>
                      <span
                        className={`text-sm ${item.product.stock > 5 ? "text-green-600" : "text-orange-600"}`}
                      >
                        {item.product.stock} units
                      </span>
                      <span className="text-xs text-gray-400">
                        ({item.product.weight} kg each)
                      </span>
                    </div>

                    {isDeactivated && (
                      <div className="mt-2">
                        <span className="text-sm text-red-600">
                          ⚠️ Product Deactivated
                        </span>
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUpdateQuantity(
                              item.product.product_id,
                              Math.max(
                                1,
                                item.addedQuantity - 1,
                              ),
                            )
                          }
                          disabled={
                            item.addedQuantity <= 1 ||
                            isDeactivated
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center">
                          {item.addedQuantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUpdateQuantity(
                              item.product.product_id,
                              item.addedQuantity + 1,
                            )
                          }
                          disabled={
                            item.addedQuantity >=
                              item.product.stock ||
                            isDeactivated
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onRemoveItem(item.product.product_id)
                        }
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>

                    {/* Stock Warning */}
                    {hasIssue && (
                      <div className="mt-3 bg-white rounded-md p-2 border border-red-300">
                        <p className="text-sm text-red-700">
                          ⚠️ Insufficient stock! Only{" "}
                          {item.product.stock} available (you
                          want {item.addedQuantity})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Cart Summary - Right Column */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-8">
            <h3 className="mb-6">Cart Summary</h3>

            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Items in Cart</span>
                <span>{cartItems.length}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Selected Items</span>
                <span>{selectedCount}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Selected Quantity</span>
                <span>
                  {cartItems
                    .filter((item) =>
                      selectedItemIds.includes(item.id),
                    )
                    .reduce(
                      (sum, item) => sum + item.addedQuantity,
                      0,
                    )}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span>Selected Total</span>
                <span className="text-teal-600">
                  {formatPrice(calculateCartTotal())}
                </span>
              </div>

              <p className="text-sm text-gray-500">
                VAT and shipping will be calculated at checkout
              </p>

              <Separator className="my-4" />

              {/* Error Message for Stock Issues */}
              {hasStockIssues && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-900 text-sm">
                        <strong>Unable to Proceed:</strong>{" "}
                        Please update your cart quantities to
                        match available stock before proceeding
                        to checkout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message for No Selection */}
              {!hasStockIssues && hasNoSelection && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-900 text-sm">
                        <strong>No Items Selected:</strong>{" "}
                        Please select at least one item to
                        proceed to checkout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={onProceedToCheckout}
                disabled={hasStockIssues || hasNoSelection}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Proceed to Checkout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}