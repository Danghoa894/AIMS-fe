import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { accountApi } from '../services/account/accountApi';

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * PublicRoute
 * - Nếu CHƯA đăng nhập → cho vào page public (login)
 * - Nếu ĐÃ đăng nhập → redirect /admin
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
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
        // có token → hỏi BE
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to admin dashboard
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
