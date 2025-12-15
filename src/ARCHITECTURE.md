# AIMS Checkout System - Frontend Architecture

## 🎯 Overview

Frontend chỉ chịu trách nhiệm về **UI/UX** và **gọi API**. Tất cả business logic (tính toán phí ship, VAT, trọng lượng) được xử lý bởi Backend.

---

## 📋 Phân Chia Trách Nhiệm: Frontend vs Backend

### ✅ Frontend Responsibilities (UI Layer)

| Responsibility | Description | Example |
|---------------|-------------|---------|
| **Form Validation** | Validate user input (format, required fields) | Email format, phone number length |
| **API Calls** | Send data to Backend, receive responses | `POST /api/delivery/calculate-fee` |
| **Display Data** | Show data returned from Backend | Display calculated `deliveryFee`, `totalAmount` |
| **Navigation** | Handle routing between pages | Cart → Checkout → Payment → Success |
| **Loading States** | Show loading indicators during API calls | Spinners, disabled buttons |
| **Error Handling** | Display error messages from Backend | "Payment failed", "Stock unavailable" |

### ❌ Frontend Does NOT Handle

- ❌ Calculate VAT (10%)
- ❌ Calculate shipping fee based on weight/location
- ❌ Calculate total order weight
- ❌ Calculate total order amount
- ❌ Validate stock availability (only UI check)
- ❌ Payment processing logic

### ✅ Backend Responsibilities (Business Logic)

| Responsibility | Backend Endpoint | Returns |
|---------------|------------------|---------|
| **Calculate Shipping Fee** | `POST /api/delivery/calculate-fee` | `{ deliveryFee: number }` |
| **Calculate VAT** | Included in Order calculation | `Order.totalAmount` includes VAT |
| **Calculate Total Weight** | `GET /api/orders/:id` | `Order.totalWeight` |
| **Check Stock** | `POST /api/cart/check-availability` | `{ available: boolean, stock: number }` |
| **Process Payment** | `POST /api/payment/process` | `ITransactionInfo` |
| **Generate Order ID** | `POST /api/orders/create` | `{ orderId: string }` |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (UI)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Pages/     │   │  Components/ │   │   Context/   │    │
│  │   Cart       │◄──┤  CartItem    │◄──┤  Checkout    │    │
│  │   Checkout   │   │  OrderSummary│   │  Context     │    │
│  │   Success    │   └──────────────┘   └──────────────┘    │
│  └──────┬───────┘                              │            │
│         │                                      │            │
│         └────────────────┬─────────────────────┘            │
│                          │                                   │
│                  ┌───────▼────────┐                         │
│                  │   Services/    │                         │
│                  │   - cartApi    │                         │
│                  │   - deliveryApi│                         │
│                  │   - paymentApi │                         │
│                  └───────┬────────┘                         │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │ Controllers  │   │   Services   │   │ Repositories │    │
│  │ - CartCtrl   │──▶│ - CartSvc    │──▶│   - DB       │    │
│  │ - OrderCtrl  │   │ - OrderSvc   │   │              │    │
│  │ - PaymentCtrl│   │ - PaymentSvc │   │              │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│                                                               │
│  Business Logic:                                             │
│  - calculateShippingFee(weight, province, orderValue)       │
│  - calculateVAT(productCost)                                 │
│  - calculateTotalWeight(cartItems)                           │
│  - checkStockAvailability(productId, quantity)               │
│  - processPayment(paymentInfo)                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
/src
├── /pages/                    # Page Components (UI only)
│   ├── /Cart/
│   │   └── CartPage.tsx      # Display cart items, call API to update
│   ├── /Checkout/
│   │   ├── CheckoutFlow.tsx  # Manage checkout steps
│   │   ├── ShippingForm.tsx  # Form validation, send to Backend
│   │   └── PaymentMethod.tsx # Display payment options
│   └── /OrderSuccess/
│       └── OrderSuccess.tsx  # Display order confirmation
│
├── /components/               # Reusable UI Components
│   ├── /ui/                  # ShadCN UI components
│   ├── CartItem.tsx          # Display single cart item
│   ├── OrderSummary.tsx      # Display order totals (from Backend)
│   └── StepIndicator.tsx     # Checkout progress indicator
│
├── /context/                  # State Management
│   └── CheckoutContext.tsx   # Manage UI state, call APIs
│
├── /services/                 # API Layer (NO business logic)
│   ├── cartApi.ts            # Cart API calls
│   ├── deliveryApi.ts        # Delivery API calls
│   └── paymentApi.ts         # Payment API calls
│
├── /constants/                # Static data
│   ├── provinces.ts          # List of provinces
│   └── shipping.ts           # Delivery methods
│
├── /types/                    # TypeScript interfaces
│   └── checkout.types.ts     # IOrder, ICartItem, IDeliveryInfo, etc.
│
└── /config/
    └── routes.ts             # React Router configuration
```

---

## 🔄 Data Flow Example: Shipping Fee Calculation

### 1️⃣ User Fills Shipping Form

```tsx
// ShippingForm.tsx (UI)
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // UI validation only
  if (!formData.fullName || !formData.province) {
    setErrors({ ... });
    return;
  }
  
  // Send to Backend
  await onSubmit(formData);
};
```

### 2️⃣ Context Calls API Service

```tsx
// CheckoutContext.tsx
const handleSubmitDeliveryInfo = async (deliveryInfo: IDeliveryInfo) => {
  setIsLoading(true);
  
  // Get display values (temporary, for UI)
  const weight = calculateTotalWeight(); // Sum from cart items
  const productCost = calculateProductCost(); // Sum from cart items
  
  // CALL BACKEND to calculate shipping fee
  const fee = await handleCalculateFee(weight, deliveryInfo.province, productCost);
  
  // Backend returns calculated fee
  setShippingData({ ...deliveryInfo, deliveryFee: fee });
  
  // CALL BACKEND to create order with all calculations
  // Backend returns: Order with totalAmount, totalWeight, VAT included
  const order = await submitDeliveryInfoAPI(deliveryInfo);
  setCurrentOrder(order);
  
  setIsLoading(false);
};
```

### 3️⃣ API Service Makes HTTP Call

```tsx
// deliveryApi.ts
export const handleCalculateFee = async (
  weight: number,
  province: string,
  orderValue: number
): Promise<number> => {
  const response = await fetch('/api/delivery/calculate-fee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weight, province, orderValue }),
  });
  
  const data = await response.json();
  return data.deliveryFee; // Backend calculated this
};
```

### 4️⃣ Backend Processes Request

```java
// DeliveryController.java (Backend)
@PostMapping("/calculate-fee")
public ResponseEntity<FeeResponse> calculateFee(@RequestBody FeeRequest request) {
    // Business logic here
    double fee = deliveryService.calculateShippingFee(
        request.getWeight(),
        request.getProvince(),
        request.getOrderValue()
    );
    
    return ResponseEntity.ok(new FeeResponse(fee));
}
```

```java
// DeliveryService.java (Backend)
public double calculateShippingFee(double weight, String province, double orderValue) {
    boolean isHanoiOrHCM = province.equals("Hà Nội") || province.equals("TP. Hồ Chí Minh");
    
    double baseFee = isHanoiOrHCM ? 22000 : 30000;
    double baseWeight = isHanoiOrHCM ? 3.0 : 0.5;
    
    double fee = baseFee;
    if (weight > baseWeight) {
        double extraWeight = weight - baseWeight;
        fee += Math.ceil(extraWeight / 0.5) * 2500;
    }
    
    // Free shipping discount
    if (orderValue > 100000 && fee > 25000) {
        fee = Math.max(0, fee - 25000);
    } else if (orderValue > 100000) {
        fee = 0;
    }
    
    return fee;
}
```

### 5️⃣ UI Displays Result

```tsx
// OrderSummary.tsx
<div className="flex justify-between">
  <span>Delivery Fee</span>
  <span>
    {shippingData.deliveryFee === 0 ? (
      <Badge>FREE</Badge>
    ) : (
      formatPrice(shippingData.deliveryFee)
    )}
  </span>
</div>
```

---

## 🎨 UI Components - Display Only

### ❌ WRONG: Frontend calculates VAT

```tsx
// ❌ DON'T DO THIS
const calculateVAT = () => {
  return productCost * 0.1; // Business logic in Frontend
};
```

### ✅ CORRECT: Display VAT from Backend

```tsx
// ✅ DO THIS
const OrderSummary = ({ order }: { order: IOrder }) => {
  return (
    <div>
      <span>VAT (10%)</span>
      <span>{formatPrice(order.vat)}</span> {/* Backend calculated */}
    </div>
  );
};
```

---

## 🔐 Security Benefits

By keeping business logic in Backend:

1. **Data Integrity**: Users cannot manipulate calculations in browser
2. **Consistency**: All clients (web, mobile) get same results
3. **Centralized Logic**: Update rules in one place (Backend)
4. **Audit Trail**: Backend logs all calculations and transactions

---

## 📝 TODO: Replace Mock with Real API

Currently using **mock responses** for development. Replace with real Backend endpoints:

```tsx
// deliveryApi.ts - Current (Mock)
return new Promise((resolve) => {
  setTimeout(() => {
    resolve(mockCalculatedFee);
  }, 500);
});

// deliveryApi.ts - Future (Real API)
const response = await fetch('http://backend-url/api/delivery/calculate-fee', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ weight, province, orderValue }),
});
const data = await response.json();
return data.deliveryFee;
```

---

## 🚀 Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 📞 Integration with Backend

### Required Backend Endpoints

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/cart/items` | GET | - | `{ cartItems: ICartItem[] }` |
| `/api/cart/update-quantity` | PUT | `{ product_id, quantity }` | `{ cartItem: ICartItem }` |
| `/api/delivery/calculate-fee` | POST | `{ weight, province, orderValue }` | `{ deliveryFee: number }` |
| `/api/delivery/submit` | POST | `IDeliveryInfo` | `{ deliveryId, ...IDeliveryInfo }` |
| `/api/orders/create` | POST | `{ cartItems, deliveryInfo }` | `IOrder` (with calculated values) |
| `/api/payment/process` | POST | `{ orderId, paymentInfo }` | `ITransactionInfo` |

---

## 👥 Team Collaboration

- **Frontend Team**: Focus on UI/UX, form validation, API integration
- **Backend Team**: Implement business logic, calculations, payment processing
- **Contract**: Agree on API interfaces (TypeScript types match Java DTOs)

---

**Last Updated**: December 2024
