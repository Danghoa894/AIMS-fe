import { Outlet, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Home, ShoppingCart } from 'lucide-react';

/**
 * HeaderOnly: Minimal layout with only header
 * Used for: Checkout flow, Payment pages, Order Success
 * No footer to keep focus on checkout process
 */
export function HeaderOnly() {
  const navigate = useNavigate();

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
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/cart')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - No Footer for cleaner checkout experience */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
