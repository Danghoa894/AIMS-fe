# Tài Liệu Mô Tả Chi Tiết Luồng Frontend - AIMS

## Mục Lục
1. [Use Case: Login/Logout](#1-use-case-loginlogout)
2. [Use Case: Search Products](#2-use-case-search-products)
3. [Use Case: Select Delivery Method](#3-use-case-select-delivery-method)
4. [Use Case: Place Order](#4-use-case-place-order)
5. [Use Case: Add To Cart](#5-use-case-add-to-cart)

---

## 1. Use Case: Login/Logout

### 1.1 Tổng Quan Luồng Login

```
User → LoginPage → LoginContainer → LoginForm → authApi → Backend
                                                    ↓
                                              JWT Token
                                                    ↓
                                    localStorage/sessionStorage
                                                    ↓
                                         Redirect theo Role
```

### 1.2 Chi Tiết Các File và Dòng Code

#### A. Entry Point - Route Configuration
**File:** `src/config/routes.tsx` (dòng 64-69)
```typescript
{
  path: '/login',
  element: (
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  ),
},
```
- **Chức năng:** Định nghĩa route `/login` được bọc bởi `PublicRoute`
- **PublicRoute:** Kiểm tra nếu đã đăng nhập → redirect về trang theo role

#### B. PublicRoute - Guard Component
**File:** `src/components/PublicRoute.tsx` (dòng 55-95)

```typescript
// Kiểm tra token từ storage
const token = localStorage.getItem('aims_admin_token') || 
              sessionStorage.getItem('aims_admin_token');

// Nếu có token → verify với backend
await accountApi.getMyInfo();

// Decode token lấy role → redirect
const decoded = jwtDecode<JWTPayload>(token);
const path = getRedirectPathByRole(decoded.scope);
```
- **Chức năng:** Nếu user đã login → redirect về trang phù hợp với role
- **Logic:** ADMIN → `/admin`, PRODUCT_MANAGER → `/productManager/products`, CUSTOMER → `/`

#### C. LoginPage - UI Layout
**File:** `src/pages/Login/LoginPage.tsx` (dòng 35-80)
```typescript
export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br...">
      {/* Logo và Title */}
      <Card className="p-8 shadow-lg border-0">
        <LoginContainer/>  {/* Component xử lý logic */}
      </Card>
      {/* Back to Store button */}
      <button onClick={() => navigate('/')}>← Back to Store</button>
    </div>
  );
}
```
- **Chức năng:** Render giao diện trang login với logo, form, footer

#### D. LoginContainer - Business Logic
**File:** `src/pages/Login/LoginContainer.tsx` (dòng 45-105)

```typescript
const handleLogin = async (data: LoginFormData) => {
  setLoading(true);
  try {
    // 1. Gọi API login
    const res = await authApi.login({
      username: data.emailOrUsername,
      password: data.password,
    });

    // 2. Lấy token từ response
    const token = res.data?.result?.token;

    // 3. Lưu token theo Remember Me option
    const tokenStorageService = data.rememberMe 
      ? defaultLocalStorageService 
      : defaultSessionStorageService;
    tokenStorageService.set(STORAGE_KEYS.AUTH_TOKEN, token);

    // 4. Decode JWT lấy role
    const decoded = jwtDecode<JWTPayload>(token);
    const role = decoded.scope;

    // 5. Lưu user info
    userStorageService.set(STORAGE_KEYS.USER_INFO, JSON.stringify({
      name: decoded.sub,
      role: role,
    }));

    // 6. Redirect theo role
    const redirectPath = returnUrl || getRedirectPathByRole(role);
    navigate(redirectPath, { replace: true });
  } catch (err) {
    // Xử lý lỗi theo status code
    if (err.response?.status === 401) {
      showNotification('error', LOGIN_MESSAGES.INVALID_CREDENTIALS);
    }
  }
};
```
- **Chức năng:** Xử lý toàn bộ logic đăng nhập
- **Flow:** Gọi API → Lưu token → Decode JWT → Redirect

#### E. LoginForm - UI Form
**File:** `src/pages/Login/LoginForm.tsx` (dòng 30-130)

```typescript
// State quản lý form
const [formData, setFormData] = useState<LoginFormData>({
  emailOrUsername: '',
  password: '',
  rememberMe: false,
});

// Submit form
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setTouched({ emailOrUsername: true, password: true });
  onSubmit(formData);  // Gọi callback từ LoginContainer
};
```
- **Chức năng:** Render form với input username, password, checkbox Remember Me
- **Validation:** Client-side validation trước khi submit

#### F. Auth API Service
**File:** `src/services/account/authApi.ts` (dòng 15-40)
```typescript
export const authApi = {
  // POST /auth/token → Đăng nhập
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<AuthenticationResponse>>("/auth/token", data),
  
  // POST /auth/introspect → Kiểm tra token hợp lệ
  introspect: (token: string) =>
    api.post("/auth/introspect", { token }),

  // POST /auth/logout → Đăng xuất
  logout: (token: string) =>
    api.post("/auth/logout", { token }),
};
```

### 1.3 Tổng Quan Luồng Logout

```
User Click Logout → LogoutModal → authApi.logout() → Clear Storage → Redirect Home
```

#### A. LogoutModal Component
**File:** `src/components/LogoutModal.tsx` (dòng 130-180)

```typescript
const handleLogout = async () => {
  setIsLoading(true);
  try {
    // 1. Lấy token từ storage
    const token = localStorage.getItem('aims_admin_token') || 
                  sessionStorage.getItem('aims_admin_token');
    
    // 2. Gọi API logout (invalidate session trên server)
    if (token) {
      await authApi.logout(token);
    }
    
    // 3. Clear tất cả auth data từ storage
    localStorage.removeItem('aims_admin_token');
    sessionStorage.removeItem('aims_admin_token');
    localStorage.removeItem('aims_admin_user');
    
    // 4. Hiển thị thông báo thành công
    toast.success('Đăng xuất thành công');
    
    // 5. Đóng modal và redirect
    onOpenChange(false);
    onConfirmLogout();  // Parent xử lý redirect về home
  } catch (error) {
    toast.error('Đăng xuất thất bại. Vui lòng thử lại.');
  }
};
```

#### B. useAuth Hook - Logout Function
**File:** `src/hooks/useAuth.ts` (dòng 140-150)
```typescript
const logout = useCallback(() => {
  storageService.remove(STORAGE_KEYS.AUTH_TOKEN);
  storageService.remove(STORAGE_KEYS.USER_INFO);
  setUser(null);
  navigate("/");  // Redirect về home
}, [storageService, navigate]);
```

### 1.4 Sơ Đồ Sequence Login

```
┌─────────┐     ┌───────────────┐     ┌──────────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │  LoginForm    │     │LoginContainer│     │ authApi │     │ Backend │
└────┬────┘     └───────┬───────┘     └──────┬───────┘     └────┬────┘     └────┬────┘
     │                  │                    │                  │               │
     │ Nhập credentials │                    │                  │               │
     │─────────────────>│                    │                  │               │
     │                  │                    │                  │               │
     │                  │ onSubmit(formData) │                  │               │
     │                  │───────────────────>│                  │               │
     │                  │                    │                  │               │
     │                  │                    │ login(username,  │               │
     │                  │                    │ password)        │               │
     │                  │                    │─────────────────>│               │
     │                  │                    │                  │               │
     │                  │                    │                  │ POST /auth/   │
     │                  │                    │                  │ token         │
     │                  │                    │                  │──────────────>│
     │                  │                    │                  │               │
     │                  │                    │                  │  JWT Token    │
     │                  │                    │                  │<──────────────│
     │                  │                    │                  │               │
     │                  │                    │ Save to storage  │               │
     │                  │                    │ Decode JWT       │               │
     │                  │                    │ Redirect by role │               │
     │                  │                    │<─────────────────│               │
     │                  │                    │                  │               │
     │  Redirect to     │                    │                  │               │
     │  /admin or /     │                    │                  │               │
     │<─────────────────│                    │                  │               │
```

---

## 2. Use Case: Search Products

### 2.1 Tổng Quan Luồng


```
HomePage → useHomePage → useProduct → productApi → Backend
                              ↓
                         products[]
                              ↓
                    ProductGrid (filter + search)
                              ↓
                    ProductCard[] (hiển thị)
```

### 2.2 Chi Tiết Các File và Dòng Code

#### A. HomePage - Entry Point
**File:** `src/pages/Home/HomePage.tsx` (dòng 15-35)
```typescript
export function HomePage() {
  const {
    products,        // Danh sách sản phẩm từ API
    cartItemCount,   // Số lượng item trong giỏ
    handleShopNow,   // Scroll đến section products
    handleViewCart,  // Navigate đến /cart
  } = useHomePage();

  return (
    <div className="space-y-8">
      <HeroSection
        cartItemCount={cartItemCount}
        onShopNow={handleShopNow}
        onViewCart={handleViewCart}
      />
      <div id="products" className="scroll-mt-4">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
```
- **Chức năng:** Trang chủ hiển thị Hero section và danh sách sản phẩm

#### B. useHomePage Hook - Business Logic
**File:** `src/pages/Home/useHomePage.ts` (dòng 15-55)
```typescript
export function useHomePage(): UseHomePageReturn {
  const navigate = useNavigate();
  const { currentOrder } = useCart();
  const { getAllProducts, loading, error } = useProduct();
  const [products, setProducts] = useState<IAnyProduct[]>([]);

  // Load tất cả products khi component mount
  useEffect(() => {
    const loadProducts = async () => {
      const list = await getAllProducts();
      if (list) setProducts(list);
    };
    loadProducts();
  }, [getAllProducts]);

  // Scroll đến section products
  const handleShopNow = useCallback(() => {
    const section = document.getElementById('products');
    section?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return { products, cartItemCount, loading, error, handleShopNow, handleViewCart };
}
```
- **Chức năng:** Fetch products từ API, quản lý state, xử lý navigation

#### C. useProduct Hook - API Wrapper
**File:** `src/hooks/useProduct.ts` (dòng 5-60)

```typescript
export function useProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wrapper xử lý loading/error
  const safeCall = async (fn: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fn();
      return res.data.result ?? res.data;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Lấy tất cả sản phẩm
  const getAllProducts = useCallback(async () => {
    return await safeCall(() => productApi.getAllProducts());
  }, []);

  // Lấy sản phẩm theo ID
  const getProductById = useCallback(async (id: string) => {
    return await safeCall(() => productApi.getProductById(id));
  }, []);

  return { loading, error, getAllProducts, getProductById, ... };
}
```

#### D. Product API Service
**File:** `src/services/products/productApi.ts` (dòng 5-25)
```typescript
export const productApi = {
  // GET /product → Lấy toàn bộ sản phẩm
  getAllProducts: () => api.get("/product"),

  // GET /product/{productId} → Lấy sản phẩm theo ID
  getProductById: (id: string) => api.get(`/product/${id}`),
};
```

#### E. ProductGrid - Search & Filter Component
**File:** `src/components/product/ProductGrid.tsx` (dòng 70-180)
```typescript
export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { showNotification } = useNotification();
  const { addToCart } = useCart();
  
  // State quản lý filters
  const [filters, setFilters] = useState<IProductFilters>({
    types: [],                           // Filter theo loại: BOOK, CD, DVD, NEWSPAPER
    priceRange: { min: 0, max: 1_000_000 }, // Filter theo giá
    condition: 'All',                    // Filter theo tình trạng: New, Used
    searchQuery: '',                     // Search text
  });

  // Filter products dựa trên filters state
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // 1. Type filter
      if (filters.types.length > 0 && !filters.types.includes(product.type)) {
        return false;
      }

      // 2. Price range filter
      if (product.price < filters.priceRange.min || 
          product.price > filters.priceRange.max) {
        return false;
      }

      // 3. Condition filter
      if (filters.condition !== 'All' && product.condition !== filters.condition) {
        return false;
      }

      // 4. Search query filter (tìm trong nhiều fields)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        let searchableText = [
          product.name,
          product.description,
          product.type,
          product.barcode,
        ].join(' ').toLowerCase();

        // Thêm fields đặc thù theo loại sản phẩm
        if ('author' in product) searchableText += ' ' + product.author;
        if ('artist' in product) searchableText += ' ' + product.artist;
        if ('director' in product) searchableText += ' ' + product.director;
        if ('publisher' in product) searchableText += ' ' + product.publisher;

        if (!searchableText.includes(query)) return false;
      }
      return true;
    });

    // Sort: active products first
    return filtered.sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
  }, [products, filters]);

  // Xử lý search input change
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 ..." />
        <Input
          placeholder="Search products by title, author, artist, director..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Layout: Sidebar Filters + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside>
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </aside>
        <div>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>
    </div>
  );
}
```


#### F. ProductFilters - Sidebar Filter Component
**File:** `src/components/product/ProductFilters.tsx` (dòng 50-150)
```typescript
export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const types: ProductType[] = ['BOOK', 'NEWSPAPER', 'CD', 'DVD'];
  const conditions: Array<ProductCondition | 'All'> = ['All', 'New', 'Used'];

  // Toggle filter theo type
  const handleTypeToggle = (type: ProductType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  // Thay đổi price range
  const handlePriceRangeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: { min: values[0], max: values[1] },
    });
  };

  // Thay đổi condition
  const handleConditionChange = (condition: ProductCondition | 'All') => {
    onFiltersChange({ ...filters, condition });
  };

  // Reset tất cả filters
  const handleReset = () => {
    onFiltersChange({
      types: [],
      priceRange: { min: 0, max: 1_000_000 },
      condition: 'All',
      searchQuery: '',
    });
  };

  return (
    <Card className="p-6 space-y-6 h-fit sticky top-4">
      {/* Type Filter - Checkboxes */}
      {types.map((type) => (
        <Checkbox
          checked={filters.types.includes(type)}
          onCheckedChange={() => handleTypeToggle(type)}
        />
      ))}

      {/* Price Range Filter - Slider */}
      <Slider
        min={0} max={1_000_000} step={100000}
        value={[filters.priceRange.min, filters.priceRange.max]}
        onValueChange={handlePriceRangeChange}
      />

      {/* Condition Filter - Checkboxes */}
      {conditions.map((condition) => (
        <Checkbox
          checked={filters.condition === condition}
          onCheckedChange={() => handleConditionChange(condition)}
        />
      ))}
    </Card>
  );
}
```

#### G. ProductCard - Hiển Thị Sản Phẩm
**File:** `src/components/product/ProductCard.tsx` (dòng 50-130)
```typescript
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const isOutOfStock = product.stock === 0 || product.active === false;

  // Lấy tên tác giả/nghệ sĩ theo loại sản phẩm
  const getCreatorName = () => {
    switch (product.type) {
      case "BOOK": return (product as IBook).author ?? "";
      case "NEWSPAPER": return (product as INewspaper).publisher ?? "";
      case "CD": return (product as ICD).artist ?? "";
      case "DVD": return (product as IDVD).director ?? "";
      default: return "";
    }
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || adding) return;
    setAdding(true);
    try {
      await addToCart(product.id, 1, product.name);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card onClick={() => navigate(`/products/${product.id}`)}>
      <ImageWithFallback src={product.imageUrl} alt={product.name} />
      {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
      <Badge>{product.type}</Badge>
      <h3>{product.name}</h3>
      <p>{getCreatorName()}</p>
      <p className="text-teal-600">{formatPrice(product.price)}</p>
      <Button onClick={handleAddToCart} disabled={isOutOfStock}>
        <ShoppingCart /> Add
      </Button>
    </Card>
  );
}
```

### 2.3 Sơ Đồ Sequence Search Products


```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌────────────┐     ┌─────────┐
│  User   │     │ HomePage │     │ ProductGrid │     │ useProduct │     │ Backend │
└────┬────┘     └────┬─────┘     └──────┬──────┘     └─────┬──────┘     └────┬────┘
     │               │                  │                  │                 │
     │ Visit /       │                  │                  │                 │
     │──────────────>│                  │                  │                 │
     │               │                  │                  │                 │
     │               │ useHomePage()    │                  │                 │
     │               │ getAllProducts() │                  │                 │
     │               │─────────────────────────────────────>                 │
     │               │                  │                  │                 │
     │               │                  │                  │ GET /product    │
     │               │                  │                  │────────────────>│
     │               │                  │                  │                 │
     │               │                  │                  │  products[]     │
     │               │                  │                  │<────────────────│
     │               │                  │                  │                 │
     │               │ products[]       │                  │                 │
     │               │<─────────────────────────────────────                 │
     │               │                  │                  │                 │
     │               │ <ProductGrid     │                  │                 │
     │               │  products={...}/>│                  │                 │
     │               │─────────────────>│                  │                 │
     │               │                  │                  │                 │
     │ Nhập search   │                  │                  │                 │
     │ query         │                  │                  │                 │
     │──────────────────────────────────>                  │                 │
     │               │                  │                  │                 │
     │               │                  │ Filter locally   │                 │
     │               │                  │ (useMemo)        │                 │
     │               │                  │                  │                 │
     │ Hiển thị kết  │                  │                  │                 │
     │ quả filtered  │                  │                  │                 │
     │<──────────────────────────────────                  │                 │
```

---

## 3. Use Case: Select Delivery Method

### 3.1 Tổng Quan Luồng

```
CartPage → CheckoutFlow → ShippingForm → calculateShippingFee() → OrderSummary
                              ↓
                    IDeliveryInfo (province, method, fee)
                              ↓
                    Continue to Payment
```

### 3.2 Chi Tiết Các File và Dòng Code

#### A. CheckoutFlow - Main Orchestrator
**File:** `src/pages/Checkout/CheckoutFlow.tsx` (dòng 40-180)
```typescript
export function CheckoutFlow() {
  const navigate = useNavigate();
  const { selectedItemIds, getSelectedItemsTotal, getSelectedItemsWeight } = useCart();
  const { createOrReuseOrder } = useOrder();

  // State quản lý checkout
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingData, setShippingData] = useState<IDeliveryInfo>({
    deliveryId: '',
    fullName: '',
    phoneNumber: '',
    Email: '',
    address: '',
    province: '',
    deliveryMethod: 'Standard',
    deliveryFee: 0,
    note: '',
  });

  // Tính phí ship theo tỉnh/thành
  const calculateShippingFee = (province: string, weight: number, orderValue: number): number => {
    const isUrban = ['Hanoi', 'Ho Chi Minh City'].includes(province);
    let baseFee: number;
    let additionalFee: number;

    if (isUrban) {
      baseFee = 22000;  // Phí cơ bản cho 3kg đầu
      const extraWeight = Math.max(0, weight - 3);
      additionalFee = Math.ceil(extraWeight / 0.5) * 2500;  // 2500đ/0.5kg thêm
    } else {
      baseFee = 30000;  // Phí cơ bản cho 0.5kg đầu
      const extraWeight = Math.max(0, weight - 0.5);
      additionalFee = Math.ceil(extraWeight / 0.5) * 2500;
    }

    let totalFee = baseFee + additionalFee;

    // Giảm phí ship cho đơn > 100k
    if (orderValue >= 100000) {
      totalFee = Math.max(0, totalFee - 25000);
    }

    return totalFee;
  };

  // Xử lý submit shipping form
  const handleShippingSubmit = async (data: IDeliveryInfo) => {
    // 1. Tính phí ship
    const weight = getSelectedItemsWeight();
    const orderValue = getSelectedItemsTotal();
    const shippingFee = calculateShippingFee(data.province, weight, orderValue);

    // 2. Cập nhật shipping data với fee
    const updatedData: IDeliveryInfo = { ...data, deliveryFee: shippingFee };
    setShippingData(updatedData);

    // 3. Tạo order
    const order = await createOrReuseOrder(shippingFormData);
    if (order) {
      setCurrentStep('payment');  // Chuyển sang bước thanh toán
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <StepIndicator currentStep={STEP_MAP[currentStep]} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {currentStep === 'shipping' && (
            <ShippingForm
              shippingData={shippingData}
              onSubmit={handleShippingSubmit}
              isLoading={isLoading}
            />
          )}
          {currentStep === 'payment' && orderId && (
            <PaymentMethodSelector orderId={orderId} amount={totalAmount} />
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <OrderSummary
            productCost={productCost}
            vat={vat}
            deliveryFee={shippingData.deliveryFee}
            totalAmount={totalAmount}
          />
        </div>
      </div>
    </div>
  );
}
```


#### B. ShippingForm - Form Nhập Thông Tin Giao Hàng
**File:** `src/pages/Checkout/ShippingForm.tsx` (dòng 50-250)
```typescript
export function ShippingForm({ shippingData, onSubmit, isLoading, notify }: ShippingFormProps) {
  const [formData, setFormData] = useState<IDeliveryInfo>(shippingData);
  const [errors, setErrors] = useState<Partial<Record<keyof IDeliveryInfo, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof IDeliveryInfo, boolean>>>({});

  // Validation từng field
  const validateField = (name: keyof IDeliveryInfo, value: string | number) => {
    const strValue = String(value);
    switch (name) {
      case 'fullName':
        if (!strValue.trim()) return 'Full name is required';
        if (strValue.trim().length < 2) return 'Full name must be at least 2 characters';
        return '';
      case 'phoneNumber':
        if (!strValue.trim()) return 'Phone number is required';
        if (!/^[0-9]{10,11}$/.test(strValue.replace(/\s/g, '')))
          return 'Please enter a valid phone number (10-11 digits)';
        return '';
      case 'Email':
        if (!strValue.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue))
          return 'Please enter a valid email address';
        return '';
      case 'address':
        if (!strValue.trim()) return 'Address is required';
        if (strValue.trim().length < 10)
          return 'Please enter a detailed address (at least 10 characters)';
        return '';
      case 'province':
        if (!strValue) return 'Please select a province';
        return '';
      case 'deliveryMethod':
        if (!strValue) return 'Please select a delivery method';
        return '';
      default:
        return '';
    }
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate tất cả required fields
    const newErrors: Partial<Record<keyof IDeliveryInfo, string>> = {};
    const requiredFields: (keyof IDeliveryInfo)[] = [
      'fullName', 'phoneNumber', 'Email', 'address', 'province', 'deliveryMethod',
    ];
    
    requiredFields.forEach((key) => {
      const error = validateField(key, formData[key] ?? '');
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      notify("info", "Validating shipping details and calculating fees...");
      onSubmit(formData);  // Gọi callback từ CheckoutFlow
    } else {
      notify("error", "Please correct the highlighted errors in the shipping form.");
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        {/* Full Name Input */}
        <Input
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          onBlur={() => handleBlur('fullName')}
        />

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
        />

        {/* Email Input */}
        <Input
          type="email"
          value={formData.Email}
          onChange={(e) => handleChange('Email', e.target.value)}
        />

        {/* Province Select - QUAN TRỌNG cho tính phí ship */}
        <Select
          value={formData.province}
          onValueChange={(value) => handleChange('province', value)}
        >
          {PROVINCES.map((province) => (
            <SelectItem key={province} value={province}>{province}</SelectItem>
          ))}
        </Select>

        {/* Address Input */}
        <Input
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
        />

        {/* Delivery Method Select */}
        <Select
          value={formData.deliveryMethod}
          onValueChange={(value) => handleChange('deliveryMethod', value)}
        >
          {DELIVERY_METHODS.map((method) => (
            <SelectItem key={method} value={method}>{method}</SelectItem>
          ))}
        </Select>

        {/* Note (Optional) */}
        <Textarea
          value={formData.note || ''}
          onChange={(e) => handleChange('note', e.target.value)}
        />

        {/* Shipping Fee Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4>📦 Shipping Fee Information</h4>
          <p><strong>Hanoi & Ho Chi Minh City:</strong></p>
          <p>• 22,000 VND for first 3kg</p>
          <p>• 2,500 VND per additional 0.5kg</p>
          <p><strong>Other Provinces:</strong></p>
          <p>• 30,000 VND for first 0.5kg</p>
          <p>• 2,500 VND per additional 0.5kg</p>
          <p className="text-green-700">
            🎁 Orders over 100,000 VND qualify for up to 25,000 VND discount!
          </p>
        </div>

        <Button type="submit">Continue to Payment</Button>
      </form>
    </Card>
  );
}
```


#### C. Delivery API Service (Mock)
**File:** `src/services/deliveryApi.ts` (dòng 20-70)
```typescript
// Tính phí vận chuyển (Mock - sẽ thay bằng API thật)
export const handleCalculateFee = async (
  weight: number,
  province: string,
  orderValue: number
): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const isHanoiOrHCM = province === 'Hà Nội' || province === 'TP. Hồ Chí Minh';
      let fee = 0;

      if (isHanoiOrHCM) {
        fee = 22000;  // Base fee for first 3kg
        if (weight > 3) {
          fee += Math.ceil(weight - 3) * 2500;
        }
      } else {
        fee = 30000;  // Base fee for first 0.5kg
        if (weight > 0.5) {
          fee += Math.ceil((weight - 0.5) * 2) * 2500;
        }
      }

      // Free shipping logic
      if (orderValue > 100000 && fee > 25000) {
        fee = Math.max(0, fee - 25000);
      } else if (orderValue > 100000) {
        fee = 0;
      }

      resolve(fee);
    }, 500);
  });
};

// Submit thông tin giao hàng
export const handleSubmitDeliveryInfo = async (
  deliveryInfo: IDeliveryInfo
): Promise<IDeliveryInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...deliveryInfo,
        deliveryId: `DEL-${Date.now()}`,  // Backend generates this
      });
    }, 800);
  });
};
```

#### D. Constants - Provinces & Delivery Methods
**File:** `src/constants/provinces.ts`
```typescript
export const PROVINCES = [
  'Hanoi',
  'Ho Chi Minh City',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  // ... các tỉnh thành khác
];
```

**File:** `src/constants/shipping.ts`
```typescript
export const DELIVERY_METHODS = [
  'Standard Delivery',
  'Express Delivery',
  'Same Day Delivery',
];
```

### 3.3 Sơ Đồ Sequence Select Delivery Method

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  User   │     │ CheckoutFlow │     │ ShippingForm │     │ OrderSummary│
└────┬────┘     └──────┬───────┘     └──────┬───────┘     └──────┬──────┘
     │                 │                    │                    │
     │ Chọn province   │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │                 │                    │ handleChange()     │
     │                 │                    │ setFormData()      │
     │                 │                    │                    │
     │ Chọn delivery   │                    │                    │
     │ method          │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │ Submit form     │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │                 │ onSubmit(formData) │                    │
     │                 │<───────────────────│                    │
     │                 │                    │                    │
     │                 │ calculateShipping  │                    │
     │                 │ Fee(province,      │                    │
     │                 │ weight, orderValue)│                    │
     │                 │                    │                    │
     │                 │ setShippingData()  │                    │
     │                 │ (with deliveryFee) │                    │
     │                 │                    │                    │
     │                 │ Update OrderSummary│                    │
     │                 │───────────────────────────────────────>│
     │                 │                    │                    │
     │ Hiển thị phí    │                    │                    │
     │ ship mới        │                    │                    │
     │<────────────────────────────────────────────────────────│
```

---

## 4. Use Case: Place Order

### 4.1 Tổng Quan Luồng


```
CartPage → Checkout → ShippingForm → Payment → OrderSuccess
    ↓           ↓           ↓           ↓           ↓
CartContext  useOrder   deliveryApi  paymentApi  clearCart
```

### 4.2 Chi Tiết Các File và Dòng Code

#### A. CartPage - Bắt Đầu Checkout
**File:** `src/pages/Cart/CartPage.tsx` (dòng 25-60)
```typescript
export function CartPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const {
    currentOrder,
    selectedItemIds,
    updateCartItemQuantity,
    removeCartItem,
    toggleItemSelection,
    selectAllItems,
    hasStockIssues,
  } = useCart();

  // Xử lý chuyển sang checkout
  const handleProceedToCheckout = () => {
    // 1. Kiểm tra có items được chọn không
    if (selectedItemIds.length === 0) {
      showNotification("warning", "Please select items to checkout.");
      return;
    }

    // 2. Kiểm tra stock issues
    if (hasStockIssues()) {
      showNotification("error", "Please fix stock issues before checkout.");
      return;
    }

    // 3. Navigate đến checkout
    if (currentOrder.items.length > 0) {
      navigate("/checkout");
    }
  };

  return (
    <CartPageComponent
      cartItems={cartItems}
      onUpdateQuantity={updateCartItemQuantity}
      onRemoveItem={removeCartItem}
      onProceedToCheckout={handleProceedToCheckout}
      hasStockIssues={hasStockIssues()}
      selectedItemIds={selectedItemIds}
      onToggleItem={toggleItemSelection}
      onSelectAll={selectAllItems}
    />
  );
}
```

#### B. CartContext - Quản Lý Giỏ Hàng
**File:** `src/context/CartContext.tsx` (dòng 100-350)
```typescript
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [currentOrder, setCurrentOrderState] = useState<LocalCart>({ items: [] });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch cart từ API
  const fetchCart = async (force = false) => {
    const params = buildCartQueryParams();  // accountId hoặc guestUuid
    const resp = await cartItemApi.getCartItems(params ?? {});
    const items = normalizeItems(resp?.data?.result ?? []);
    setCurrentOrderState({ items, ...computeTotals(items) });
    setSelectedItemIds(items.map((it) => it.id));  // Default select all
  };

  // Thêm sản phẩm vào giỏ
  const addToCart = async (productId: string, quantity = 1, productName?: string) => {
    const payload: Partial<CartItemRequestDTO> = {
      productId,
      quantity,
      ...(user?.sub ? { accountId: user.sub } : {}),
    };
    const response = await cartItemApi.addToCart(payload as CartItemRequestDTO);
    
    // Lưu guestUuid nếu là guest
    const guestUuid = response?.data?.result?.guestUuid;
    if (guestUuid && !user?.sub) {
      localStorage.setItem("GUEST_CART_ID", guestUuid);
    }

    await fetchCart(true);
    showNotification("success", CART_MESSAGES.ADD_SUCCESS(quantity, productName));
  };

  // Cập nhật số lượng
  const updateCartItemQuantity = async (cartItemId: string, quantity: number) => {
    await cartItemApi.updateCartItem(cartItemId, { quantity });
    await fetchCart(true);
    showNotification("success", CART_MESSAGES.UPDATE_SUCCESS);
  };

  // Xóa item khỏi giỏ
  const removeCartItem = async (cartItemId: string) => {
    await cartItemApi.deleteCartItem(cartItemId);
    setCurrentOrderState((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== cartItemId),
    }));
    showNotification("success", CART_MESSAGES.REMOVE_SUCCESS);
  };

  // Helpers cho checkout
  const getSelectedCartItemIds = (): string[] => selectedItemIds;
  const getSelectedItemsTotal = (): number => {
    return currentOrder.items
      .filter((it) => selectedItemIds.includes(it.id))
      .reduce((sum, it) => sum + (it.totalPrice ?? 0), 0);
  };
  const getSelectedItemsWeight = (): number => {
    return currentOrder.items
      .filter((it) => selectedItemIds.includes(it.id))
      .reduce((sum, it) => sum + ((it.product?.weight ?? 0) * it.quantity), 0);
  };

  // Auth helpers
  const getGuestUuid = (): string | null => localStorage.getItem("GUEST_CART_ID");
  const isLoggedIn = (): boolean => !!(user?.sub);
  const getAccountId = (): string | null => user?.sub ?? null;

  return (
    <CartContext.Provider value={{
      currentOrder, selectedItemIds, fetchCart, addToCart,
      updateCartItemQuantity, removeCartItem, toggleItemSelection,
      selectAllItems, hasStockIssues, getSelectedCartItemIds,
      getSelectedItemsTotal, getSelectedItemsWeight, getGuestUuid,
      isLoggedIn, getAccountId, ...
    }}>
      {children}
    </CartContext.Provider>
  );
};
```


#### C. useOrder Hook - Tạo Order
**File:** `src/hooks/useOrder.ts` (dòng 50-150)
```typescript
export function useOrder(): UseOrderReturn {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderResponse, setOrderResponse] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getSelectedCartItemIds, isLoggedIn, getAccountId, getGuestUuid } = useCart();
  const { showNotification } = useNotification();

  // Convert form data sang API request
  const convertToAddressRequest = (data: ShippingFormData): AddressRequest => ({
    recipientName: data.fullName,
    phoneNumber: data.phoneNumber,
    email: data.email,
    street: data.address,
    city: data.province,
  });

  // Tạo order từ cart
  const createOrder = useCallback(async (shippingData: ShippingFormData): Promise<OrderResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const selectedItemIds = getSelectedCartItemIds();
      if (selectedItemIds.length === 0) {
        throw new Error('No items selected for checkout');
      }

      const addressRequest = convertToAddressRequest(shippingData);
      let response;

      if (isLoggedIn()) {
        // Logged-in user order
        const accountId = getAccountId();
        const request: CartOrderRequest = {
          accountId,
          cartItemIds: selectedItemIds,
          newAddress: addressRequest,
        };
        response = await orderApi.createCartOrder(request);
      } else {
        // Guest order
        const guestUuid = getGuestUuid();
        const request: GuestCartOrderRequest = {
          guestUuid,
          cartItemIds: selectedItemIds,
          newAddress: addressRequest,
        };
        response = await orderApi.createGuestCartOrder(request);
      }

      const order = response.data.result;
      setOrderId(order.id);
      setOrderResponse(order);
      showNotification('success', CHECKOUT_MESSAGES.ORDER_SUCCESS);
      return order;

    } catch (err: any) {
      // Xử lý error codes từ backend
      let errorMessage = 'Failed to create order.';
      switch (err.response?.data?.code) {
        case 1001: errorMessage = 'Account not found.'; break;
        case 1009: errorMessage = 'Product not found.'; break;
        case 1012: errorMessage = 'Cart not found.'; break;
        case 1021: errorMessage = 'Some products are out of stock.'; break;
        // ... more error codes
      }
      setError(errorMessage);
      showNotification('error', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedCartItemIds, isLoggedIn, getAccountId, getGuestUuid, showNotification]);

  // Tạo mới hoặc reuse order đã tồn tại
  const createOrReuseOrder = useCallback(async (shippingData: ShippingFormData) => {
    if (orderId !== null && orderResponse !== null) {
      showNotification('info', CHECKOUT_NAVIGATION_MESSAGES.ORDER_REUSED);
      return orderResponse;  // Reuse existing order
    }
    return createOrder(shippingData);  // Create new order
  }, [orderId, orderResponse, createOrder, showNotification]);

  return { orderId, orderResponse, isLoading, error, createOrder, createOrReuseOrder, ... };
}
```

#### D. Order API Service
**File:** `src/services/orders/orderApi.ts`
```typescript
export const orderApi = {
  // POST /order/cart → Tạo order từ cart (logged-in user)
  createCartOrder: (request: CartOrderRequest) =>
    api.post<ApiResponse<OrderResponse>>("/order/cart", request),

  // POST /order/guest-cart → Tạo order từ cart (guest)
  createGuestCartOrder: (request: GuestCartOrderRequest) =>
    api.post<ApiResponse<OrderResponse>>("/order/guest-cart", request),

  // GET /order/{orderId} → Lấy order theo ID
  getOrderById: (orderId: string) =>
    api.get<ApiResponse<OrderResponse>>(`/order/${orderId}`),
};
```

#### E. Payment Flow
**File:** `src/components/payment/PaymentMethodSelector.tsx`
```typescript
// Component cho phép chọn phương thức thanh toán
// - VietQR (QR Code)
// - Credit Card (PayPal)
```

**File:** `src/services/paymentApi.ts` (dòng 15-60)
```typescript
// Khởi tạo transaction
export const handlePayOrder = (orderIdParam: string): ITransactionInfo => {
  const transactionID = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  return {
    transactionID,
    content: `Payment for Order ${orderIdParam}`,
    dateTime: new Date(),
    paymentStatus: 'CREATED',
    qrCodeString: `QR-${transactionID}-${orderIdParam}`,
  };
};

// Verify payment status
export const handleVerifyPayment = async (transactionID: string): Promise<PaymentStatus> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock: Random status for demo
  const random = Math.random();
  if (random > 0.7) return 'SUCCESS';
  if (random > 0.4) return 'FAILED';
  return 'PENDING';
};

// Process credit card payment
export const handleProcessCreditCardPayment = async (
  orderID: string,
  cardInfo: any
): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 2500));
  return Math.random() > 0.3;  // 70% success rate
};
```


#### F. OrderSuccess - Trang Thành Công
**File:** `src/pages/OrderSuccess/OrderSuccess.tsx` (dòng 30-120)
```typescript
export function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrder, transactionData, shippingData } = useCheckout();

  // Lấy data từ location state (new flow) hoặc context (legacy flow)
  const locationState = location.state as LocationState | null;
  const orderId = locationState?.orderId || currentOrder.orderId;
  const orderResponse = locationState?.orderResponse;
  const orderSummary = locationState?.orderSummary;

  // Redirect nếu không có order data
  useEffect(() => {
    if (!orderId && !transactionData) {
      navigate('/cart');
    }
  }, [orderId, transactionData, navigate]);

  return (
    <Card className="max-w-2xl mx-auto p-8 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h1>Order Placed Successfully!</h1>
      <p>Thank you for your purchase.</p>

      <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
        <h3>Order Details</h3>
        <div className="flex justify-between">
          <span>Order ID:</span>
          <span className="font-mono">{orderResponse.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="text-green-600">{orderResponse.orderStatus}</span>
        </div>
        <div className="flex justify-between">
          <span>Product Cost:</span>
          <span>{orderSummary?.productCost.toLocaleString('vi-VN')} VND</span>
        </div>
        <div className="flex justify-between">
          <span>VAT (10%):</span>
          <span>{orderSummary?.vat.toLocaleString('vi-VN')} VND</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee:</span>
          <span>{orderSummary?.deliveryFee.toLocaleString('vi-VN')} VND</span>
        </div>
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="font-medium">Total:</span>
          <span className="font-semibold">{orderSummary?.totalAmount.toLocaleString('vi-VN')} VND</span>
        </div>

        {/* Delivery Address */}
        {orderResponse.deliveryInfo && (
          <div className="mt-4 pt-4 border-t">
            <h4>Delivery Address</h4>
            <p>{orderResponse.deliveryInfo.recipientName}</p>
            <p>{orderResponse.deliveryInfo.phoneNumber}</p>
            <p>{orderResponse.deliveryInfo.street}, {orderResponse.deliveryInfo.city}</p>
          </div>
        )}

        {/* Order Items */}
        {orderResponse.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.productName} × {item.quantity}</span>
            <span>{item.totalPrice.toLocaleString('vi-VN')} VND</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home /> Back to Home
        </Button>
        <Button onClick={() => navigate('/cart')}>
          <ShoppingBag /> Continue Shopping
        </Button>
      </div>
    </Card>
  );
}
```

### 4.3 Sơ Đồ Sequence Place Order

```
┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────┐
│  User   │  │ CartPage │  │ CheckoutFlow │  │  useOrder    │  │ orderApi │  │ Backend │
└────┬────┘  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬────┘
     │            │               │                 │               │             │
     │ Click      │               │                 │               │             │
     │ Checkout   │               │                 │               │             │
     │───────────>│               │                 │               │             │
     │            │               │                 │               │             │
     │            │ Validate cart │                 │               │             │
     │            │ Navigate to   │                 │               │             │
     │            │ /checkout     │                 │               │             │
     │            │──────────────>│                 │               │             │
     │            │               │                 │               │             │
     │ Fill       │               │                 │               │             │
     │ shipping   │               │                 │               │             │
     │ form       │               │                 │               │             │
     │────────────────────────────>                 │               │             │
     │            │               │                 │               │             │
     │            │               │ handleShipping  │               │             │
     │            │               │ Submit()        │               │             │
     │            │               │                 │               │             │
     │            │               │ createOrReuse   │               │             │
     │            │               │ Order()         │               │             │
     │            │               │────────────────>│               │             │
     │            │               │                 │               │             │
     │            │               │                 │ createCart    │             │
     │            │               │                 │ Order()       │             │
     │            │               │                 │──────────────>│             │
     │            │               │                 │               │             │
     │            │               │                 │               │ POST /order │
     │            │               │                 │               │ /cart       │
     │            │               │                 │               │────────────>│
     │            │               │                 │               │             │
     │            │               │                 │               │ OrderResp   │
     │            │               │                 │               │<────────────│
     │            │               │                 │               │             │
     │            │               │                 │ orderResponse │             │
     │            │               │                 │<──────────────│             │
     │            │               │                 │               │             │
     │            │               │ setCurrentStep  │               │             │
     │            │               │ ('payment')     │               │             │
     │            │               │<────────────────│               │             │
     │            │               │                 │               │             │
     │ Select     │               │                 │               │             │
     │ payment    │               │                 │               │             │
     │ method     │               │                 │               │             │
     │────────────────────────────>                 │               │             │
     │            │               │                 │               │             │
     │            │               │ Process payment │               │             │
     │            │               │ (VietQR/Card)   │               │             │
     │            │               │                 │               │             │
     │            │               │ Navigate to     │               │             │
     │            │               │ /order-success  │               │             │
     │            │               │                 │               │             │
     │ Order      │               │                 │               │             │
     │ Success    │               │                 │               │             │
     │ Page       │               │                 │               │             │
     │<────────────────────────────                 │               │             │
```

---

---

## 5. Use Case: Add To Cart

### 5.1 Tổng Quan Luồng

```
ProductCard/ProductGrid → useCart().addToCart() → cartItemApi.addToCart() → Backend
                                    ↓
                              Response (guestUuid)
                                    ↓
                         localStorage.setItem("GUEST_CART_ID")
                                    ↓
                              fetchCart(true)
                                    ↓
                         showNotification("success")
```

### 5.2 Chi Tiết Các File và Dòng Code

#### A. Entry Point - ProductCard Component
**File:** `src/components/product/ProductCard.tsx` (dòng 70-95)

```typescript
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { addToCart } = useCart();  // Lấy hàm addToCart từ CartContext
  const [adding, setAdding] = useState(false);  // State loading khi đang thêm
  const isOutOfStock = product.stock === 0 || product.active === false;

  // Xử lý click nút Add to Cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();  // Ngăn event bubble lên Card (navigate to detail)
    if (isOutOfStock || adding) return;  // Guard: không cho thêm nếu hết hàng hoặc đang loading
    
    setAdding(true);
    try {
      // Gọi addToCart từ CartContext với productId, quantity=1, productName
      await addToCart(product.id, 1, product.name);
    } catch (err) {
      console.error("error adding to cart", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card onClick={() => navigate(`/products/${product.id}`)}>
      {/* ... product info ... */}
      <Button 
        size="sm" 
        disabled={isOutOfStock || adding}  // Disable khi hết hàng hoặc đang loading
        onClick={handleAddToCart}
      >
        <ShoppingCart className="w-3.5 h-3.5 mr-1" />
        {adding ? "Adding..." : "Add"}  {/* Hiển thị loading state */}
      </Button>
    </Card>
  );
}
```

- **Chức năng:** Component hiển thị sản phẩm với nút "Add to Cart"
- **Logic:** 
  - Kiểm tra `isOutOfStock` trước khi cho phép thêm
  - Sử dụng `adding` state để hiển thị loading và ngăn double-click
  - Gọi `addToCart(productId, quantity, productName)` từ CartContext

#### B. Entry Point - ProductGrid Component
**File:** `src/components/product/ProductGrid.tsx` (dòng 85-110)

```typescript
export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { showNotification } = useNotification();
  const { addToCart } = useCart();

  // Handler cho add to cart từ ProductCard
  const handleAddToCart = async (product: IAnyProduct) => {
    try {
      await addToCart(product.id, 1, product.name);
      // Notification đã được xử lý trong CartContext
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onAddToCart={handleAddToCart}  // Truyền callback xuống ProductCard
        />
      ))}
    </div>
  );
}
```

- **Chức năng:** Grid hiển thị danh sách sản phẩm, cung cấp callback `onAddToCart` cho ProductCard

#### C. CartContext - Core Business Logic
**File:** `src/context/CartContext.tsx` (dòng 260-310)

```typescript
// Thêm sản phẩm vào giỏ hàng với product name để hiển thị notification
const addToCart = async (productId: string, quantity = 1, productName?: string) => {
  setLoading(true);
  try {
    // 1. Build payload cho API request
    const payload: Partial<CartItemRequestDTO> = {
      productId,
      quantity,
      ...(user?.sub ? { accountId: user.sub } : {}),
      // guestUuid không cần gửi: backend đọc từ cookie
    };

    // 2. Gọi API thêm vào giỏ hàng
    const response = await cartItemApi.addToCart(payload as CartItemRequestDTO);
    
    // 3. Lưu guestUuid vào localStorage nếu là guest
    // (vì cookie HttpOnly không đọc được từ JS)
    const guestUuid = response?.data?.result?.guestUuid;
    if (guestUuid && !user?.sub) {
      localStorage.setItem("GUEST_CART_ID", guestUuid);
      console.log("[CartContext] Saved guestUuid to localStorage:", guestUuid);
    }

    // 4. Lấy product name từ response nếu không truyền vào
    const name = productName || response?.data?.result?.product?.name || 'Product';

    // 5. Fetch lại cart từ server để đồng bộ state
    await fetchCart(true);

    // 6. Hiển thị notification thành công với tên sản phẩm
    showNotification("success", CART_MESSAGES.ADD_SUCCESS(quantity, name));
    
  } catch (err: any) {
    console.error("addToCart failed", err);

    // Xử lý error theo status code
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      showNotification("error", CART_MESSAGES.API_NOT_FOUND);
    } else {
      showNotification("error", CART_MESSAGES.ADD_FAILED);
    }
    throw err;  // Re-throw để component có thể handle
  } finally {
    setLoading(false);
  }
};
```

- **Chức năng:** Core logic thêm sản phẩm vào giỏ hàng
- **Flow chi tiết:**
  1. Set loading state
  2. Build payload với `productId`, `quantity`, và `accountId` (nếu đã login)
  3. Gọi API `POST /cartItem`
  4. Lưu `guestUuid` vào localStorage cho guest user
  5. Fetch lại cart để đồng bộ state
  6. Hiển thị notification thành công

#### D. Cart API Service
**File:** `src/services/carts/cartApi.ts` (dòng 15-25)

```typescript
export const cartItemApi = {
  /**
   * POST /cartItem
   * Thêm sản phẩm vào giỏ hàng (hỗ trợ cả account và guest)
   * Backend sẽ tự động set cookie GUEST_CART_ID nếu là guest lần đầu
   */
  addToCart: (data: CartItemRequestDTO) => 
    api.post("/cartItem", data),

  // ... other methods
};
```

- **Endpoint:** `POST /cartItem`
- **Request Body:** `CartItemRequestDTO` gồm `productId`, `quantity`, `accountId` (optional)
- **Response:** `CartItemResponseDTO` gồm `id`, `guestUuid`, `product`, `quantity`, `totalPrice`

#### E. Cart Types
**File:** `src/types/cart.types.ts`

```typescript
// Request DTO gửi lên server
export interface CartItemRequestDTO {
  productId: string;
  quantity: number;
  accountId?: string;  // Optional: chỉ có khi user đã login
  guestUuid?: string;  // Optional: backend tự đọc từ cookie
}

// Response DTO từ server
export interface CartItemResponseDTO {
  id: string;
  guestUuid?: string;  // Backend trả về cho guest user
  product: ProductLeanResponseDTO;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// UI type sau khi normalize
export interface CartItemUI {
  id: string;
  quantity: number;
  addedQuantity: number;
  unitPrice: number;
  totalPrice: number;
  product: ProductLeanResponseDTO;
}
```

#### F. Guest vs Logged-in User Flow

**Guest User Flow:**
```
1. User chưa login → user.sub = undefined
2. addToCart() gọi API với payload: { productId, quantity }
3. Backend tạo cart mới, set cookie GUEST_CART_ID
4. Response trả về guestUuid
5. Frontend lưu guestUuid vào localStorage
6. Các request sau sử dụng guestUuid từ localStorage/cookie
```

**Logged-in User Flow:**
```
1. User đã login → user.sub = accountId
2. addToCart() gọi API với payload: { productId, quantity, accountId }
3. Backend thêm vào cart của account
4. Response trả về cart item
5. Không cần lưu guestUuid
```

#### G. Notification Messages
**File:** `src/constants/notifications.ts`

```typescript
export const CART_MESSAGES = {
  ADD_SUCCESS: (quantity: number, productName: string) => 
    `Added ${quantity} "${productName}" to cart`,
  ADD_FAILED: 'Failed to add item to cart. Please try again.',
  API_NOT_FOUND: 'Cart service is currently unavailable.',
  // ... other messages
};
```

### 5.3 Sơ Đồ Sequence Add To Cart

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  User   │     │ ProductCard │     │ CartContext │     │ cartItemApi │     │ Backend │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └────┬────┘
     │                 │                   │                   │                 │
     │ Click "Add"     │                   │                   │                 │
     │────────────────>│                   │                   │                 │
     │                 │                   │                   │                 │
     │                 │ setAdding(true)   │                   │                 │
     │                 │                   │                   │                 │
     │                 │ addToCart(        │                   │                 │
     │                 │   productId,      │                   │                 │
     │                 │   1,              │                   │                 │
     │                 │   productName)    │                   │                 │
     │                 │──────────────────>│                   │                 │
     │                 │                   │                   │                 │
     │                 │                   │ setLoading(true)  │                 │
     │                 │                   │                   │                 │
     │                 │                   │ Build payload:    │                 │
     │                 │                   │ { productId,      │                 │
     │                 │                   │   quantity,       │                 │
     │                 │                   │   accountId? }    │                 │
     │                 │                   │                   │                 │
     │                 │                   │ addToCart(payload)│                 │
     │                 │                   │──────────────────>│                 │
     │                 │                   │                   │                 │
     │                 │                   │                   │ POST /cartItem  │
     │                 │                   │                   │────────────────>│
     │                 │                   │                   │                 │
     │                 │                   │                   │ CartItemResponse│
     │                 │                   │                   │ { id, guestUuid,│
     │                 │                   │                   │   product, ... }│
     │                 │                   │                   │<────────────────│
     │                 │                   │                   │                 │
     │                 │                   │ response          │                 │
     │                 │                   │<──────────────────│                 │
     │                 │                   │                   │                 │
     │                 │                   │ [If Guest]        │                 │
     │                 │                   │ localStorage.set( │                 │
     │                 │                   │   "GUEST_CART_ID",│                 │
     │                 │                   │   guestUuid)      │                 │
     │                 │                   │                   │                 │
     │                 │                   │ fetchCart(true)   │                 │
     │                 │                   │ (sync state)      │                 │
     │                 │                   │                   │                 │
     │                 │                   │ showNotification( │                 │
     │                 │                   │   "success",      │                 │
     │                 │                   │   "Added 1...")   │                 │
     │                 │                   │                   │                 │
     │                 │                   │ setLoading(false) │                 │
     │                 │                   │                   │                 │
     │                 │ Promise resolved  │                   │                 │
     │                 │<──────────────────│                   │                 │
     │                 │                   │                   │                 │
     │                 │ setAdding(false)  │                   │                 │
     │                 │                   │                   │                 │
     │ UI Updated:     │                   │                   │                 │
     │ - Button enabled│                   │                   │                 │
     │ - Notification  │                   │                   │                 │
     │   shown         │                   │                   │                 │
     │<────────────────│                   │                   │                 │
```

### 5.4 Error Handling Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  User   │     │ ProductCard │     │ CartContext │     │ Backend │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └────┬────┘
     │                 │                   │                 │
     │ Click "Add"     │                   │                 │
     │────────────────>│                   │                 │
     │                 │                   │                 │
     │                 │ addToCart()       │                 │
     │                 │──────────────────>│                 │
     │                 │                   │                 │
     │                 │                   │ POST /cartItem  │
     │                 │                   │────────────────>│
     │                 │                   │                 │
     │                 │                   │ Error 404       │
     │                 │                   │<────────────────│
     │                 │                   │                 │
     │                 │                   │ showNotification│
     │                 │                   │ ("error",       │
     │                 │                   │  "Cart service  │
     │                 │                   │   unavailable") │
     │                 │                   │                 │
     │                 │                   │ throw err       │
     │                 │                   │                 │
     │                 │ catch (err)       │                 │
     │                 │<──────────────────│                 │
     │                 │                   │                 │
     │                 │ console.error()   │                 │
     │                 │ setAdding(false)  │                 │
     │                 │                   │                 │
     │ Error notif     │                   │                 │
     │ displayed       │                   │                 │
     │<────────────────│                   │                 │
```

### 5.5 Các Điểm Quan Trọng

| Aspect | Chi Tiết |
|--------|----------|
| **Loading State** | `adding` state trong ProductCard + `loading` state trong CartContext |
| **Guest Support** | Backend set cookie `GUEST_CART_ID`, frontend lưu vào localStorage |
| **Optimistic UI** | Không có - luôn đợi API response trước khi update UI |
| **Error Handling** | Catch error, hiển thị notification, re-throw để component handle |
| **Notification** | Sử dụng `CART_MESSAGES.ADD_SUCCESS(quantity, productName)` |
| **Stock Check** | Kiểm tra `isOutOfStock` trước khi cho phép click |

---

## Tổng Kết

### Các File Chính Theo Use Case

| Use Case | Files Chính |
|----------|-------------|
| **Login** | `LoginPage.tsx`, `LoginContainer.tsx`, `LoginForm.tsx`, `authApi.ts`, `useAuth.ts` |
| **Logout** | `LogoutModal.tsx`, `authApi.ts`, `useAuth.ts` |
| **Search Products** | `HomePage.tsx`, `useHomePage.ts`, `ProductGrid.tsx`, `ProductFilters.tsx`, `ProductCard.tsx`, `productApi.ts` |
| **Select Delivery** | `CheckoutFlow.tsx`, `ShippingForm.tsx`, `deliveryApi.ts`, `OrderSummary.tsx` |
| **Place Order** | `CartPage.tsx`, `CartContext.tsx`, `useOrder.ts`, `orderApi.ts`, `OrderSuccess.tsx` |
| **Add To Cart** | `ProductCard.tsx`, `ProductGrid.tsx`, `CartContext.tsx`, `cartApi.ts` |

### Kiến Trúc Tổng Quan

```
src/
├── pages/           # Page components (entry points)
├── components/      # Reusable UI components
│   └── product/     # ProductCard.tsx, ProductGrid.tsx
├── hooks/           # Custom hooks (business logic)
├── context/         # React Context (global state)
│   └── CartContext.tsx  # Core cart logic
├── services/        # API services
│   └── carts/       # cartApi.ts
├── types/           # TypeScript types
│   └── cart.types.ts
├── constants/       # Constants và config
│   └── notifications.ts
└── utils/           # Utility functions
```

- **Backend Response:** `CartItemResponse` chứa `guestUuid`, `product`, `quantity`, `totalPrice`

#### E. Cart Types
**File:** `src/types/cart.types.ts`

```typescript
// Request DTO gửi lên backend
export interface CartItemRequestDTO {
  productId: string;
  quantity: number;
  accountId?: string;   // Cho logged-in user
  guestUuid?: string;   // Cho guest (backend tự set từ cookie)
}

// Response DTO từ backend
export interface CartItemResponseDTO {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  guestUuid?: string;   // Backend trả về để FE lưu localStorage
  product: ProductLeanResponseDTO;
}

// UI State (normalized từ API response)
export interface CartItemUI {
  id: string;
  quantity: number;
  addedQuantity: number;
  unitPrice?: number;
  totalPrice?: number;
  product: ProductLeanResponseDTO;
}
```

#### F. Notification Messages
**File:** `src/constants/notifications.ts`

```typescript
export const CART_MESSAGES = {
  ADD_SUCCESS: (quantity: number, productName: string) =>
    `Added ${quantity} "${productName}" to cart`,
  ADD_FAILED: 'Failed to add item to cart. Please try again.',
  UPDATE_SUCCESS: 'Cart updated successfully',
  UPDATE_FAILED: 'Failed to update cart. Please try again.',
  REMOVE_SUCCESS: 'Item removed from cart',
  REMOVE_FAILED: 'Failed to remove item. Please try again.',
  LOAD_FAILED: 'Failed to load cart. Please refresh the page.',
  NOT_FOUND: 'Cart not found. Please try again.',
  API_NOT_FOUND: 'Cart API endpoint not found. Please contact support.',
};
```

### 5.3 Sơ Đồ Sequence Add To Cart

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  User   │     │ ProductCard │     │ CartContext │     │ cartItemApi │     │ Backend │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └────┬────┘
     │                 │                   │                   │                 │
     │ Click "Add"     │                   │                   │                 │
     │────────────────>│                   │                   │                 │
     │                 │                   │                   │                 │
     │                 │ setAdding(true)   │                   │                 │
     │                 │                   │                   │                 │
     │                 │ addToCart(id,1,   │                   │                 │
     │                 │ name)             │                   │                 │
     │                 │──────────────────>│                   │                 │
     │                 │                   │                   │                 │
     │                 │                   │ setLoading(true)  │                 │
     │                 │                   │                   │                 │
     │                 │                   │ Build payload:    │                 │
     │                 │                   │ {productId, qty,  │                 │
     │                 │                   │  accountId?}      │                 │
     │                 │                   │                   │                 │
     │                 │                   │ addToCart(payload)│                 │
     │                 │                   │──────────────────>│                 │
     │                 │                   │                   │                 │
     │                 │                   │                   │ POST /cartItem  │
     │                 │                   │                   │────────────────>│
     │                 │                   │                   │                 │
     │                 │                   │                   │ CartItemResponse│
     │                 │                   │                   │ + Set-Cookie    │
     │                 │                   │                   │<────────────────│
     │                 │                   │                   │                 │
     │                 │                   │ response          │                 │
     │                 │                   │<──────────────────│                 │
     │                 │                   │                   │                 │
     │                 │                   │ if guest:         │                 │
     │                 │                   │ localStorage.set  │                 │
     │                 │                   │ ("GUEST_CART_ID") │                 │
     │                 │                   │                   │                 │
     │                 │                   │ fetchCart(true)   │                 │
     │                 │                   │ → Sync state      │                 │
     │                 │                   │                   │                 │
     │                 │                   │ showNotification  │                 │
     │                 │                   │ ("success", msg)  │                 │
     │                 │                   │                   │                 │
     │                 │ Promise resolved  │                   │                 │
     │                 │<──────────────────│                   │                 │
     │                 │                   │                   │                 │
     │                 │ setAdding(false)  │                   │                 │
     │                 │                   │                   │                 │
     │ Toast: "Added   │                   │                   │                 │
     │ 1 Product to    │                   │                   │                 │
     │ cart"           │                   │                   │                 │
     │<────────────────│                   │                   │                 │
```

### 5.4 Xử Lý Guest vs Logged-in User

| Trường hợp | accountId | guestUuid | Hành vi |
|------------|-----------|-----------|---------|
| Logged-in | `user.sub` | - | Gửi `accountId` trong payload |
| Guest lần đầu | - | - | Backend tạo `guestUuid`, set cookie |
| Guest đã có cookie | - | từ localStorage | FE không gửi, BE đọc từ cookie |

### 5.5 Error Handling

```typescript
// Trong CartContext.addToCart()
catch (err: any) {
  console.error("addToCart failed", err);

  if (axios.isAxiosError(err) && err.response?.status === 404) {
    // API endpoint không tồn tại
    showNotification("error", CART_MESSAGES.API_NOT_FOUND);
  } else {
    // Lỗi khác (network, server error, ...)
    showNotification("error", CART_MESSAGES.ADD_FAILED);
  }
  throw err;  // Re-throw để component có thể handle
}
```

---

## Tổng Kết

### Các File Chính Theo Use Case

| Use Case | Files Liên Quan |
|----------|-----------------|
| Login/Logout | `LoginPage.tsx`, `LoginContainer.tsx`, `LoginForm.tsx`, `authApi.ts`, `useAuth.ts`, `LogoutModal.tsx` |
| Search Products | `HomePage.tsx`, `useHomePage.ts`, `ProductGrid.tsx`, `ProductFilters.tsx`, `productApi.ts`, `useProduct.ts` |
| Select Delivery | `CheckoutFlow.tsx`, `ShippingForm.tsx`, `OrderSummary.tsx` |
| Place Order | `CartPage.tsx`, `CartContext.tsx`, `useOrder.ts`, `orderApi.ts`, `OrderSuccess.tsx` |
| Add To Cart | `ProductCard.tsx`, `ProductGrid.tsx`, `CartContext.tsx`, `cartApi.ts` |

### Luồng Dữ Liệu Chung

```
User Action → Component → Hook/Context → API Service → Backend
                                              ↓
                                         Response
                                              ↓
                              Update State → Re-render UI
```
