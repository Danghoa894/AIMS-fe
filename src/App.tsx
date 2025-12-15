import { RouterProvider } from "react-router";
import { CheckoutProvider } from "./context/CheckoutContext";
import { router } from "./config/routes";
import { NotificationProvider } from "./context/NotificationContext";


/**
 * App: Main application component
 *
 * Architecture:
 * - CheckoutProvider: Global state management for cart & checkout
 * - RouterProvider: React Router with configured routes
 *
 * 🏗️ Project Structure (Vite/React/TypeScript):
 *
 * /src
 * ├── assets/                 # Static assets (images, fonts, icons)
 * ├── components/             # Reusable UI components
 * │   ├── ui/                 # ShadCN UI components library
 * │   ├── CartPage.tsx
 * │   ├── OrderSummary.tsx
 * │   ├── OrderSuccess.tsx
 * │   └── StepIndicator.tsx
 * ├── config/                 # Application configuration
 * │   └── routes.ts           # Route definitions (✨ ALL ROUTES DEFINED HERE)
 * ├── constants/              # Constants and enums
 * │   ├── provinces.ts        # Vietnam provinces list
 * │   ├── shipping.ts         # Shipping fee constants (AIMS spec)
 * │   ├── payment.ts          # Payment methods & status
 * │   └── index.ts
 * ├── context/                # React Context providers
 * │   └── CheckoutContext.tsx # Global checkout state management
 * ├── hooks/                  # Custom React hooks
 * │   ├── useCart.ts          # Cart operations hook
 * │   └── index.ts
 * ├── layouts/                # Layout components
 * │   ├── DefaultLayout/      # Full layout (header + footer)
 * │   ├── HeaderOnly/         # Minimal layout (checkout/payment)
 * │   └── index.ts
 * ├── pages/                  # Page components (Route Components)
 * │   ├── Home/               # Homepage
 * │   │   ├── Home.tsx
 * │   │   └── index.ts
 * │   ├── Cart/               # Shopping cart page
 * │   │   ├── CartPage.tsx
 * │   │   └── index.ts
 * │   ├── Checkout/           # 🎯 CHECKOUT FLOW (Your work & teammates)
 * │   │   ├── CheckoutFlow.tsx    # Parent: Manages 2-step flow
 * │   │   ├── ShippingForm.tsx    # Step 2: Place Order (Teammate)
 * │   │   ├── PaymentMethod.tsx   # Step 3: Payment (Your work)
 * │   │   └── index.ts
 * │   └── OrderSuccess/       # Order confirmation page
 * │       ├── OrderSuccess.tsx
 * │       └── index.ts
 * ├── services/               # 🔌 API Services (Backend connection)
 * │   ├── cartApi.ts          # Cart API calls
 * │   ├── deliveryApi.ts      # Delivery/Shipping API calls
 * │   ├── paymentApi.ts       # Payment API calls
 * │   └── index.ts
 * ├── types/                  # TypeScript interfaces (Sync with BE)
 * │   └── checkout.types.ts   # IOrder, IDeliveryInfo, ITransactionInfo
 * ├── mock/
 * │   ├──deliveryApiMock.ts
 * │   └──paymentApiMock.ts
 * ├── App.tsx                 # Main app component
 * └── main.tsx                # Entry point
 *
 * 📋 Key Principles:
 * - Clean separation of concerns (Pages, Components, Services, Config)
 * - Type safety with TypeScript interfaces synced with Backend
 * - Centralized route configuration in /config/routes.ts
 * - API service layer in /services/ for easy Backend integration
 * - Reusable constants in /constants/ (provinces, shipping fees, VAT)
 *
 * 🚀 Ready for expansion:
 * - Add /pages/Product/ for product listing
 * - Add /pages/ProductDetails/ for product details
 * - Add authentication pages (Login, Register, Profile)
 * - Add /pages/Orders/ for order history
 */
export default function App() {
  return (
    <NotificationProvider>
    <CheckoutProvider>
      <RouterProvider router={router} />
    </CheckoutProvider>
    </NotificationProvider>
  );
}