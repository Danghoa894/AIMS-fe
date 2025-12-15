# API Endpoints Documentation

## 📡 Backend Integration Guide

This file documents the API endpoints that need to be implemented in the backend. Currently, all services use mock data and simulated API calls.

---

## 🛒 Cart API (`/services/cartApi.ts`)

### Check Product Availability
```typescript
// Current: Local check
handleCheckAvailability(cartItems, product_id, requestQuantity): boolean

// Backend Implementation:
GET /api/products/{product_id}/availability?quantity={requestQuantity}
Response: { available: boolean, currentStock: number }
```

---

## 🚚 Delivery API (`/services/deliveryApi.ts`)

### Calculate Shipping Fee
```typescript
// Current: Local calculation
handleCalculateFee(weight, province, orderValue): number

// Backend Implementation:
POST /api/delivery/calculate-fee
Body: { weight: number, province: string, orderValue: number }
Response: { deliveryFee: number, freeShippingApplied: boolean }
```

### Submit Delivery Information
```typescript
// Current: Simulated with setTimeout
handleSubmitDeliveryInfo(deliveryInfo, weight, orderValue): Promise<IDeliveryInfo>

// Backend Implementation:
POST /api/orders/delivery
Body: { 
  fullName: string,
  Email: string,
  phoneNumber: string,
  address: string,
  province: string,
  deliveryMethod: string,
  note: string,
  weight: number,
  orderValue: number
}
Response: { 
  deliveryId: string,
  deliveryFee: number,
  estimatedDeliveryDate: string
}
```

---

## 💳 Payment API (`/services/paymentApi.ts`)

### Initialize Payment
```typescript
// Current: Local transaction creation
handlePayOrder(orderId): ITransactionInfo

// Backend Implementation:
POST /api/payment/initialize
Body: { orderId: string, paymentMethod: string }
Response: { 
  transactionID: string,
  content: string,
  dateTime: Date,
  paymentStatus: PaymentStatus,
  qrCodeString: string
}
```

### Verify Payment Status
```typescript
// Current: Returns 'SUCCESS' immediately
handleVerifyPayment(transactionID): Promise<PaymentStatus>

// Backend Implementation:
GET /api/payment/verify/{transactionID}
Response: { 
  paymentStatus: PaymentStatus,
  invoiceStatus: boolean,
  errorMessage?: string
}
```

### Process Credit Card Payment
```typescript
// Current: Simulated with setTimeout
handleProcessCreditCardPayment(orderID, cardInfo, currentTransaction): Promise<ITransactionInfo>

// Backend Implementation:
POST /api/payment/process-card
Body: { 
  orderId: string,
  cardInfo: {
    cardNumber: string,
    expiry: string,
    cvv: string,
    cardholderName: string
  }
}
Response: { 
  transactionID: string,
  paymentStatus: PaymentStatus,
  invoiceStatus: boolean,
  errorMessage?: string
}
```

---

## 🔄 Migration Steps

### Step 1: Replace Mock Data
In `/services/cartApi.ts`, replace `MOCK_CART_ITEMS` with actual API call:
```typescript
export const fetchCartItems = async (): Promise<ICartItem[]> => {
  const response = await fetch('/api/cart');
  return response.json();
};
```

### Step 2: Update Service Functions
Replace simulated delays and mock responses with real API calls:
```typescript
// Before
await new Promise(resolve => setTimeout(resolve, 1000));

// After
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Step 3: Add Error Handling
```typescript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error('API Error');
  return response.json();
} catch (error) {
  console.error('API call failed:', error);
  // Show error to user
}
```

### Step 4: Environment Variables
Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_PAYMENT_GATEWAY_URL=https://sandbox.paypal.com
```

---

## 📝 TypeScript Interfaces

All interfaces are defined in `/types/checkout.types.ts` and must be synced with Backend models:

- `IProduct` - Product information
- `ICartItem` - Cart item with quantity
- `IDeliveryInfo` - Delivery/shipping information
- `ITransactionInfo` - Payment transaction details
- `IOrder` - Complete order information
- `PaymentStatus` - Payment status enum

---

## 🔒 Authentication

When implementing authentication:
```typescript
// Add to service functions
const token = localStorage.getItem('authToken');
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🧪 Testing

Use these endpoints for testing:
- **Local Development**: `http://localhost:8080/api`
- **Staging**: `https://staging-api.aims.com/api`
- **Production**: `https://api.aims.com/api`
