import { createBrowserRouter } from 'react-router';
import { DefaultLayout, HeaderOnly } from '../layouts';
import { Home } from '../pages/Home/Home';
import { CartPage } from '../pages/Cart/CartPage';
import { CheckoutFlow } from '../pages/Checkout/CheckoutFlow';
import { OrderSuccess } from '../pages/OrderSuccess/OrderSuccess';
import ProductDetails from '../pages/ProductDetails/ProductDetails';
import ProductManagerPage from '../pages/productManager/ProductManager/ProductManagerPage';
import { PaymentFailedPage } from '../pages/Checkout/PaymentFailedPage'
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicRoute } from '../components/PublicRoute';
import { LoginPage } from '../pages/Login/LoginPage';
import { AdminDashboard } from '../pages/Admin/AdminDashboard';
/**
 * Application Routes Configuration
 * 
 * Structure:
 * - / (DefaultLayout) - Home, Cart, Product Details
 * - /checkout (HeaderOnly) - Checkout flow
 * - /order-success (HeaderOnly) - Order confirmation
 * - /payment-failed (HeaderOnly) - Payment failure page
 * - /login (PublicRoute) - Admin & Product Manager login (redirects to /admin if authenticated)
 * - /admin (ProtectedRoute) - Admin dashboard (requires authentication, redirects to /login if not)
 * 
 * Authentication Flow:
 * 1. Unauthenticated user tries to access /admin → Redirected to /login (with returnUrl)
 * 2. After successful login → Redirected to returnUrl or /admin
 * 3. Authenticated user tries to access /login → Redirected to /admin
 * 4. Authenticated user accesses /admin → Access granted
 * 
 * Future routes to add:
 * - /admin/products - Product management
 * - /admin/orders - Order management
 * - /admin/users - User management
 * - /profile - User profile
 * - /orders - Order history
 */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: DefaultLayout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'cart',
        Component: CartPage,
      },
      {
        path: 'productManager/products',
        Component: ProductManagerPage,
      },
      {
        path: 'products/:id',
        Component: ProductDetails,
      },
    ],
  },
  {
    path: '/checkout',
    Component: HeaderOnly,
    children: [
      {
        index: true,
        Component: CheckoutFlow,
      },
    ],
  },
    {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/order-success',
    Component: HeaderOnly,
    children: [
      {
        index: true,
        Component: OrderSuccess,
      },
    ],
  },
  // ...existing code...
  {
    path: '*',
    Component: DefaultLayout,
    children: [
      {
        index: true,
        element: (
          <div className="text-center py-16">
            <h2 className="mb-4">404 - Page Not Found</h2>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        ),
      },
    ],
  },
  {
    path: '/payment-failed',
    Component: HeaderOnly,
    children: [
      {
        index: true,
        Component: PaymentFailedPage, // THÊM ROUTE NÀY
      },
    ],
  },
  // ...existing code...
]);
