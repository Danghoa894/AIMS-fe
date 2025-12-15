# 🏗️ AIMS Frontend Structure Guide

## 📖 Overview

This document provides a comprehensive guide to the AIMS e-commerce frontend structure, following Vite/React/TypeScript best practices with clear separation of concerns for FE-BE integration.

---

## 🎯 Core Principles

1. **Separation of Concerns**: Pages, Components, Services, and Config are clearly separated
2. **Type Safety**: All interfaces synchronized with Backend models
3. **Scalability**: Easy to add new pages and features
4. **Maintainability**: Clear folder structure with single responsibility
5. **Backend Ready**: Service layer prepared for API integration

---

## 📁 Directory Structure

```
/src
├── assets/                 # Static files (images, fonts, icons)
│   └── (images, SVGs, fonts)
│
├── components/             # Reusable UI Components
│   ├── ui/                 # ShadCN UI library components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── CartPage.tsx        # Cart display component
│   ├── OrderSummary.tsx    # Order summary sidebar
│   ├── OrderSuccess.tsx    # Success confirmation UI
│   └── StepIndicator.tsx   # Checkout step indicator
│
├── config/                 # Application Configuration
│   ├── routes.tsx           # ✨ Route definitions (ALL ROUTES)
│   └── STRUCTURE_GUIDE.md  # This file
│
├── constants/              # Application Constants
│   ├── provinces.ts        # Vietnam provinces list
│   ├── shipping.ts         # AIMS shipping fee rules
│   ├── payment.ts          # Payment methods & status
│   └── index.ts            # Barrel export
│
├── context/                # React Context (Global State)
│   └── CheckoutContext.tsx # Cart & checkout state management
│
├── hooks/                  # Custom React Hooks
│   ├── useCart.ts          # Cart operations logic
│   └── index.ts            # Barrel export
│
├── layouts/                # Layout Components
│   ├── DefaultLayout/      # Full layout (header + footer)
│   │   ├── DefaultLayout.tsx
│   │   └── (layout assets)
│   ├── HeaderOnly/         # Minimal layout (checkout/payment)
│   │   ├── HeaderOnly.tsx
│   │   └── (layout assets)
│   └── index.ts            # Barrel export
│
├── pages/                  # 📄 Page Components (Routes)
│   ├── Home/               # Homepage
│   │   ├── Home.tsx
│   │   └── index.ts
│   ├── Cart/               # Shopping Cart
│   │   ├── CartPage.tsx
│   │   └── index.ts
│   ├── Checkout/           # 🎯 Checkout Flow (Multi-step)
│   │   ├── CheckoutFlow.tsx    # Parent: Manages flow
│   │   ├── ShippingForm.tsx    # Step 2: Delivery info
│   │   ├── PaymentMethod.tsx   # Step 3: Payment
│   │   └── index.ts
│   ├── OrderSuccess/       # Order Confirmation
│   │   ├── OrderSuccess.tsx
│   │   └── index.ts
│   ├── Product/            # 🚧 Future: Product listing
│   │   └── Product.tsx.template
│   └── ProductDetails/     # 🚧 Future: Product details
│       └── ProductDetails.tsx.template
│
├── services/               # 🔌 API Service Layer
│   ├── cartApi.ts          # Cart-related API calls
│   ├── deliveryApi.ts      # Delivery/Shipping API calls
│   ├── paymentApi.ts       # Payment API calls
│   ├── index.ts            # Barrel export
│   └── API_ENDPOINTS.md    # Backend integration guide
│
├── types/                  # TypeScript Interfaces
│   └── checkout.types.ts   # Core interfaces (sync with BE)
│
├── App.tsx                 # Main App Component
└── main.tsx                # Vite Entry Point
```

---

## 🔄 Data Flow

```
User Action
    ↓
Page Component (/pages)
    ↓
Context/Hook (/context or /hooks)
    ↓
Service Layer (/services)
    ↓
Backend API
    ↓
Update State
    ↓
Re-render UI
```

---

## 📋 File Naming Conventions

### Pages (Route Components)
- **Pattern**: `PascalCase.tsx`
- **Example**: `Home.tsx`, `CartPage.tsx`, `CheckoutFlow.tsx`
- **Location**: `/pages/[FeatureName]/[ComponentName].tsx`

### Components (Reusable UI)
- **Pattern**: `PascalCase.tsx`
- **Example**: `OrderSummary.tsx`, `StepIndicator.tsx`
- **Location**: `/components/[ComponentName].tsx`

### Services (API Layer)
- **Pattern**: `camelCaseApi.ts`
- **Example**: `cartApi.ts`, `deliveryApi.ts`, `paymentApi.ts`
- **Location**: `/services/[featureName]Api.ts`

### Types (Interfaces)
- **Pattern**: `camelCase.types.ts`
- **Example**: `checkout.types.ts`, `product.types.ts`
- **Location**: `/types/[feature].types.ts`

### Constants
- **Pattern**: `camelCase.ts`
- **Example**: `provinces.ts`, `shipping.ts`
- **Location**: `/constants/[constantName].ts`

---

## 🎨 Component Organization

### When to create a new Page vs Component?

**Create a Page** (`/pages/`) when:
- It represents a distinct route/URL
- It's a top-level view in the application
- Example: `/cart`, `/checkout`, `/product/:id`

**Create a Component** (`/components/`) when:
- It's reusable across multiple pages
- It's a UI element without routing logic
- Example: Buttons, Cards, Forms, Modals

---

## 🚀 Adding New Features

### Adding a New Page

1. **Create page folder**:
   ```
   /pages/NewFeature/
   ├── NewFeature.tsx
   └── index.ts
   ```

2. **Add route** in `/config/routes.ts`:
   ```typescript
   {
     path: 'new-feature',
     Component: NewFeature,
   }
   ```

3. **Create service** (if needs API):
   ```
   /services/newFeatureApi.ts
   ```

4. **Add types** (if needed):
   ```typescript
   // In /types/checkout.types.ts or new file
   export interface INewFeature {
     // fields
   }
   ```

### Adding API Integration

1. **Define mock function** in `/services/`:
   ```typescript
   export const fetchData = async (): Promise<Data> => {
     // Mock implementation
   };
   ```

2. **Document endpoint** in `/services/API_ENDPOINTS.md`:
   ```markdown
   ### Fetch Data
   GET /api/feature/data
   Response: { data: Data }
   ```

3. **Replace with real API** when backend is ready

---

## 🔗 Backend Integration Checklist

### Phase 1: Mock Data (Current)
- ✅ All services use local mock data
- ✅ Simulated API delays with setTimeout
- ✅ TypeScript interfaces defined

### Phase 2: API Integration (Next)
- [ ] Replace mock functions with fetch/axios calls
- [ ] Add environment variables for API URLs
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add authentication headers

### Phase 3: Production Ready
- [ ] Add request/response interceptors
- [ ] Implement retry logic
- [ ] Add comprehensive error messages
- [ ] Add logging/monitoring
- [ ] Optimize with caching

---

## 📊 State Management Strategy

### Global State (Context)
- **Use for**: Cart, User, Theme
- **Location**: `/context/CheckoutContext.tsx`
- **Access via**: `useCheckout()` hook

### Local State (useState)
- **Use for**: Form inputs, UI toggles, modals
- **Location**: Within component

### Server State (Future)
- **Consider**: React Query or SWR
- **For**: API data fetching and caching

---

## 🧪 Testing Strategy (Future)

```
/src
├── __tests__/              # Unit tests
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── hooks/
├── e2e/                    # End-to-end tests
│   └── checkout.spec.ts
```

---

## 📝 Code Style

### Import Order
1. React/Third-party libraries
2. Components
3. Services/Hooks
4. Types
5. Constants
6. Styles

### Example:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { useCheckout } from '../../context/CheckoutContext';
import { handlePayOrder } from '../../services/paymentApi';
import type { IOrder } from '../../types/checkout.types';
import { PAYMENT_METHODS } from '../../constants/payment';
```

---

## 🤝 Team Collaboration

### Checkout Flow Division
- **Teammate A**: ShippingForm.tsx (Delivery information)
- **Teammate B**: PaymentMethod.tsx (Payment processing)
- **You**: CheckoutFlow.tsx (Flow orchestration)

### Shared Resources
- **Types**: `/types/checkout.types.ts` (synchronized)
- **Services**: `/services/` (shared API functions)
- **Context**: `/context/CheckoutContext.tsx` (shared state)

---

## 🎓 Learning Resources

- **React Router**: https://reactrouter.com
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev/guide
- **ShadCN UI**: https://ui.shadcn.com

---

## 📞 Questions?

If you have questions about the structure or need clarification:
1. Check this guide first
2. Review `/services/API_ENDPOINTS.md` for API integration
3. Look at existing implementations in `/pages/` for examples
4. Refer to comments in `/App.tsx` for overview

---

**Last Updated**: 2025
**Version**: 1.0.0
