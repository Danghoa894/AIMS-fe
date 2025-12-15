# 🔐 Authentication Flow Documentation

## Overview
AIMS e-commerce system implements a complete authentication flow for admin and product manager access. This document explains the routing logic and authentication mechanisms.

## Components

### 1. **ProtectedRoute** (`/components/ProtectedRoute.tsx`)
Wrapper component for routes that require authentication.

**Behavior:**
- ✅ **If authenticated**: Allows access to protected page
- ❌ **If not authenticated**: Redirects to `/login` with returnUrl preserved

**Implementation:**
```tsx
// Usage in routes.ts
{
  path: '/admin',
  element: (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  ),
}
```

**Features:**
- Checks for `aims_admin_token` in localStorage or sessionStorage
- Shows loading spinner during auth check
- Preserves `location.pathname` as returnUrl in location.state
- Redirects to `/login` with state: `{ from: location.pathname }`

---

### 2. **PublicRoute** (`/components/PublicRoute.tsx`)
Wrapper component for public pages (like login) that should redirect if user is already authenticated.

**Behavior:**
- ✅ **If not authenticated**: Shows login page
- ❌ **If authenticated**: Redirects to `/admin`

**Implementation:**
```tsx
// Usage in routes.ts
{
  path: '/login',
  element: (
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  ),
}
```

**Features:**
- Prevents authenticated users from accessing login page
- Redirects to `/admin` dashboard if already logged in
- Shows loading spinner during auth check

---

### 3. **LoginPage** (`/pages/Login/LoginPage.tsx`)
Login form with comprehensive validation and security features.

**Features:**
- ✅ Email/Username input (flexible login)
- ✅ Password validation (8+ chars, uppercase, lowercase, number, special char)
- ✅ Real-time password strength indicator
- ✅ Remember Me checkbox (localStorage vs sessionStorage)
- ✅ Forgot password link
- ✅ Return URL handling for seamless redirect

**Authentication Logic:**
```tsx
// Get returnUrl from ProtectedRoute
const from = (location.state as { from?: string })?.from || '/admin';

// After successful login
if (formData.rememberMe) {
  localStorage.setItem('aims_admin_token', token);
} else {
  sessionStorage.setItem('aims_admin_token', token);
}

// Redirect to returnUrl or /admin
navigate(from);
```

---

## Authentication Flow Diagrams

### 🔄 **Flow 1: Unauthenticated User**

```
User → /admin
   ↓
ProtectedRoute checks auth → ❌ No token
   ↓
Navigate to /login (state: { from: '/admin' })
   ↓
PublicRoute checks auth → ✅ Not authenticated
   ↓
Show LoginPage
   ↓
User enters credentials → Submit
   ↓
✅ Login successful
   ↓
Store token (localStorage/sessionStorage)
   ↓
navigate(from) → /admin
   ↓
ProtectedRoute checks auth → ✅ Has token
   ↓
Show AdminDashboard
```

---

### 🔄 **Flow 2: Authenticated User**

```
User → /login
   ↓
PublicRoute checks auth → ✅ Has token
   ↓
Navigate to /admin (redirect)
   ↓
ProtectedRoute checks auth → ✅ Has token
   ↓
Show AdminDashboard
```

---

### 🔄 **Flow 3: Direct Access to Admin**

```
User → /admin
   ↓
ProtectedRoute checks auth
   ↓
Check localStorage/sessionStorage for token
   ↓
✅ Has token → Show AdminDashboard
❌ No token → Redirect to /login
```

---

### 🔄 **Flow 4: Logout**

```
User clicks Logout
   ↓
Remove token from storage
   ↓
localStorage.removeItem('aims_admin_token')
sessionStorage.removeItem('aims_admin_token')
   ↓
navigate('/login')
   ↓
PublicRoute checks auth → ✅ Not authenticated
   ↓
Show LoginPage
```

---

## Routes Configuration

### Current Routes (`/config/routes.ts`)

| Route | Layout | Protection | Description |
|-------|--------|-----------|-------------|
| `/` | DefaultLayout | Public | Homepage |
| `/cart` | DefaultLayout | Public | Shopping cart |
| `/products/:id` | DefaultLayout | Public | Product details |
| `/checkout` | HeaderOnly | Public | Checkout flow |
| `/order-success` | HeaderOnly | Public | Order confirmation |
| `/payment-failed` | HeaderOnly | Public | Payment failure |
| `/login` | Standalone | **PublicRoute** | Admin login (redirects if authenticated) |
| `/admin` | Standalone | **ProtectedRoute** | Admin dashboard (requires auth) |
| `/*` | DefaultLayout | Public | 404 Not Found |

---

## Storage Strategy

### Token Storage

**Remember Me = TRUE:**
```tsx
localStorage.setItem('aims_admin_token', token);
// Persists across browser sessions
```

**Remember Me = FALSE:**
```tsx
sessionStorage.setItem('aims_admin_token', token);
// Cleared when browser closes
```

### User Info Storage
```tsx
localStorage.setItem('aims_admin_user', JSON.stringify({
  id: '1',
  name: 'Admin User',
  email: 'admin@aims.com',
  role: 'Admin'
}));
```

---

## Security Features

### 1. **Password Validation**
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character

### 2. **Email Validation**
- ✅ Regex: `/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`

### 3. **Real-time Validation**
- ✅ Only shows errors after field is touched
- ✅ Password strength indicator (weak/medium/strong)
- ✅ Visual feedback with icons and colors

### 4. **Loading States**
- ✅ Disable form during submission
- ✅ Show "Signing in..." text
- ✅ Loading spinner in route guards

---

## Future Enhancements

### Planned Features:
1. **JWT Token Refresh**
   - Implement token expiration
   - Auto-refresh before expiration
   - Silent refresh in background

2. **Role-based Access Control (RBAC)**
   - Admin vs Product Manager permissions
   - Different dashboard views per role
   - Protected routes per permission level

3. **Two-Factor Authentication (2FA)**
   - Optional 2FA for enhanced security
   - QR code generation
   - TOTP verification

4. **Session Management**
   - Active sessions list
   - Remote logout capability
   - Session timeout warnings

5. **Password Recovery**
   - Email-based password reset
   - Secure token generation
   - Expiring reset links

---

## API Integration (Production)

### Login Endpoint
```tsx
// Replace mock login with real API call
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailOrUsername: formData.emailOrUsername,
    password: formData.password,
  }),
});

const data = await response.json();

if (data.success) {
  const token = data.token;
  const user = data.user;
  
  // Store token
  if (formData.rememberMe) {
    localStorage.setItem('aims_admin_token', token);
  } else {
    sessionStorage.setItem('aims_admin_token', token);
  }
  
  // Store user info
  localStorage.setItem('aims_admin_user', JSON.stringify(user));
  
  // Redirect
  navigate(from);
}
```

### Logout Endpoint
```tsx
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Clear local storage
localStorage.removeItem('aims_admin_token');
sessionStorage.removeItem('aims_admin_token');
localStorage.removeItem('aims_admin_user');

navigate('/login');
```

---

## Testing Checklist

### ✅ Authentication Flow Tests

- [ ] **Scenario 1:** Unauthenticated user accesses `/admin` → Redirects to `/login`
- [ ] **Scenario 2:** User logs in successfully → Redirects to `/admin`
- [ ] **Scenario 3:** User logs in with returnUrl → Redirects to original page
- [ ] **Scenario 4:** Authenticated user accesses `/login` → Redirects to `/admin`
- [ ] **Scenario 5:** User logs out → Token cleared, redirects to `/login`
- [ ] **Scenario 6:** User with "Remember Me" closes browser → Token persists
- [ ] **Scenario 7:** User without "Remember Me" closes browser → Token cleared
- [ ] **Scenario 8:** Invalid credentials → Shows error notification
- [ ] **Scenario 9:** Password doesn't meet requirements → Shows validation errors
- [ ] **Scenario 10:** Network error during login → Shows error notification

---

## Code Examples

### Checking Authentication Status
```tsx
const isAuthenticated = () => {
  const token = 
    localStorage.getItem('aims_admin_token') ||
    sessionStorage.getItem('aims_admin_token');
  return !!token;
};
```

### Getting Current User
```tsx
const getCurrentUser = () => {
  const userStr = localStorage.getItem('aims_admin_user');
  return userStr ? JSON.parse(userStr) : null;
};
```

### Logout Function
```tsx
const logout = () => {
  localStorage.removeItem('aims_admin_token');
  sessionStorage.removeItem('aims_admin_token');
  localStorage.removeItem('aims_admin_user');
  navigate('/login');
};
```

---

## Troubleshooting

### Issue: "Infinite redirect loop"
**Cause:** Both ProtectedRoute and PublicRoute redirect to each other  
**Solution:** Ensure token is properly cleared on logout

### Issue: "returnUrl not working"
**Cause:** Location state not preserved  
**Solution:** Use `navigate(path, { replace: true })` in route guards

### Issue: "User stays logged in after browser close"
**Cause:** Token stored in localStorage  
**Solution:** Only use localStorage when "Remember Me" is checked

---

## Summary

The AIMS authentication system provides a robust, secure, and user-friendly login flow with:
- ✅ Complete route protection
- ✅ Seamless redirect handling
- ✅ Flexible storage strategy
- ✅ Comprehensive validation
- ✅ Loading states and error handling
- ✅ Ready for production API integration

All components follow React best practices and TypeScript type safety standards.
