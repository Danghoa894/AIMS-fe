import { Outlet, useNavigate, useLocation } from 'react-router';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Home, ShoppingCart } from 'lucide-react';
import { useCheckout } from '../../context/CheckoutContext';

/**
 * DefaultLayout: Main layout with header, footer, and navigation
 * Used for: Home page, Product pages, Cart page
 */
export function DefaultLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrder } = useCheckout();

  const isHomePage = location.pathname === '/';
  const isCartPage = location.pathname === '/cart';
  const cartItemCount = currentOrder.products.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <h1 className="text-teal-600">AIMS - An Internet Media Store</h1>
            </button>
            
            <div className="flex items-center gap-3">
              {!isHomePage && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              )}
              {!isCartPage && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/cart')}
                  className="text-gray-600 hover:text-gray-900 relative"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cartItemCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-teal-600 hover:bg-teal-600"
                    >
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; 2025 AIMS - An Internet Media Store. All rights reserved.</p>
            <p className="mt-2">Professional E-Commerce Checkout System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
