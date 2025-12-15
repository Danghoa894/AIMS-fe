# 🛒 AIMS Checkout System - Frontend

> **An Internet Media Store (AIMS)** - Professional E-commerce Checkout System

Modern, responsive checkout system built with React, TypeScript, and Tailwind CSS, following clean architecture principles with clear separation between UI and business logic.

---

## ✨ Features

### 🎨 User Interface
- ✅ **Modern Design** - Teal (#0d9488) color scheme, minimalist UI
- ✅ **Responsive Layout** - Optimized for desktop/web experience
- ✅ **Real-time Validation** - Form validation with instant feedback
- ✅ **Loading States** - Professional loading indicators and disabled states
- ✅ **Error Handling** - Clear error messages and recovery flows

### 🛍️ Shopping Cart
- ✅ Stock validation before checkout
- ✅ Item selection with "Select All" functionality
- ✅ Quantity adjustment with stock checks
- ✅ Remove items from cart
- ✅ Real-time price calculation display

### 📦 Multi-Step Checkout Flow
1. **Shopping Cart Page** - Review items, check stock availability
2. **Shipping Information** - Enter delivery details, province selection
3. **Payment Method** - VietQR & PayPal Sandbox support
4. **Order Success** - Complete order confirmation with details

### 💰 Pricing Features
- ✅ Product cost summary
- ✅ VAT calculation (10%) - *calculated by Backend*
- ✅ Automatic shipping fee calculation - *calculated by Backend*
- ✅ Free shipping discount (orders > 100,000 VND)
- ✅ Total weight calculation - *calculated by Backend*

### 💳 Payment Methods
- **VietQR** - Vietnam QR code payment with auto-verification (mock)
- **Credit Card** - PayPal Sandbox integration (mock)
- **Transaction Tracking** - Real-time payment status updates

---

## 🏗️ Architecture

### Frontend Responsibilities (UI Only)
```
Frontend (This Project)
├── Display UI components
├── Form validation (format, required fields)
├── Call Backend APIs
├── Display data from Backend
├── Handle navigation & routing
└── Show loading/error states
```

### Backend Responsibilities (Business Logic)
```
Backend (Spring Boot - Separate Project)
├── Calculate shipping fees (location-based)
├── Calculate VAT (10%)
├── Calculate total weight (from products)
├── Validate stock availability
├── Process payments
├── Generate order IDs
└── Manage database operations
```

> **See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation**

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd aims-checkout-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The application will open at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
/src
├── /pages/                    # Page-level components
│   ├── /Home/                 # Landing page
│   ├── /Cart/                 # Shopping cart
│   ├── /Checkout/             # Checkout flow (Shipping, Payment)
│   └── /OrderSuccess/         # Order confirmation
│
├── /components/               # Reusable UI components
│   ├── /ui/                   # ShadCN UI library components
│   ├── CartItem.tsx           # Cart item display
│   ├── OrderSummary.tsx       # Order summary sidebar
│   └── StepIndicator.tsx      # Checkout progress bar
│
├── /context/                  # React Context (State Management)
│   └── CheckoutContext.tsx    # Checkout state & API calls
│
├── /services/                 # API Service Layer
│   ├── cartApi.ts             # Cart-related API calls
│   ├── deliveryApi.ts         # Delivery & shipping API calls
│   └── paymentApi.ts          # Payment processing API calls
│
├── /types/                    # TypeScript Type Definitions
│   └── checkout.types.ts      # IOrder, ICartItem, IDeliveryInfo, etc.
│
├── /constants/                # Application Constants
│   ├── provinces.ts           # Vietnam provinces list
│   └── shipping.ts            # Delivery methods
│
├── /layouts/                  # Layout Templates
│   ├── DefaultLayout.tsx      # Header + Footer layout
│   └── HeaderOnly.tsx         # Header-only layout (checkout)
│
├── /config/                   # Configuration
│   └── routes.ts              # React Router configuration
│
└── /styles/                   # Global Styles
    └── globals.css            # Tailwind CSS + custom styles
```

---

## 🔌 API Integration

### Current Status: **Mock Mode** 🎭
The application currently uses **mock API responses** for development. All API calls are simulated with realistic delays and data.

### Required Backend Endpoints

When integrating with real Backend, implement these endpoints:

#### 🛒 Cart APIs
```typescript
GET    /api/cart/items                    // Get user's cart items
PUT    /api/cart/update-quantity          // Update item quantity
DELETE /api/cart/remove/:productId        // Remove item from cart
POST   /api/cart/check-availability       // Check stock availability
```

#### 📦 Delivery APIs
```typescript
POST   /api/delivery/calculate-fee        // Calculate shipping fee
POST   /api/delivery/submit               // Submit delivery information
```

#### 💳 Payment APIs
```typescript
POST   /api/payment/create-transaction    // Create payment transaction
POST   /api/payment/verify                // Verify payment status
POST   /api/payment/process-card          // Process credit card payment
```

#### 📋 Order APIs
```typescript
POST   /api/orders/create                 // Create order from cart
GET    /api/orders/:orderId               // Get order details
```

### Example: Replace Mock with Real API

**Before (Mock):**
```typescript
// services/deliveryApi.ts
export const handleCalculateFee = async (...) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockFee), 500);
  });
};
```

**After (Real API):**
```typescript
// services/deliveryApi.ts
export const handleCalculateFee = async (
  weight: number,
  province: string,
  orderValue: number
): Promise<number> => {
  const response = await fetch('http://backend-url/api/delivery/calculate-fee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weight, province, orderValue }),
  });
  const data = await response.json();
  return data.deliveryFee;
};
```

---

## 🧪 Testing the Application

### Test Flow: Complete Checkout

1. **Start Application**: `npm run dev`
2. **View Cart**: Click "View Cart" or navigate to `/cart`
3. **Select Items**: Check items you want to purchase
4. **Proceed to Checkout**: Click "Proceed to Checkout" (only enabled if no stock issues)
5. **Fill Shipping Form**:
   - Full Name: `Nguyen Van A`
   - Phone: `0901234567`
   - Email: `test@example.com`
   - Province: Select `Hà Nội` or `TP. Hồ Chí Minh`
   - Address: `123 Test Street, Ward 1, District 1`
6. **Continue to Payment**: Click "Continue to Payment"
7. **Select Payment Method**:
   - **VietQR**: Click "Confirm Payment" → Mock payment success in 1 second
   - **Credit Card**: Fill card details → Click "Confirm Payment" → Success
8. **View Order Success**: Automatic redirect to order confirmation page

### Test Scenarios

#### ✅ Valid Stock Scenario
- Cart items: 2 items with sufficient stock
- Expected: Checkout proceeds successfully

#### ❌ Insufficient Stock Scenario
- Cart items: 1 item with quantity > stock
- Expected: "Proceed to Checkout" button disabled
- Message: "Some items exceed available stock"

#### ✅ Shipping Fee Calculation
- **Hanoi/HCM**: Base 22,000 VND for first 3kg
- **Other Provinces**: Base 30,000 VND for first 0.5kg
- **Free Shipping**: Orders > 100,000 VND get up to 25,000 VND discount

---

## 🎨 Technology Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing

### UI/Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **ShadCN UI** - Accessible component library
- **Lucide React** - Icon library

### State Management
- **React Context API** - Global state management
- **React Hooks** - useState, useEffect, useContext

---

## 📋 TypeScript Interfaces

All interfaces match Backend specifications:

```typescript
// IProduct
interface IProduct {
  product_id: string;
  title: string;
  imageUrl?: string;
  current_price: number;
  stock: number;
  weight: number;
  category?: string;
  status?: string;
}

// ICartItem
interface ICartItem {
  id: string;
  product: IProduct;
  addedQuantity: number;
  totalPrice: number; // Backend calculates
}

// IDeliveryInfo
interface IDeliveryInfo {
  deliveryId: string;
  fullName: string;
  phoneNumber: string;
  Email: string;
  address: string;
  province: string; // Key for shipping fee calculation
  deliveryMethod: string;
  deliveryFee: number; // Backend calculates
  note?: string;
}

// IOrder
interface IOrder {
  products: ICartItem[];
  orderId: string;
  orderStatus: string;
  deliveryInfo: IDeliveryInfo | null;
  transactionInfo: ITransactionInfo | null;
  productCost: number; // Backend calculates
  totalWeight: number; // Backend calculates
  totalAmount: number; // Backend calculates (includes VAT + shipping)
}

// ITransactionInfo
interface ITransactionInfo {
  transactionID: string;
  paymentStatus: PaymentStatus;
  dateTime: Date;
  content: string;
  qrCodeString: string;
  invoiceStatus: boolean;
  errorMessage?: string;
}

// PaymentStatus
type PaymentStatus = 
  | 'CREATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'ERROR';
```

---

## 🎯 Key Features Implementation

### 1. Stock Validation
```typescript
// Prevents checkout if any item quantity exceeds stock
const hasStockIssues = (): boolean => {
  return selectedItems.some(item => 
    item.addedQuantity > item.product.stock
  );
};
```

### 2. Form Validation
```typescript
// Real-time validation with error messages
const validateField = (name: string, value: string) => {
  switch (name) {
    case 'phoneNumber':
      if (!/^[0-9]{10,11}$/.test(value))
        return 'Invalid phone number';
      break;
    case 'Email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return 'Invalid email';
      break;
    // ... more validations
  }
};
```

### 3. Shipping Fee Display
```typescript
// Display shipping rules to users
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h4>📦 Shipping Fee Information</h4>
  <p><strong>Hanoi & Ho Chi Minh City:</strong></p>
  <p>• 22,000 VND for first 3kg</p>
  <p>• 2,500 VND per additional 0.5kg</p>
  
  <p><strong>Other Provinces:</strong></p>
  <p>• 30,000 VND for first 0.5kg</p>
  <p>• 2,500 VND per additional 0.5kg</p>
  
  <p>🎁 Orders over 100,000 VND: Up to 25,000 VND discount!</p>
</div>
```

---

## 🐛 Troubleshooting

### Issue: "Proceed to Checkout" button is disabled
**Solution**: Check if any cart items have quantity > stock. Remove or reduce quantity.

### Issue: Shipping fee shows 0 VND
**Solution**: This is expected for orders > 100,000 VND with small shipping fees (free shipping applied).

### Issue: Payment always succeeds
**Solution**: Mock mode is enabled. Real Backend will handle actual payment processing.

---

## 👥 Contributing

### Code Style
- Use TypeScript strict mode
- Follow React best practices
- Component names: PascalCase
- File names: PascalCase for components, camelCase for utilities
- CSS: Tailwind utility classes only

### Commit Convention
```
feat: Add payment method selection
fix: Resolve stock validation issue
docs: Update API documentation
style: Format checkout form
refactor: Simplify cart context logic
```

---

## 📄 License

This project is part of the AIMS (An Internet Media Store) system.

---

## 📞 Support

For issues or questions:
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Review TypeScript types in `/src/types/`
- Ensure Backend endpoints match API contracts

---

**Built with ❤️ for AIMS E-commerce Platform**
