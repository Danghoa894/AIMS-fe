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
