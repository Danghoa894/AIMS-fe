# 🔌 API Integration Guide - AIMS Checkout Frontend

> Quick reference for connecting Frontend to Backend APIs

---

## 🎯 Overview

Frontend **ONLY** calls APIs and displays results. Backend handles **ALL** business logic.

```
┌─────────────┐  HTTP Request   ┌─────────────┐
│  Frontend   │  ============>  │   Backend   │
│  (UI Only)  │                 │  (Business  │
│             │  <============  │   Logic)    │
└─────────────┘  JSON Response  └─────────────┘
```

---

## 📋 Required Backend Endpoints

### 1. Cart Management APIs

#### GET `/api/cart/items`
**Purpose**: Fetch user's cart items with product details

**Request**: None (authenticated user)

**Response**:
```json
{
  "cartItems": [
    {
      "id": "cart-1",
      "product": {
        "product_id": "prod-123",
        "title": "Product Name",
        "imageUrl": "https://...",
        "current_price": 1500000,
        "stock": 10,
        "weight": 2.5,
        "category": "Electronics"
      },
      "addedQuantity": 2,
      "totalPrice": 3000000
    }
  ]
}
```

**Frontend Implementation**:
```typescript
// services/cartApi.ts
export const getCartItems = async (): Promise<ICartItem[]> => {
  const response = await fetch('/api/cart/items', {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
  });
  const data = await response.json();
  return data.cartItems;
};
```

---

#### POST `/api/cart/check-availability`
**Purpose**: Check if product quantity is available

**Request**:
```json
{
  "product_id": "prod-123",
  "requestQuantity": 5
}
```

**Response**:
```json
{
  "available": true,
  "stock": 10,
  "message": "Product is available"
}
```

**Frontend Implementation**:
```typescript
// services/cartApi.ts
export const handleCheckAvailability = async (
  product_id: string,
  requestQuantity: number
): Promise<boolean> => {
  const response = await fetch('/api/cart/check-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id, requestQuantity }),
  });
  const data = await response.json();
  return data.available;
};
```

---

#### PUT `/api/cart/update-quantity`
**Purpose**: Update item quantity in cart

**Request**:
```json
{
  "product_id": "prod-123",
  "quantity": 3
}
```

**Response**:
```json
{
  "cartItem": {
    "id": "cart-1",
    "product": { /* ... */ },
    "addedQuantity": 3,
    "totalPrice": 4500000
  }
}
```

**Backend Must**:
- ✅ Recalculate `totalPrice = product.current_price * quantity`
- ✅ Validate `quantity <= product.stock`
- ✅ Return updated cart item

---

#### DELETE `/api/cart/remove/:productId`
**Purpose**: Remove item from cart

**Request**: Path parameter `productId`

**Response**:
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### 2. Delivery & Shipping APIs

#### POST `/api/delivery/calculate-fee`
**Purpose**: Calculate shipping fee based on weight, province, order value

**Request**:
```json
{
  "weight": 5.5,
  "province": "Hà Nội",
  "orderValue": 4500000
}
```

**Response**:
```json
{
  "deliveryFee": 22000,
  "baseFee": 22000,
  "extraWeightFee": 0,
  "discount": 0,
  "isFreeShipping": false
}
```

**Backend Business Logic** (MUST implement):
```java
public double calculateShippingFee(double weight, String province, double orderValue) {
    boolean isHanoiOrHCM = province.equals("Hà Nội") || 
                           province.equals("TP. Hồ Chí Minh");
    
    // Base fee
    double baseFee = isHanoiOrHCM ? 22000 : 30000;
    double baseWeight = isHanoiOrHCM ? 3.0 : 0.5;
    
    // Calculate extra weight fee
    double fee = baseFee;
    if (weight > baseWeight) {
        double extraWeight = weight - baseWeight;
        int extraUnits = (int) Math.ceil(extraWeight / 0.5);
        fee += extraUnits * 2500;
    }
    
    // Free shipping discount (max 25,000 VND)
    if (orderValue > 100000) {
        double discount = Math.min(fee, 25000);
        fee = Math.max(0, fee - discount);
    }
    
    return fee;
}
```

**Frontend Implementation**:
```typescript
// services/deliveryApi.ts
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
  return data.deliveryFee;
};
```

---

#### POST `/api/delivery/submit`
**Purpose**: Submit delivery information and create delivery record

**Request**:
```json
{
  "fullName": "Nguyen Van A",
  "phoneNumber": "0901234567",
  "Email": "user@example.com",
  "address": "123 Test Street, Ward 1",
  "province": "Hà Nội",
  "deliveryMethod": "Standard Delivery",
  "deliveryFee": 22000,
  "note": "Please call before delivery"
}
```

**Response**:
```json
{
  "deliveryId": "DEL-20241222-001",
  "fullName": "Nguyen Van A",
  "phoneNumber": "0901234567",
  "Email": "user@example.com",
  "address": "123 Test Street, Ward 1",
  "province": "Hà Nội",
  "deliveryMethod": "Standard Delivery",
  "deliveryFee": 22000,
  "note": "Please call before delivery"
}
```

**Backend Must**:
- ✅ Generate unique `deliveryId`
- ✅ Store delivery information in database
- ✅ Validate required fields
- ✅ Return delivery record with ID

---

### 3. Order Management APIs

#### POST `/api/orders/create`
**Purpose**: Create order from cart with delivery info

**Request**:
```json
{
  "cartItems": [
    {
      "product_id": "prod-123",
      "quantity": 2
    }
  ],
  "deliveryInfo": {
    "deliveryId": "DEL-20241222-001",
    "fullName": "Nguyen Van A",
    "phoneNumber": "0901234567",
    "Email": "user@example.com",
    "address": "123 Test Street",
    "province": "Hà Nội",
    "deliveryFee": 22000
  }
}
```

**Response**:
```json
{
  "orderId": "AIMS-20241222-001",
  "orderStatus": "Pending",
  "products": [
    {
      "id": "order-item-1",
      "product": { /* full product details */ },
      "addedQuantity": 2,
      "totalPrice": 3000000
    }
  ],
  "deliveryInfo": { /* full delivery info */ },
  "productCost": 4730000,
  "totalWeight": 5.5,
  "vat": 473000,
  "totalAmount": 5225000,
  "createdAt": "2024-12-22T10:30:00Z"
}
```

**Backend Business Logic** (MUST implement):
```java
public Order createOrder(CreateOrderRequest request) {
    // 1. Validate stock availability
    for (CartItem item : request.getCartItems()) {
        Product product = productRepo.findById(item.getProductId());
        if (item.getQuantity() > product.getStock()) {
            throw new InsufficientStockException();
        }
    }
    
    // 2. Calculate product cost (sum of all item prices)
    double productCost = request.getCartItems().stream()
        .mapToDouble(item -> {
            Product p = productRepo.findById(item.getProductId());
            return p.getCurrentPrice() * item.getQuantity();
        })
        .sum();
    
    // 3. Calculate total weight
    double totalWeight = request.getCartItems().stream()
        .mapToDouble(item -> {
            Product p = productRepo.findById(item.getProductId());
            return p.getWeight() * item.getQuantity();
        })
        .sum();
    
    // 4. Calculate VAT (10%)
    double vat = productCost * 0.1;
    
    // 5. Get delivery fee (already calculated)
    double deliveryFee = request.getDeliveryInfo().getDeliveryFee();
    
    // 6. Calculate total amount
    double totalAmount = productCost + vat + deliveryFee;
    
    // 7. Create order
    Order order = new Order();
    order.setOrderId(generateOrderId());
    order.setProductCost(productCost);
    order.setTotalWeight(totalWeight);
    order.setVat(vat);
    order.setTotalAmount(totalAmount);
    order.setOrderStatus("Pending");
    
    return orderRepo.save(order);
}
```

---

#### GET `/api/orders/:orderId`
**Purpose**: Get order details by ID

**Request**: Path parameter `orderId`

**Response**:
```json
{
  "orderId": "AIMS-20241222-001",
  "orderStatus": "Pending",
  "products": [ /* ... */ ],
  "deliveryInfo": { /* ... */ },
  "transactionInfo": { /* ... */ },
  "productCost": 4730000,
  "totalWeight": 5.5,
  "vat": 473000,
  "totalAmount": 5225000,
  "createdAt": "2024-12-22T10:30:00Z"
}
```

---

### 4. Payment APIs

#### POST `/api/payment/create-transaction`
**Purpose**: Create payment transaction for order

**Request**:
```json
{
  "orderId": "AIMS-20241222-001",
  "paymentMethod": "VietQR",
  "totalAmount": 5225000
}
```

**Response**:
```json
{
  "transactionID": "TXN-20241222-001",
  "paymentStatus": "CREATED",
  "dateTime": "2024-12-22T10:30:00Z",
  "content": "Payment for order AIMS-20241222-001",
  "qrCodeString": "00020101021238570010A000000727012700069704...",
  "invoiceStatus": false
}
```

**Backend Must**:
- ✅ Generate unique `transactionID`
- ✅ Create QR code string (for VietQR)
- ✅ Initialize payment status as `CREATED`
- ✅ Store transaction record

---

#### POST `/api/payment/verify`
**Purpose**: Verify payment status (polling)

**Request**:
```json
{
  "transactionID": "TXN-20241222-001"
}
```

**Response**:
```json
{
  "transactionID": "TXN-20241222-001",
  "paymentStatus": "SUCCESS",
  "invoiceStatus": true,
  "verifiedAt": "2024-12-22T10:35:00Z"
}
```

**Payment Status Values**:
- `CREATED` - Transaction created, waiting for payment
- `PENDING` - Payment initiated, verifying
- `SUCCESS` - Payment confirmed
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled by user
- `ERROR` - System error

---

#### POST `/api/payment/process-card`
**Purpose**: Process credit card payment via PayPal Sandbox

**Request**:
```json
{
  "orderId": "AIMS-20241222-001",
  "cardInfo": {
    "cardholderName": "Nguyen Van A",
    "cardNumber": "4111111111111111",
    "expiry": "12/25",
    "cvv": "123"
  }
}
```

**Response**:
```json
{
  "transactionID": "TXN-20241222-001",
  "paymentStatus": "SUCCESS",
  "paymentMethod": "CreditCard",
  "invoiceStatus": true,
  "completedAt": "2024-12-22T10:35:00Z"
}
```

**Backend Must**:
- ✅ Integrate with PayPal Sandbox API
- ✅ Validate card information
- ✅ Process payment securely
- ✅ Update transaction status
- ✅ Generate invoice

---

## 🔄 Complete Flow Example

### Scenario: User completes checkout with VietQR payment

```typescript
// 1. User fills shipping form → Frontend validates format
const handleSubmitShipping = async (deliveryInfo: IDeliveryInfo) => {
  setIsLoading(true);
  
  // 2. Calculate shipping fee (Backend calculates)
  const weight = calculateTotalWeight(); // Sum from cart
  const productCost = calculateProductCost(); // Sum from cart
  
  const fee = await fetch('/api/delivery/calculate-fee', {
    method: 'POST',
    body: JSON.stringify({ weight, deliveryInfo.province, productCost }),
  });
  
  // 3. Submit delivery info (Backend generates deliveryId)
  const delivery = await fetch('/api/delivery/submit', {
    method: 'POST',
    body: JSON.stringify({ ...deliveryInfo, deliveryFee: fee }),
  });
  
  // 4. Create order (Backend calculates all totals)
  const order = await fetch('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({
      cartItems: selectedItems,
      deliveryInfo: delivery,
    }),
  });
  
  // Order now has: orderId, productCost, totalWeight, vat, totalAmount
  
  setIsLoading(false);
  navigateToPayment();
};

// 5. User selects VietQR → Create transaction
const handlePayment = async () => {
  const txn = await fetch('/api/payment/create-transaction', {
    method: 'POST',
    body: JSON.stringify({
      orderId: order.orderId,
      paymentMethod: 'VietQR',
      totalAmount: order.totalAmount,
    }),
  });
  
  // Display QR code to user
  displayQRCode(txn.qrCodeString);
  
  // 6. Start polling to verify payment
  startVerificationPolling(txn.transactionID);
};

// 7. Poll verification every 2 seconds
const startVerificationPolling = (transactionID: string) => {
  const interval = setInterval(async () => {
    const status = await fetch('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionID }),
    });
    
    if (status.paymentStatus === 'SUCCESS') {
      clearInterval(interval);
      navigateToOrderSuccess();
    }
  }, 2000);
};
```

---

## ⚠️ Important Rules

### ✅ Frontend MUST:
1. Send raw data to Backend (province, weight, orderValue)
2. Display results returned from Backend
3. Handle API errors gracefully
4. Show loading states during API calls
5. Validate form inputs (format only, not business rules)

### ❌ Frontend MUST NOT:
1. Calculate shipping fees (Backend does this)
2. Calculate VAT (Backend does this)
3. Calculate total weight (Backend does this)
4. Validate stock beyond UI checks (Backend is source of truth)
5. Apply business rules (free shipping, discounts, etc.)

---

## 🧪 Testing API Integration

### Step 1: Mock → Real API Migration

Replace mock responses in `/services/` with real API calls:

**Mock (Current)**:
```typescript
export const getCartItems = async (): Promise<ICartItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_CART_ITEMS), 500);
  });
};
```

**Real API (Target)**:
```typescript
export const getCartItems = async (): Promise<ICartItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch cart items');
  }
  
  const data = await response.json();
  return data.cartItems;
};
```

### Step 2: Environment Variables

Create `.env` file:
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=30000
```

Use in code:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 📞 Error Handling

```typescript
export const handleCalculateFee = async (...): Promise<number> => {
  try {
    const response = await fetch('/api/delivery/calculate-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight, province, orderValue }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate fee');
    }
    
    const data = await response.json();
    return data.deliveryFee;
    
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly error message
    throw new Error('Unable to calculate shipping fee. Please try again.');
  }
};
```

---

## 📝 Checklist for Backend Team

### Cart APIs
- [ ] `GET /api/cart/items` - Return cart with product details
- [ ] `POST /api/cart/check-availability` - Validate stock
- [ ] `PUT /api/cart/update-quantity` - Recalculate totalPrice
- [ ] `DELETE /api/cart/remove/:productId` - Remove item

### Delivery APIs
- [ ] `POST /api/delivery/calculate-fee` - Implement shipping rules
- [ ] `POST /api/delivery/submit` - Generate deliveryId

### Order APIs
- [ ] `POST /api/orders/create` - Calculate all totals (productCost, VAT, weight, totalAmount)
- [ ] `GET /api/orders/:orderId` - Return complete order details

### Payment APIs
- [ ] `POST /api/payment/create-transaction` - Generate QR code
- [ ] `POST /api/payment/verify` - Check payment status
- [ ] `POST /api/payment/process-card` - PayPal integration

---

**Ready to integrate? Update `/services/` files with real API endpoints!** 🚀
