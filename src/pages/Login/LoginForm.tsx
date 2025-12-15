import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '../../components/ui/checkbox';

//**
// LoginForm.tsx -- UI only
// Render form
// Local state: input, showPassword, touched
// Validate FE
// Gọi onSubmit(formData)*/
interface LoginFormProps {
  loading: boolean;
  onSubmit: (data: LoginFormData) => void;
}

export interface LoginFormData {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm({ loading, onSubmit }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    emailOrUsername: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    emailOrUsername: false,
    password: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ emailOrUsername: true, password: true });

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email / Username */}
      <div className="space-y-2">
            <Label htmlFor="emailOrUsername">Email / Username</Label>
            <div className="relative">
                <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="Enter your email or username"
                    value={formData.emailOrUsername}
                    onChange={(e) =>
                    setFormData({ ...formData, emailOrUsername: e.target.value })
                    }
                    onBlur={() => setTouched({ ...touched, emailOrUsername: true })}
                //   className={`h-11 ${showEmailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  disabled={loading}
                />
            </div>
      </div>


      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
            <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, password: true })}
                // className={`h-11 pr-10 ${showPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                // disabled={isLoading}
            />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
        </div>
      </div>
        {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
                disabled={loading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer"
              >
                Remember Me
              </Label>
            </div>

    {/* Submit Button */}
      <Button type="submit" 
      className="w-full h-11 bg-teal-600 hover:bg-teal-700"
      disabled={loading}>
        {loading ? 'Signing in...' : 'Login'}
      </Button>

      
    </form>
  );
}
