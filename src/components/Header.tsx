import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingCart, Search, User, Home, Package, Grid, LogIn, LogOut, Shield, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { LogoutModal } from './LogoutModal';
import { toast } from 'sonner';

interface HeaderProps {
  cartItemCount?: number;
  onSearch?: (query: string) => void;
}

/**
 * Header: Main navigation component
 * Features: Logo, Navigation menu, Search bar, Cart icon, User account
 */
export function Header({ cartItemCount = 0, onSearch }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check if user is logged in (check for auth token)
  const isLoggedIn = () => {
    return !!(
      localStorage.getItem('aims_admin_token') ||
      sessionStorage.getItem('aims_admin_token')
    );
  };

  // Get user info from localStorage
  const getUserInfo = () => {
    const userStr = localStorage.getItem('aims_admin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    // Clear auth tokens and user info
    localStorage.removeItem('aims_admin_token');
    sessionStorage.removeItem('aims_admin_token');
    localStorage.removeItem('aims_admin_user');
    
    toast.success('Logged out successfully');
    setShowLogoutModal(false);
    
    // Redirect to home
    navigate('/');
  };

  const userInfo = getUserInfo();
  const loggedIn = isLoggedIn();

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-teal-600 text-xl tracking-tight">AIMS</span>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors"
              >
                <Package className="w-4 h-4" />
                Products
              </Link>
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors"
              >
                <Grid className="w-4 h-4" />
                Categories
              </Link>
            </nav>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </form>

            {/* Cart & Account */}
            <div className="flex items-center gap-3">
              {/* Cart Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-teal-600 hover:bg-teal-600"
                  >
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </Badge>
                )}
              </Button>

              {/* User Account Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {loggedIn && userInfo && (
                    <>
                      <div className="px-2 py-2">
                        <p className="text-sm font-medium">{userInfo.name}</p>
                        <p className="text-xs text-gray-500">{userInfo.email}</p>
                        {userInfo.role && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {userInfo.role}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/cart')}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    My Cart
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  
                  {loggedIn && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {loggedIn ? (
                    <DropdownMenuItem
                      onClick={() => setShowLogoutModal(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate('/login')}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Admin Login
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mt-4 lg:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        onConfirmLogout={handleLogout}
      />
    </>
  );
}