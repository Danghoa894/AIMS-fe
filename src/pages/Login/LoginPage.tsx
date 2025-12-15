import { ShoppingBag } from 'lucide-react';
import { LoginContainer } from './LoginContainer';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4">
            <ShoppingBag className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-teal-600 mb-2">AIMS</h1>
          <p className="text-gray-600">An Internet Media Store</p>
        </div>


        {/* Login use-case */}
        <Card className="p-8 shadow-lg border-0">
          <div className="mb-6">
            <h2 className="text-teal-700 mb-1">Administrator Login</h2>
            <p className="text-sm text-gray-500">
              Sign in to access the admin dashboard
            </p>
          </div>
        </Card>
        <LoginContainer/>

        {/* Footer Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 bg-blue-50 rounded-lg py-3 px-4 border border-blue-100">
            Only Admins and Product Managers can log in.
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-teal-600 hover:underline"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}