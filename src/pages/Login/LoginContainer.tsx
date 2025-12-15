//**
// LoginContainer.tsx -- Logic
// Gọi /auth/token
// Lưu token
// Gọi /account/myInfo
// Check role
// Toast
// Redirect*/
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useState } from 'react';
import { LoginForm, LoginFormData } from './LoginForm';
import { authApi } from '../../services/account/authApi';
import { accountApi } from '../../services/account/accountApi';

export function LoginContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from || '/admin';

  const [loading, setLoading] = useState(false);

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const res = await authApi.login({
        username: data.emailOrUsername,
        password: data.password,
      });

      const token = res.data?.result?.token;
      if (!token) throw new Error('No token');

      // Store token
      if (data.rememberMe) {
        localStorage.setItem('aims_admin_token', token);
      } else {
        sessionStorage.setItem('aims_admin_token', token);
      }

      // Fetch user info
      const userRes = await accountApi.getMyInfo();
      const user = userRes.data?.result;

      const hasAccess = user.roles?.some(
        (r) => r.name === 'ADMIN' || r.name === 'MANAGER'
      );

      if (!hasAccess) {
        throw new Error('NO_PERMISSION');
      }

      toast.success('Login successful');
      navigate(redirectTo, { replace: true });

    } catch (err: any) {
      localStorage.removeItem('aims_admin_token');
      sessionStorage.removeItem('aims_admin_token');

      if (err.message === 'NO_PERMISSION') {
        toast.error('Access denied');
      } else {
        toast.error('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return <LoginForm loading={loading} onSubmit={handleLogin} />;
}
