import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';
import { accountApi } from '../services/account/accountApi';
interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute
 * - Chưa login → redirect /login
 * - Đã login → cho vào trang protected
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const token =
        localStorage.getItem('aims_admin_token') ||
        sessionStorage.getItem('aims_admin_token');

      // Không có token → chắc chắn chưa login
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // hỏi BE còn hợp lệ ko?
        await accountApi.getMyInfo();

        setIsAuthenticated(true);
      } catch(error) {
        localStorage.removeItem('aims_admin_token');
        sessionStorage.removeItem('aims_admin_token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save current location for returnUrl
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}