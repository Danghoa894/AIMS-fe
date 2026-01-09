# Tài Liệu Mô Tả Chi Tiết Luồng Hoạt Động - Hệ Thống AIMS

## Mục Lục
1. [Tổng Quan Kiến Trúc](#tổng-quan-kiến-trúc)
2. [Use Case 1: Place Order](#use-case-1-place-order)
3. [Use Case 2: Add Product to Cart](#use-case-2-add-product-to-cart)
4. [Use Case 3: Pay Order (VietQR)](#use-case-3-pay-order-vietqr)
5. [Use Case 4: Pay Order by Credit Card](#use-case-4-pay-order-by-credit-card)
6. [Use Case 5: Select Delivery Method](#use-case-5-select-delivery-method)
7. [Use Case 6: View Product Details](#use-case-6-view-product-details)
8. [Use Case 7: Search Products](#use-case-7-search-products)
9. [Use Case 8: Create Product](#use-case-8-create-product)
10. [Use Case 9: Update Product](#use-case-9-update-product)
11. [Use Case 10: Delete Product](#use-case-10-delete-product)
12. [Use Case 11: Log In](#use-case-11-log-in)
13. [Use Case 12: Log Out](#use-case-12-log-out)
14. [Tổng Kết API Endpoints](#tổng-kết-api-endpoints)
15. [Error Codes](#error-codes)

---

## Tổng Quan Kiến Trúc

### Backend Architecture (Spring Boot)
```
com.harkins.AIMS_BE/
├── controller/          # REST API endpoints
│   ├── AuthenticationController.java
│   ├── ProductController.java
│   ├── CartItemController.java
│   ├── OrderController.java
│   └── PayOrderController.java
├── service/             # Business logic
│   ├── AuthenticationService.java
│   ├── ProductService.java
│   ├── CartItemService.java
│   ├── OrderService.java
│   └── PaymentService.java
├── repository/          # Data access layer (JPA)
│   ├── AccountRepository.java
│   ├── ProductRepository.java
│   ├── CartRepository.java
│   ├── CartItemRepository.java
│   └── OrderRepository.java
├── entity/              # JPA entities
│   ├── Account.java
│   ├── Product.java
│   ├── Cart.java
│   ├── CartItem.java
│   ├── Order.java
│   ├── OrderItem.java
│   └── DeliveryInfo.java
├── dto/
│   ├── request/         # Request DTOs
│   └── response/        # Response DTOs
├── mapper/              # Entity ↔ DTO mapping (MapStruct)
├── exception/           # Custom exceptions & error codes
├── enums/               # Enums (OrderStatus, PaymentMethod, DeliveryMethod)
├── configuration/       # Security, JWT config
├── payment/             # Payment integrations (VietQR, PayPal)
│   ├── IQrPayment.java
│   └── IPayment.java
└── validator/           # Custom validators
```

### Frontend Architecture (React + TypeScript)
```
src/
├── pages/               # Page components (entry points)
│   ├── Home/
│   │   ├── HomePage.tsx
│   │   └── useHomePage.ts
│   ├── Login/
│   │   ├── LoginPage.tsx
│   │   ├── LoginContainer.tsx
│   │   └── LoginForm.tsx
│   ├── Cart/
│   │   └── CartPage.tsx
│   ├── Checkout/
│   │   ├── CheckoutFlow.tsx
│   │   └── ShippingForm.tsx
│   ├── ProductDetails/
│   │   ├── ProductDetailsPage.tsx
│   │   └── useProductDetails.ts
│   └── OrderSuccess/
│       └── OrderSuccess.tsx
├── components/          # Reusable UI components
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ProductFilters.tsx
│   ├── payment/
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── VietQRPayment.tsx
│   │   └── CreditCardPayment.tsx
│   ├── PublicRoute.tsx
│   └── LogoutModal.tsx
├── hooks/               # Custom hooks (business logic)
│   ├── useAuth.ts
│   ├── useProduct.ts
│   ├── useCart.ts
│   └── useOrder.ts
├── context/             # React Context (global state)
│   └── CartContext.tsx
├── services/            # API services
│   ├── account/
│   │   └── authApi.ts
│   ├── products/
│   │   └── productApi.ts
│   ├── carts/
│   │   └── cartApi.ts
│   ├── orders/
│   │   └── orderApi.ts
│   └── paymentApi.ts
├── types/               # TypeScript types
│   ├── auth.types.ts
│   ├── product.types.ts
│   ├── cart.types.ts
│   └── order.types.ts
├── constants/           # Constants và config
│   ├── notifications.ts
│   ├── provinces.ts
│   └── shipping.ts
└── config/
    └── routes.tsx
```

### Công Nghệ Sử Dụng

| Layer | Technology |
|-------|------------|
| **Backend Framework** | Spring Boot |
| **Security** | Spring Security + JWT (Nimbus JOSE) |
| **Database** | JPA/Hibernate |
| **Mapping** | MapStruct |
| **Build** | Maven |
| **Frontend Framework** | React 18 + TypeScript |
| **State Management** | React Context |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios |
| **UI Components** | Shadcn/ui + Tailwind CSS |

---


## Use Case 1: Place Order

### 1.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  CartPage → CheckoutFlow → ShippingForm → PaymentSelector → OrderSuccess        │
│      ↓           ↓              ↓              ↓               ↓                │
│  CartContext  useOrder    calculateFee    paymentApi      clearCart             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  OrderController → OrderService → Repositories                                   │
│        ↓               ↓              ↓                                         │
│  POST /order/cart  placeCartOrder  Account, Cart, Product, Order                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - CartPage (Entry Point)
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

#### B. Frontend - CheckoutFlow (Orchestrator)
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
    const weight = getSelectedItemsWeight();
    const orderValue = getSelectedItemsTotal();
    const shippingFee = calculateShippingFee(data.province, weight, orderValue);

    const updatedData: IDeliveryInfo = { ...data, deliveryFee: shippingFee };
    setShippingData(updatedData);

    // Tạo order
    const order = await createOrReuseOrder(shippingFormData);
    if (order) {
      setCurrentStep('payment');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <StepIndicator currentStep={STEP_MAP[currentStep]} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

#### C. Frontend - useOrder Hook
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
      let errorMessage = 'Failed to create order.';
      switch (err.response?.data?.code) {
        case 1001: errorMessage = 'Account not found.'; break;
        case 1009: errorMessage = 'Product not found.'; break;
        case 1012: errorMessage = 'Cart not found.'; break;
        case 1021: errorMessage = 'Some products are out of stock.'; break;
      }
      setError(errorMessage);
      showNotification('error', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedCartItemIds, isLoggedIn, getAccountId, getGuestUuid, showNotification]);

  return { orderId, orderResponse, isLoading, error, createOrder, createOrReuseOrder, ... };
}
```

#### D. Frontend - Order API Service
**File:** `src/services/orders/orderApi.ts`

```typescript
export const orderApi = {
  // POST /order/cart → Tạo order từ cart (logged-in user)
  createCartOrder: (request: CartOrderRequest) =>
    api.post<ApiResponse<OrderResponse>>("/order/cart", request),

  // POST /order/guest/cart → Tạo order từ cart (guest)
  createGuestCartOrder: (request: GuestCartOrderRequest) =>
    api.post<ApiResponse<OrderResponse>>("/order/guest/cart", request),

  // GET /order/{orderId} → Lấy order theo ID
  getOrderById: (orderId: string) =>
    api.get<ApiResponse<OrderResponse>>(`/order/${orderId}`),
};
```

#### E. Backend - OrderController
**File:** `controller/OrderController.java` (dòng 50-68)

```java
@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // Endpoint cho logged-in user
    @PostMapping("/cart")
    public ApiResponse<OrderResponse> cartOrder(@RequestBody CartOrderRequest order) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.placeCartOrder(order))
                .build();
    }

    // Endpoint cho guest user
    @PostMapping("/guest/cart")
    public ApiResponse<OrderResponse> cartOrderForGuest(@RequestBody GuestCartOrderRequest order) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderService.placeCartOrderForGuest(order))
                .build();
    }
}
```

#### F. Backend - OrderService (Logged-in User)
**File:** `service/OrderService.java` (dòng 80-125)

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final AccountRepository accountRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final OrderMapper orderMapper;

    @Transactional
    public OrderResponse placeCartOrder(CartOrderRequest request) {
        // 1. Tìm Account
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new WebException(ErrorCode.ACCOUNT_NOT_FOUND));

        // 2. Resolve địa chỉ giao hàng
        DeliveryInfo deliveryInfo = resolveDeliveryInfo(
            request.addressId(), 
            request.newAddress(), 
            account
        );

        // 3. Tạo Order
        Order order = Order.builder()
                .account(account)
                .deliveryInfo(deliveryInfo)
                .orderStatus(OrderStatus.CREATED)
                .build();

        // 4. Lấy CartItems từ request
        List<CartItem> items = cartItemRepository.findAllById(request.cartItemIds());
        if(items.isEmpty()) throw new WebException(ErrorCode.CARTITEM_NOT_FOUND);

        // 5. Tạo OrderItems từ CartItems
        for(CartItem item : items) {
            Product product = item.getProduct();

            OrderItem orderItem = OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .productDescription(product.getDescription())
                    .quantity(Math.min(item.getQuantity(), product.getStock()))
                    .unitPrice(item.getUnitPrice())
                    .createdAt(LocalDateTime.now())
                    .totalWeight(item.getTotalWeight())
                    .build();

            orderItem.setTotalPrice(orderItem.getUnitPrice() * orderItem.getQuantity());
            order.addItem(orderItem);

            // 6. Giảm stock sản phẩm
            product.setStock(product.getStock() - orderItem.getQuantity());
            if(product.getStock() <= 0) product.setActive(false);
            else productRepository.save(product);
        }

        // 7. Lưu Order
        Order savedOrder = orderRepository.save(order);

        // 8. Xóa CartItems đã mua khỏi Cart
        items.forEach(cartItem -> {
            Cart cart = cartItem.getCart();
            cart.removeItem(cartItem);
        });

        return orderMapper.toOrderResponse(savedOrder);
    }
}
```

#### G. Backend - OrderService (Guest User)
**File:** `service/OrderService.java` (dòng 175-235)

```java
@Transactional
public OrderResponse placeCartOrderForGuest(GuestCartOrderRequest request) {
    // 1. Tìm Cart theo guestUuid
    Cart cart = cartRepository.findByGuestUuid(request.guestUuid())
            .orElseThrow(() -> new WebException(ErrorCode.CART_NOT_FOUND));

    // 2. Tạo DeliveryInfo từ địa chỉ guest (không lưu vào DB)
    DeliveryInfo deliveryInfo = deliveryInfoFromGuestAddress(request.newAddress());

    // 3. Lấy CartItems
    List<CartItem> items;
    if(request.cartItemIds() != null && !request.cartItemIds().isEmpty()) {
        items = cartItemRepository.findAllById(request.cartItemIds());
    } else {
        items = cart.getItems();  // Lấy tất cả nếu không chỉ định
    }

    if(items == null || items.isEmpty())
        throw new WebException(ErrorCode.CARTITEM_NOT_FOUND);

    // 4. Tạo Order (không có account)
    Order order = Order.builder()
            .account(null)  // Guest order
            .orderStatus(OrderStatus.CREATED)
            .deliveryInfo(deliveryInfo)
            .build();

    // 5. Xử lý từng CartItem → OrderItem
    for(CartItem cartItem : items) {
        Product product = cartItem.getProduct();
        if(product == null)
            throw new WebException(ErrorCode.PRODUCT_NOT_FOUND);

        int take = Math.min(cartItem.getQuantity(), product.getStock());
        if(take <= 0)
            throw new WebException(ErrorCode.PRODUCT_OUT_OF_STOCK);

        double unitPrice = product.getPrice();
        double totalPrice = unitPrice * take;
        
        OrderItem orderItem = OrderItem.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productDescription(product.getDescription())
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .quantity(take)
                .createdAt(LocalDateTime.now())
                .build();

        order.addItem(orderItem);

        // 6. Giảm stock
        product.setStock(product.getStock() - take);
        if(product.getStock() <= 0) product.setActive(false);
        productRepository.save(product);
    }

    // 7. Lưu Order
    Order saved = orderRepository.save(order);

    // 8. Xóa CartItems đã mua
    for(CartItem cartItem : items) {
        cart.removeItem(cartItem);
        cartItemRepository.delete(cartItem);
    }

    return orderMapper.toOrderResponse(saved);
}
```

#### H. Backend - Helper resolveDeliveryInfo
**File:** `service/OrderService.java` (dòng 127-165)

```java
private DeliveryInfo resolveDeliveryInfo(String addressId, AddressRequest newAddress, Account account) {
    // Case 1: Sử dụng địa chỉ đã lưu
    if (addressId != null) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new WebException(ErrorCode.ADDRESS_NOT_FOUND));

        return DeliveryInfo.builder()
                .recipientName(address.getRecipientName())
                .phoneNumber(address.getPhoneNumber())
                .email(address.getEmail())
                .city(address.getCity())
                .street(address.getStreet())
                .deliveryMethod(DeliveryMethod.STANDARD)
                .build();
    }

    // Case 2: Tạo địa chỉ mới
    if (newAddress != null) {
        Address address = Address.builder()
                .recipientName(newAddress.getRecipientName())
                .phoneNumber(newAddress.getPhoneNumber())
                .street(newAddress.getStreet())
                .city(newAddress.getCity())
                .email(newAddress.getEmail())
                .build();

        account.addAddress(address);
        addressRepository.save(address);

        return DeliveryInfo.builder()
                .recipientName(newAddress.getRecipientName())
                .phoneNumber(newAddress.getPhoneNumber())
                .street(newAddress.getStreet())
                .city(newAddress.getCity())
                .email(newAddress.getEmail())
                .deliveryMethod(DeliveryMethod.STANDARD)
                .build();
    }

    throw new WebException(ErrorCode.ADDRESS_REQUIRED);
}
```

### 1.3 Sơ Đồ Sequence - Place Order

```
┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐
│  User   │  │ CartPage │  │ CheckoutFlow │  │ useOrder │  │ orderApi        │  │ OrderController│  │ OrderService   │
└────┬────┘  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └────────┬────────┘  └───────┬────────┘  └───────┬────────┘
     │            │               │               │                 │                   │                   │
     │ Click      │               │               │                 │                   │                   │
     │ Checkout   │               │               │                 │                   │                   │
     │───────────>│               │               │                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │            │ Validate cart │               │                 │                   │                   │
     │            │ Navigate to   │               │                 │                   │                   │
     │            │ /checkout     │               │                 │                   │                   │
     │            │──────────────>│               │                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │ Fill       │               │               │                 │                   │                   │
     │ shipping   │               │               │                 │                   │                   │
     │ form       │               │               │                 │                   │                   │
     │────────────────────────────>               │                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │ handleShipping│                 │                   │                   │
     │            │               │ Submit()      │                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │ calculate     │                 │                   │                   │
     │            │               │ ShippingFee() │                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │ createOrReuse │                 │                   │                   │
     │            │               │ Order()       │                 │                   │                   │
     │            │               │──────────────>│                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │               │ createCartOrder │                   │                   │
     │            │               │               │ (request)       │                   │                   │
     │            │               │               │────────────────>│                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │               │                 │ POST /order/cart  │                   │
     │            │               │               │                 │ {accountId,       │                   │
     │            │               │               │                 │  cartItemIds,     │                   │
     │            │               │               │                 │  newAddress}      │                   │
     │            │               │               │                 │──────────────────>│                   │
     │            │               │               │                 │                   │                   │
     │            │               │               │                 │                   │ placeCartOrder()  │
     │            │               │               │                 │                   │──────────────────>│
     │            │               │               │                 │                   │                   │
     │            │               │               │                 │                   │                   │ 1. Find Account
     │            │               │               │                 │                   │                   │ 2. Resolve DeliveryInfo
     │            │               │               │                 │                   │                   │ 3. Create Order
     │            │               │               │                 │                   │                   │ 4. Get CartItems
     │            │               │               │                 │                   │                   │ 5. Create OrderItems
     │            │               │               │                 │                   │                   │ 6. Reduce stock
     │            │               │               │                 │                   │                   │ 7. Save Order
     │            │               │               │                 │                   │                   │ 8. Remove CartItems
     │            │               │               │                 │                   │                   │
     │            │               │               │                 │                   │ OrderResponse     │
     │            │               │               │                 │                   │<──────────────────│
     │            │               │               │                 │                   │                   │
     │            │               │               │                 │ ApiResponse       │                   │
     │            │               │               │                 │ {result: order}   │                   │
     │            │               │               │                 │<──────────────────│                   │
     │            │               │               │                 │                   │                   │
     │            │               │               │ response        │                   │                   │
     │            │               │               │<────────────────│                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │ setOrderId()  │                 │                   │                   │
     │            │               │ setCurrentStep│                 │                   │                   │
     │            │               │ ('payment')   │                 │                   │                   │
     │            │               │<──────────────│                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │ Select     │               │               │                 │                   │                   │
     │ payment    │               │               │                 │                   │                   │
     │ method     │               │               │                 │                   │                   │
     │────────────────────────────>               │                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │ Process       │                 │                   │                   │
     │            │               │ payment       │                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │            │               │ Navigate to   │                 │                   │                   │
     │            │               │ /order-success│                 │                   │                   │
     │            │               │               │                 │                   │                   │
     │ Order      │               │               │                 │                   │                   │
     │ Success    │               │               │                 │                   │                   │
     │ Page       │               │               │                 │                   │                   │
     │<────────────────────────────               │                 │                   │                   │
```

---


## Use Case 2: Add Product to Cart

### 2.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductCard → useCart().addToCart() → cartItemApi.addToCart() → Response       │
│       ↓              ↓                        ↓                    ↓            │
│  Click "Add"   Build payload           POST /cartItem        guestUuid          │
│                {productId,                                        ↓             │
│                 quantity,                                  localStorage.set     │
│                 accountId?}                                       ↓             │
│                                                            fetchCart(true)      │
│                                                                   ↓             │
│                                                            showNotification     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  CartItemController → CartItemService → Repositories                             │
│         ↓                    ↓               ↓                                  │
│  POST /cartItem      addProductToCart   Cart, Product, CartItem                 │
│  + Cookie            handleGuestCart    Set-Cookie: GUEST_CART_ID               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - ProductCard Component
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
    e.stopPropagation();  // Ngăn event bubble lên Card
    if (isOutOfStock || adding) return;
    
    setAdding(true);
    try {
      await addToCart(product.id, 1, product.name);
    } catch (err) {
      console.error("error adding to cart", err);
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
      <Button 
        onClick={handleAddToCart} 
        disabled={isOutOfStock || adding}
      >
        <ShoppingCart /> {adding ? "Adding..." : "Add"}
      </Button>
    </Card>
  );
}
```

#### B. Frontend - CartContext (Core Logic)
**File:** `src/context/CartContext.tsx` (dòng 260-310)

```typescript
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [currentOrder, setCurrentOrderState] = useState<LocalCart>({ items: [] });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const { user } = useAuth();

  // Thêm sản phẩm vào giỏ hàng
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
      const guestUuid = response?.data?.result?.guestUuid;
      if (guestUuid && !user?.sub) {
        localStorage.setItem("GUEST_CART_ID", guestUuid);
        console.log("[CartContext] Saved guestUuid to localStorage:", guestUuid);
      }

      // 4. Lấy product name từ response nếu không truyền vào
      const name = productName || response?.data?.result?.product?.name || 'Product';

      // 5. Fetch lại cart từ server để đồng bộ state
      await fetchCart(true);

      // 6. Hiển thị notification thành công
      showNotification("success", CART_MESSAGES.ADD_SUCCESS(quantity, name));
      
    } catch (err: any) {
      console.error("addToCart failed", err);

      if (axios.isAxiosError(err) && err.response?.status === 404) {
        showNotification("error", CART_MESSAGES.API_NOT_FOUND);
      } else {
        showNotification("error", CART_MESSAGES.ADD_FAILED);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart từ API
  const fetchCart = async (force = false) => {
    const params = buildCartQueryParams();  // accountId hoặc guestUuid
    const resp = await cartItemApi.getCartItems(params ?? {});
    const items = normalizeItems(resp?.data?.result ?? []);
    setCurrentOrderState({ items, ...computeTotals(items) });
    setSelectedItemIds(items.map((it) => it.id));
  };

  return (
    <CartContext.Provider value={{
      currentOrder, selectedItemIds, fetchCart, addToCart,
      updateCartItemQuantity, removeCartItem, ...
    }}>
      {children}
    </CartContext.Provider>
  );
};
```

#### C. Frontend - Cart API Service
**File:** `src/services/carts/cartApi.ts` (dòng 15-40)

```typescript
export const cartItemApi = {
  // POST /cartItem - Thêm sản phẩm vào giỏ hàng
  addToCart: (data: CartItemRequestDTO) => 
    api.post("/cartItem", data),

  // GET /cartItem/list - Lấy danh sách cart items
  getCartItems: (params: { accountId?: string; guestUuid?: string }) =>
    api.get("/cartItem/list", { params }),

  // PUT /cartItem/{id} - Cập nhật số lượng
  updateCartItem: (id: string, data: { quantity: number }) =>
    api.put(`/cartItem/${id}`, data),

  // DELETE /cartItem/{id} - Xóa item khỏi giỏ
  deleteCartItem: (id: string) =>
    api.delete(`/cartItem/${id}`),
};
```

#### D. Backend - CartItemController
**File:** `controller/CartItemController.java` (dòng 50-110)

```java
@RestController
@RequestMapping("/cartItem")
@RequiredArgsConstructor
public class CartItemController {

    private final CartItemService cartItemService;

    @PostMapping
    ApiResponse<CartItemResponse> addProductToCart(
        @CookieValue(name = "GUEST_CART_ID", required = false) String guestUuidFromCookie,
        @RequestBody CartItemRequest cartItemRequest,
        HttpServletResponse response) {
        
        // 1. Nếu không có accountId, sử dụng guestUuid từ cookie
        if ((cartItemRequest.getAccountId() == null || cartItemRequest.getAccountId().isBlank())) {
            cartItemRequest.setGuestUuid(guestUuidFromCookie);
        }

        // 2. Gọi service xử lý
        CartItemResponse saved = cartItemService.addProductToCart(cartItemRequest);

        // 3. Set cookie GUEST_CART_ID nếu là guest mới
        if (saved.getGuestUuid() != null &&
                (guestUuidFromCookie == null || guestUuidFromCookie.isBlank())) {
            String cookieValue = String.format(
                "GUEST_CART_ID=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Lax",
                saved.getGuestUuid(),
                60 * 60 * 24 * 30  // 30 ngày
            );
            response.addHeader("Set-Cookie", cookieValue);
        }

        return ApiResponse.<CartItemResponse>builder()
                .result(saved)
                .build();
    }

    @GetMapping("/list")
    ApiResponse<List<CartItemResponse>> getCartItemList(
        @RequestParam(name = "accountId", required = false) String accountId,
        @RequestParam(name = "guestUuid", required = false) String guestUuid,
        @CookieValue(name = "GUEST_CART_ID", required = false) String guestUuidFromCookie) {
        
        // Ưu tiên: accountId > guestUuid param > cookie
        String effectiveGuestUuid = guestUuid;
        if ((accountId == null || accountId.isBlank()) && 
            (guestUuid == null || guestUuid.isBlank()) && 
            guestUuidFromCookie != null && !guestUuidFromCookie.isBlank()) {
            effectiveGuestUuid = guestUuidFromCookie;
        }
        
        List<CartItemResponse> items = cartItemService.getAllCartItems(accountId, effectiveGuestUuid);

        return ApiResponse.<List<CartItemResponse>>builder()
                .result(items)
                .build();
    }
}
```

#### E. Backend - CartItemService
**File:** `service/CartItemService.java` (dòng 40-125)

```java
@Service
@RequiredArgsConstructor
public class CartItemService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CartItemMapper cartItemMapper;

    public CartItemResponse addProductToCart(CartItemRequest cartItemRequest) {
        String accountId = cartItemRequest.getAccountId();
        String guestUuid = cartItemRequest.getGuestUuid();

        Cart cart;

        // 1. Xác định Cart: Account hoặc Guest
        if(accountId != null && !accountId.isBlank()) {
            // Logged-in user: tìm cart theo accountId
            cart = cartRepository.findByAccountId(accountId)
                    .orElseThrow(() -> new WebException(ErrorCode.CART_NOT_FOUND));
        } else {
            // Guest: tạo hoặc tìm cart theo guestUuid
            cart = handleGuestCart(guestUuid);
        }

        // 2. Tìm Product
        String productId = cartItemRequest.getProductId();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new WebException(ErrorCode.PRODUCT_NOT_FOUND));

        // 3. Tính toán quantity và price
        int stock = product.getStock();
        int quantity = Math.min(stock, cartItemRequest.getQuantity());  // Không vượt quá stock
        double unitPrice = product.getPrice();
        double totalPrice = quantity * unitPrice;

        String cartId = cart.getId();
        CartItem cartItem;

        // 4. Kiểm tra sản phẩm đã có trong cart chưa
        if(cartItemRepository.existsByCartIdAndProductId(cartId, productId)) {
            // Đã có: Update quantity (cộng dồn)
            cartItem = cartItemRepository.findByCartIdAndProductId(cartId, productId);
            cartItem.setQuantity(Math.min(stock, cartItem.getQuantity() + quantity));
            cartItem.setUnitPrice(unitPrice);
            cartItem.calTotalPrice();
            cartItem.setUpdatedAt(LocalDateTime.now());
            cartItem.getTotalWeight();
            cartItem.setCart(cart);
        } else {
            // Chưa có: Tạo mới CartItem
            cartItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .quantity(quantity)
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .totalWeight(quantity * product.getWeight())
                .build();
        }

        // 5. Thêm vào cart và lưu
        cart.addItem(cartItem);
        CartItem savedCartItem = cartItemRepository.save(cartItem);

        return cartItemMapper.toCartItemResponse(savedCartItem);
    }

    // Guest Cart Handler
    private Cart handleGuestCart(String guestUuid) {
        // Nếu có guestUuid: tìm hoặc tạo cart
        if(guestUuid != null && !guestUuid.isBlank()) {
            return cartRepository.findByGuestUuid(guestUuid)
                    .orElseGet(() -> {
                        Cart newCart = Cart.builder()
                                .guestUuid(guestUuid)
                                .createdDate(LocalDateTime.now())
                                .build();
                        return cartRepository.save(newCart);
                    });
        }

        // Không có guestUuid: tạo UUID mới
        String newGuestUuid = UUID.randomUUID().toString();
        Cart cart = Cart.builder()
                .guestUuid(newGuestUuid)
                .createdDate(LocalDateTime.now())
                .build();

        return cartRepository.save(cart);
    }
}
```

### 2.3 Xử Lý Guest vs Logged-in User

| Trường hợp | accountId | guestUuid | Hành vi Backend | Hành vi Frontend |
|------------|-----------|-----------|-----------------|------------------|
| Logged-in | `user.sub` | - | Tìm cart theo accountId | Gửi accountId trong payload |
| Guest lần đầu | - | - | Tạo guestUuid mới, set cookie | Lưu guestUuid vào localStorage |
| Guest đã có cookie | - | từ cookie | Tìm cart theo guestUuid | Không cần gửi, BE đọc từ cookie |

### 2.4 Sơ Đồ Sequence - Add To Cart

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────────────┐     ┌─────────────────┐
│  User   │     │ ProductCard │     │ CartContext │     │ cartItemApi │     │ CartItemController │     │ CartItemService │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └─────────┬──────────┘     └────────┬────────┘
     │                 │                   │                   │                      │                         │
     │ Click "Add"     │                   │                   │                      │                         │
     │────────────────>│                   │                   │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │ setAdding(true)   │                   │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │ addToCart(        │                   │                      │                         │
     │                 │   productId,      │                   │                      │                         │
     │                 │   1,              │                   │                      │                         │
     │                 │   productName)    │                   │                      │                         │
     │                 │──────────────────>│                   │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │ setLoading(true)  │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │ Build payload:    │                      │                         │
     │                 │                   │ { productId,      │                      │                         │
     │                 │                   │   quantity,       │                      │                         │
     │                 │                   │   accountId? }    │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │ addToCart(payload)│                      │                         │
     │                 │                   │──────────────────>│                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │                   │ POST /cartItem       │                         │
     │                 │                   │                   │ + Cookie: GUEST_ID   │                         │
     │                 │                   │                   │─────────────────────>│                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │                   │                      │ addProductToCart()      │
     │                 │                   │                   │                      │────────────────────────>│
     │                 │                   │                   │                      │                         │
     │                 │                   │                   │                      │                         │ 1. Xác định Cart
     │                 │                   │                   │                      │                         │    (Account/Guest)
     │                 │                   │                   │                      │                         │ 2. Tìm Product
     │                 │                   │                   │                      │                         │ 3. Check exists?
     │                 │                   │                   │                      │                         │    → Update/Create
     │                 │                   │                   │                      │                         │ 4. Save CartItem
     │                 │                   │                   │                      │                         │
     │                 │                   │                   │                      │ CartItemResponse        │
     │                 │                   │                   │                      │ { id, guestUuid,        │
     │                 │                   │                   │                      │   product, qty, ... }   │
     │                 │                   │                   │                      │<────────────────────────│
     │                 │                   │                   │                      │                         │
     │                 │                   │                   │ ApiResponse          │                         │
     │                 │                   │                   │ + Set-Cookie:        │                         │
     │                 │                   │                   │   GUEST_CART_ID=xxx  │                         │
     │                 │                   │                   │<─────────────────────│                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │ response          │                      │                         │
     │                 │                   │<──────────────────│                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │ [If Guest]        │                      │                         │
     │                 │                   │ localStorage.set( │                      │                         │
     │                 │                   │   "GUEST_CART_ID",│                      │                         │
     │                 │                   │   guestUuid)      │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │ fetchCart(true)   │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │                   │ showNotification( │                      │                         │
     │                 │                   │   "success",      │                      │                         │
     │                 │                   │   "Added 1...")   │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │ Promise resolved  │                   │                      │                         │
     │                 │<──────────────────│                   │                      │                         │
     │                 │                   │                   │                      │                         │
     │                 │ setAdding(false)  │                   │                      │                         │
     │                 │                   │                   │                      │                         │
     │ Toast: "Added   │                   │                   │                      │                         │
     │ 1 Product to    │                   │                   │                      │                         │
     │ cart"           │                   │                   │                      │                         │
     │<────────────────│                   │                   │                      │                         │
```

---


## Use Case 3: Pay Order (VietQR)

### 3.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PaymentMethodSelector → VietQRPayment → paymentApi → QR Code Display           │
│         ↓                      ↓              ↓              ↓                  │
│  Select VietQR          handlePayOrder   POST /viet-qr   Show QR Image          │
│                                ↓                              ↓                  │
│                         User scans QR                  Polling verify           │
│                                ↓                              ↓                  │
│                         handleVerify              GET /viet-qr/verify           │
│                                ↓                              ↓                  │
│                         SUCCESS → Navigate to OrderSuccess                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PayOrderController → PaymentService → IQrPayment                                │
│         ↓                    ↓              ↓                                   │
│  POST /viet-qr        generateQrCode   VietQR API                               │
│  GET /verify          verifyPayment    Check status                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - PaymentMethodSelector
**File:** `src/components/payment/PaymentMethodSelector.tsx`

```typescript
export function PaymentMethodSelector({ orderId, amount }: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  return (
    <Card className="p-6">
      <h2>Select Payment Method</h2>
      
      <div className="space-y-4">
        {/* VietQR Option */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            selectedMethod === 'vietqr' ? 'border-teal-500 bg-teal-50' : ''
          }`}
          onClick={() => setSelectedMethod('vietqr')}
        >
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" />
            <div>
              <h3>VietQR</h3>
              <p className="text-sm text-gray-500">Scan QR code to pay</p>
            </div>
          </div>
        </div>

        {/* Credit Card Option */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            selectedMethod === 'creditcard' ? 'border-teal-500 bg-teal-50' : ''
          }`}
          onClick={() => setSelectedMethod('creditcard')}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <div>
              <h3>Credit Card (PayPal)</h3>
              <p className="text-sm text-gray-500">Pay with Visa, Mastercard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Render selected payment component */}
      {selectedMethod === 'vietqr' && (
        <VietQRPayment orderId={orderId} amount={amount} />
      )}
      {selectedMethod === 'creditcard' && (
        <CreditCardPayment orderId={orderId} amount={amount} />
      )}
    </Card>
  );
}
```

#### B. Frontend - VietQRPayment Component
**File:** `src/components/payment/VietQRPayment.tsx`

```typescript
export function VietQRPayment({ orderId, amount }: VietQRPaymentProps) {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  // Tạo QR code khi component mount
  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true);
      try {
        const transactionInfo = handlePayOrder(orderId);
        setQrCode(transactionInfo.qrCodeString);
        
        // Bắt đầu polling verify
        startPolling();
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateQR();
  }, [orderId]);

  // Polling verify payment status
  const startPolling = () => {
    const interval = setInterval(async () => {
      const result = await handleVerifyPayment(orderId);
      
      if (result === 'SUCCESS') {
        setStatus('success');
        clearInterval(interval);
        navigate('/order-success', { state: { orderId } });
      } else if (result === 'FAILED') {
        setStatus('failed');
        clearInterval(interval);
      }
    }, 3000);  // Poll every 3 seconds
  };

  return (
    <div className="text-center p-6">
      <h3>Scan QR Code to Pay</h3>
      <p className="text-2xl font-bold text-teal-600">
        {amount.toLocaleString('vi-VN')} VND
      </p>
      
      {isLoading ? (
        <Spinner />
      ) : qrCode ? (
        <div className="my-6">
          <QRCodeSVG value={qrCode} size={256} />
        </div>
      ) : null}

      <p className="text-sm text-gray-500">
        {status === 'pending' && 'Waiting for payment...'}
        {status === 'success' && 'Payment successful!'}
        {status === 'failed' && 'Payment failed. Please try again.'}
      </p>
    </div>
  );
}
```

#### C. Frontend - Payment API Service
**File:** `src/services/paymentApi.ts` (dòng 15-60)

```typescript
// Khởi tạo transaction và tạo QR code
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

// Verify payment status (polling)
export const handleVerifyPayment = async (transactionID: string): Promise<PaymentStatus> => {
  try {
    const response = await api.get(`/payOrder/viet-qr/verify/${transactionID}`);
    return response.data.result;  // 'SUCCESS' | 'PENDING' | 'FAILED'
  } catch (error) {
    console.error('Verify payment failed:', error);
    return 'PENDING';
  }
};

// Types
export interface ITransactionInfo {
  transactionID: string;
  content: string;
  dateTime: Date;
  paymentStatus: 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED';
  qrCodeString: string;
}

export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
```

#### D. Backend - PayOrderController
**File:** `controller/PayOrderController.java` (dòng 35-52)

```java
@RestController
@RequestMapping("/payOrder")
@RequiredArgsConstructor
public class PayOrderController {

    private final PaymentService service;

    // Tạo QR code thanh toán
    @PostMapping("/viet-qr")
    public ApiResponse<String> payOrder(@RequestBody @Valid PayOrderRequest request) {
        String qrCode = service.generateQrCode(
                request.getOrderId(),
                request.getAmount());

        return ApiResponse.<String>builder()
                .result(qrCode)
                .build();
    }

    // Verify payment status
    @GetMapping("/viet-qr/verify/{orderId}")
    public ApiResponse<String> verify(@PathVariable String orderId) {
        return ApiResponse.<String>builder()
                .result(service.verifyPayment(orderId))
                .build();
    }
}
```

#### E. Backend - PaymentService
**File:** `service/PaymentService.java` (dòng 20-45)

```java
@Service
@Slf4j
public class PaymentService {

    private final IQrPayment qrPayment;      // VietQR implementation
    private final IPayment credPayment;       // PayPal implementation

    public PaymentService(IQrPayment qrPayment, IPayment credPayment) {
        this.qrPayment = qrPayment;
        this.credPayment = credPayment;
    }

    public String generateQrCode(String orderId, Integer amount) {
        if (amount <= 0) {
            throw new WebException(ErrorCode.INVALID_PRICE);
        }
        log.info("Generating QR code for order: {} with amount: {}", orderId, amount);
        return qrPayment.generateQrCode(orderId, amount);
    }

    public String verifyPayment(String orderId) {
        log.info("Verifying payment for order: {}", orderId);
        // Mock: Trả về SUCCESS để frontend chuyển trang
        // Thực tế: Kiểm tra trạng thái từ VietQR API
        return "SUCCESS";
    }
}
```

#### F. Backend - IQrPayment Interface
**File:** `payment/IQrPayment.java`

```java
public interface IQrPayment {
    /**
     * Generate QR code string for payment
     * @param orderId Order ID
     * @param amount Payment amount in VND
     * @return QR code string
     */
    String generateQrCode(String orderId, Integer amount);
}
```

### 3.3 Sơ Đồ Sequence - Pay Order (VietQR)

```
┌─────────┐  ┌────────────────────┐  ┌───────────────┐  ┌──────────────────┐  ┌────────────────┐  ┌────────────┐
│  User   │  │PaymentMethodSelector│  │VietQRPayment │  │ PayOrderController│  │ PaymentService │  │ IQrPayment │
└────┬────┘  └─────────┬──────────┘  └───────┬───────┘  └────────┬─────────┘  └───────┬────────┘  └─────┬──────┘
     │                 │                     │                   │                    │                 │
     │ Select VietQR   │                     │                   │                    │                 │
     │────────────────>│                     │                   │                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │ Render              │                   │                    │                 │
     │                 │ VietQRPayment       │                   │                    │                 │
     │                 │────────────────────>│                   │                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ useEffect:        │                    │                 │
     │                 │                     │ generateQR()      │                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ POST /payOrder/   │                    │                 │
     │                 │                     │ viet-qr           │                    │                 │
     │                 │                     │ {orderId, amount} │                    │                 │
     │                 │                     │──────────────────>│                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │                   │ generateQrCode()   │                 │
     │                 │                     │                   │───────────────────>│                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │                   │                    │ generateQrCode()│
     │                 │                     │                   │                    │────────────────>│
     │                 │                     │                   │                    │                 │
     │                 │                     │                   │                    │ QR Code String  │
     │                 │                     │                   │                    │<────────────────│
     │                 │                     │                   │                    │                 │
     │                 │                     │                   │ QR Code String     │                 │
     │                 │                     │                   │<───────────────────│                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ ApiResponse       │                    │                 │
     │                 │                     │ {result: qrCode}  │                    │                 │
     │                 │                     │<──────────────────│                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ setQrCode()       │                    │                 │
     │                 │                     │ Display QR Image  │                    │                 │
     │                 │                     │                   │                    │                 │
     │ Scan QR Code    │                     │                   │                    │                 │
     │ with Bank App   │                     │                   │                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ startPolling()    │                    │                 │
     │                 │                     │ setInterval(3s)   │                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ GET /payOrder/    │                    │                 │
     │                 │                     │ viet-qr/verify/   │                    │                 │
     │                 │                     │ {orderId}         │                    │                 │
     │                 │                     │──────────────────>│                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │                   │ verifyPayment()    │                 │
     │                 │                     │                   │───────────────────>│                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │                   │ "SUCCESS"          │                 │
     │                 │                     │                   │<───────────────────│                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ ApiResponse       │                    │                 │
     │                 │                     │ {result: SUCCESS} │                    │                 │
     │                 │                     │<──────────────────│                    │                 │
     │                 │                     │                   │                    │                 │
     │                 │                     │ clearInterval()   │                    │                 │
     │                 │                     │ setStatus(success)│                    │                 │
     │                 │                     │ navigate(         │                    │                 │
     │                 │                     │   /order-success) │                    │                 │
     │                 │                     │                   │                    │                 │
     │ Order Success   │                     │                   │                    │                 │
     │ Page            │                     │                   │                    │                 │
     │<────────────────────────────────────────                  │                    │                 │
```

---

## Use Case 4: Pay Order by Credit Card

### 4.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PaymentMethodSelector → CreditCardPayment → paymentApi → Process Result        │
│         ↓                       ↓                ↓              ↓               │
│  Select Credit Card      Fill card info    POST /paypal   Success/Failed        │
│                                ↓                              ↓                  │
│                          handleSubmit              Navigate to OrderSuccess      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PayOrderController → PaymentService → IPayment (PayPal)                         │
│         ↓                    ↓              ↓                                   │
│  POST /paypal      payOrderByCreditCard  PayPal API                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - CreditCardPayment Component
**File:** `src/components/payment/CreditCardPayment.tsx`

```typescript
export function CreditCardPayment({ orderId, amount }: CreditCardPaymentProps) {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const success = await handleProcessCreditCardPayment(orderId, cardInfo);
      
      if (success) {
        showNotification('success', 'Payment successful!');
        navigate('/order-success', { state: { orderId } });
      } else {
        showNotification('error', 'Payment failed. Please try again.');
      }
    } catch (error) {
      showNotification('error', 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Card Number</Label>
        <Input
          placeholder="1234 5678 9012 3456"
          value={cardInfo.cardNumber}
          onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Expiry Date</Label>
          <Input
            placeholder="MM/YY"
            value={cardInfo.expiryDate}
            onChange={(e) => setCardInfo({ ...cardInfo, expiryDate: e.target.value })}
          />
        </div>
        <div>
          <Label>CVV</Label>
          <Input
            type="password"
            placeholder="123"
            value={cardInfo.cvv}
            onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Cardholder Name</Label>
        <Input
          placeholder="NGUYEN VAN A"
          value={cardInfo.cardholderName}
          onChange={(e) => setCardInfo({ ...cardInfo, cardholderName: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isProcessing} className="w-full">
        {isProcessing ? 'Processing...' : `Pay ${amount.toLocaleString('vi-VN')} VND`}
      </Button>
    </form>
  );
}
```

#### B. Frontend - Payment API (Credit Card)
**File:** `src/services/paymentApi.ts`

```typescript
// Process credit card payment via PayPal
export const handleProcessCreditCardPayment = async (
  orderID: string,
  cardInfo: CardInfo
): Promise<boolean> => {
  try {
    const response = await api.post('/payOrder/paypal', {
      orderId: orderID,
      ...cardInfo,
    });
    return response.data.result === 'SUCCESS';
  } catch (error) {
    console.error('Credit card payment failed:', error);
    return false;
  }
};
```

#### C. Backend - PayOrderController (PayPal)
**File:** `controller/PayOrderController.java` (dòng 54-59)

```java
@PostMapping("/paypal")
public ApiResponse<String> processCreditCardPayment(@RequestBody Map<String, Object> request) {
    return ApiResponse.<String>builder()
            .result(service.payOrderByCreditCard(request))
            .build();
}
```

#### D. Backend - PaymentService (Credit Card)
**File:** `service/PaymentService.java`

```java
public String payOrderByCreditCard(Map<String, Object> info) {
    String orderId = (String) info.get("orderId");
    log.info("Processing credit card payment for order: {}", orderId);
    return credPayment.payOrder(orderId);
}
```

#### E. Backend - IPayment Interface
**File:** `payment/IPayment.java`

```java
public interface IPayment {
    /**
     * Process payment for an order
     * @param orderId Order ID
     * @return Payment result: "SUCCESS" or "FAILED"
     */
    String payOrder(String orderId);
}
```

### 4.3 Sơ Đồ Sequence - Pay Order by Credit Card

```
┌─────────┐  ┌───────────────────┐  ┌──────────────────┐  ┌────────────────┐  ┌──────────┐
│  User   │  │CreditCardPayment  │  │ PayOrderController│  │ PaymentService │  │ IPayment │
└────┬────┘  └─────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘  └────┬─────┘
     │                 │                     │                    │                 │
     │ Fill card info  │                     │                    │                 │
     │────────────────>│                     │                    │                 │
     │                 │                     │                    │                 │
     │ Click Pay       │                     │                    │                 │
     │────────────────>│                     │                    │                 │
     │                 │                     │                    │                 │
     │                 │ setIsProcessing     │                    │                 │
     │                 │ (true)              │                    │                 │
     │                 │                     │                    │                 │
     │                 │ POST /payOrder/     │                    │                 │
     │                 │ paypal              │                    │                 │
     │                 │ {orderId, cardInfo} │                    │                 │
     │                 │────────────────────>│                    │                 │
     │                 │                     │                    │                 │
     │                 │                     │ payOrderBy         │                 │
     │                 │                     │ CreditCard()       │                 │
     │                 │                     │───────────────────>│                 │
     │                 │                     │                    │                 │
     │                 │                     │                    │ payOrder()      │
     │                 │                     │                    │────────────────>│
     │                 │                     │                    │                 │
     │                 │                     │                    │                 │ Call PayPal API
     │                 │                     │                    │                 │
     │                 │                     │                    │ "SUCCESS"       │
     │                 │                     │                    │<────────────────│
     │                 │                     │                    │                 │
     │                 │                     │ "SUCCESS"          │                 │
     │                 │                     │<───────────────────│                 │
     │                 │                     │                    │                 │
     │                 │ ApiResponse         │                    │                 │
     │                 │ {result: SUCCESS}   │                    │                 │
     │                 │<────────────────────│                    │                 │
     │                 │                     │                    │                 │
     │                 │ showNotification    │                    │                 │
     │                 │ ('success')         │                    │                 │
     │                 │                     │                    │                 │
     │                 │ navigate(           │                    │                 │
     │                 │   /order-success)   │                    │                 │
     │                 │                     │                    │                 │
     │ Order Success   │                     │                    │                 │
     │ Page            │                     │                    │                 │
     │<────────────────│                     │                    │                 │
```

---


## Use Case 5: Select Delivery Method

### 5.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  CheckoutFlow → ShippingForm → calculateShippingFee() → OrderSummary            │
│       ↓              ↓                  ↓                    ↓                  │
│  currentStep   Fill form data    Compute fee based on:   Display fee            │
│  = 'shipping'  - fullName        - Province (urban/rural)                       │
│                - phoneNumber     - Weight                                        │
│                - email           - Order value (discount)                        │
│                - address                                                         │
│                - province ←──────────────────────────────────┘                  │
│                - deliveryMethod                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Included in Order Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  DeliveryInfo Entity stores: recipientName, phoneNumber, email, street, city,   │
│  deliveryMethod (STANDARD, EXPRESS, SAME_DAY), deliveryFee                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - ShippingForm Component
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
      onSubmit(formData);
    } else {
      notify("error", "Please correct the highlighted errors in the shipping form.");
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        {/* Full Name Input */}
        <div>
          <Label>Full Name *</Label>
          <Input
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
          />
          {errors.fullName && <span className="text-red-500">{errors.fullName}</span>}
        </div>

        {/* Phone Number Input */}
        <div>
          <Label>Phone Number *</Label>
          <Input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
          />
        </div>

        {/* Email Input */}
        <div>
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.Email}
            onChange={(e) => handleChange('Email', e.target.value)}
          />
        </div>

        {/* Province Select - QUAN TRỌNG cho tính phí ship */}
        <div>
          <Label>Province/City *</Label>
          <Select
            value={formData.province}
            onValueChange={(value) => handleChange('province', value)}
          >
            {PROVINCES.map((province) => (
              <SelectItem key={province} value={province}>{province}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Address Input */}
        <div>
          <Label>Address *</Label>
          <Input
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>

        {/* Delivery Method Select */}
        <div>
          <Label>Delivery Method *</Label>
          <Select
            value={formData.deliveryMethod}
            onValueChange={(value) => handleChange('deliveryMethod', value)}
          >
            {DELIVERY_METHODS.map((method) => (
              <SelectItem key={method} value={method}>{method}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Note (Optional) */}
        <div>
          <Label>Note (Optional)</Label>
          <Textarea
            value={formData.note || ''}
            onChange={(e) => handleChange('note', e.target.value)}
          />
        </div>

        {/* Shipping Fee Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium">📦 Shipping Fee Information</h4>
          <p><strong>Hanoi & Ho Chi Minh City:</strong></p>
          <p>• 22,000 VND for first 3kg</p>
          <p>• 2,500 VND per additional 0.5kg</p>
          <p><strong>Other Provinces:</strong></p>
          <p>• 30,000 VND for first 0.5kg</p>
          <p>• 2,500 VND per additional 0.5kg</p>
          <p className="text-green-700 mt-2">
            🎁 Orders over 100,000 VND qualify for up to 25,000 VND discount!
          </p>
        </div>

        <Button type="submit" className="w-full mt-4">
          Continue to Payment
        </Button>
      </form>
    </Card>
  );
}
```

#### B. Frontend - Calculate Shipping Fee Logic
**File:** `src/pages/Checkout/CheckoutFlow.tsx` (dòng 60-90)

```typescript
// Tính phí ship theo tỉnh/thành
const calculateShippingFee = (province: string, weight: number, orderValue: number): number => {
  const isUrban = ['Hanoi', 'Ho Chi Minh City'].includes(province);
  let baseFee: number;
  let additionalFee: number;

  if (isUrban) {
    // Hà Nội / HCM: 22,000đ cho 3kg đầu
    baseFee = 22000;
    const extraWeight = Math.max(0, weight - 3);
    additionalFee = Math.ceil(extraWeight / 0.5) * 2500;  // 2,500đ/0.5kg thêm
  } else {
    // Tỉnh khác: 30,000đ cho 0.5kg đầu
    baseFee = 30000;
    const extraWeight = Math.max(0, weight - 0.5);
    additionalFee = Math.ceil(extraWeight / 0.5) * 2500;  // 2,500đ/0.5kg thêm
  }

  let totalFee = baseFee + additionalFee;

  // Giảm phí ship cho đơn > 100,000đ
  if (orderValue >= 100000) {
    totalFee = Math.max(0, totalFee - 25000);
  }

  return totalFee;
};
```

#### C. Frontend - Constants
**File:** `src/constants/provinces.ts`

```typescript
export const PROVINCES = [
  'Hanoi',
  'Ho Chi Minh City',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  'Bien Hoa',
  'Hue',
  'Nha Trang',
  'Vung Tau',
  'Quang Ninh',
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

#### D. Backend - DeliveryMethod Enum
**File:** `enums/DeliveryMethod.java`

```java
public enum DeliveryMethod {
    STANDARD,    // Giao hàng tiêu chuẩn
    EXPRESS,     // Giao hàng nhanh
    SAME_DAY     // Giao trong ngày
}
```

#### E. Backend - DeliveryInfo Entity
**File:** `entity/DeliveryInfo.java`

```java
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String recipientName;
    private String phoneNumber;
    private String email;
    private String street;
    private String city;
    
    @Enumerated(EnumType.STRING)
    private DeliveryMethod deliveryMethod;
    
    private Double deliveryFee;
}
```

### 5.3 Công Thức Tính Phí Ship

| Khu vực | Phí cơ bản | Phí thêm | Giảm giá |
|---------|------------|----------|----------|
| Hà Nội / HCM | 22,000đ (3kg đầu) | 2,500đ / 0.5kg | -25,000đ nếu đơn > 100,000đ |
| Tỉnh khác | 30,000đ (0.5kg đầu) | 2,500đ / 0.5kg | -25,000đ nếu đơn > 100,000đ |

### 5.4 Sơ Đồ Sequence - Select Delivery Method

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  User   │     │ CheckoutFlow │     │ ShippingForm │     │ OrderSummary│
└────┬────┘     └──────┬───────┘     └──────┬───────┘     └──────┬──────┘
     │                 │                    │                    │
     │ Navigate to     │                    │                    │
     │ /checkout       │                    │                    │
     │────────────────>│                    │                    │
     │                 │                    │                    │
     │                 │ Render             │                    │
     │                 │ ShippingForm       │                    │
     │                 │───────────────────>│                    │
     │                 │                    │                    │
     │ Fill fullName   │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │ Fill phone      │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │ Fill email      │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │ Select province │                    │                    │
     │ (e.g. Hanoi)    │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │                 │                    │ handleChange()     │
     │                 │                    │ setFormData()      │
     │                 │                    │                    │
     │ Fill address    │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │ Select delivery │                    │                    │
     │ method          │                    │                    │
     │ (Standard)      │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │ Click "Continue │                    │                    │
     │ to Payment"     │                    │                    │
     │─────────────────────────────────────>│                    │
     │                 │                    │                    │
     │                 │                    │ validateForm()     │
     │                 │                    │                    │
     │                 │                    │ onSubmit(formData) │
     │                 │ handleShipping     │                    │
     │                 │ Submit(data)       │                    │
     │                 │<───────────────────│                    │
     │                 │                    │                    │
     │                 │ getSelectedItems   │                    │
     │                 │ Weight()           │                    │
     │                 │                    │                    │
     │                 │ getSelectedItems   │                    │
     │                 │ Total()            │                    │
     │                 │                    │                    │
     │                 │ calculateShipping  │                    │
     │                 │ Fee(province,      │                    │
     │                 │ weight, orderValue)│                    │
     │                 │                    │                    │
     │                 │ Result: 22,000đ    │                    │
     │                 │ (Hanoi, < 3kg,     │                    │
     │                 │  order > 100k      │                    │
     │                 │  → 22k - 25k = 0)  │                    │
     │                 │                    │                    │
     │                 │ setShippingData()  │                    │
     │                 │ (with deliveryFee) │                    │
     │                 │                    │                    │
     │                 │ Update OrderSummary│                    │
     │                 │───────────────────────────────────────>│
     │                 │                    │                    │
     │                 │                    │                    │ Re-render with
     │                 │                    │                    │ new deliveryFee
     │                 │                    │                    │
     │ See updated     │                    │                    │
     │ shipping fee    │                    │                    │
     │<────────────────────────────────────────────────────────│
     │                 │                    │                    │
     │                 │ setCurrentStep     │                    │
     │                 │ ('payment')        │                    │
```

---


## Use Case 6: View Product Details

### 6.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductCard (click) → ProductDetailsPage → useProductDetails → productApi      │
│       ↓                       ↓                    ↓                ↓           │
│  navigate(             Entry point          Fetch product      GET /product/{id}│
│  /products/{id})                            by ID                               │
│                               ↓                    ↓                            │
│                        ProductDetailsView   setProduct()                        │
│                        (render theo type)                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductController → ProductService → ProductRepository                          │
│         ↓                   ↓               ↓                                   │
│  GET /product/{id}   getProductById    findById()                               │
│                             ↓               ↓                                   │
│                      ProductMapper     Product Entity                           │
│                             ↓                                                   │
│                      ProductResponse                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - ProductCard (Navigate)
**File:** `src/components/product/ProductCard.tsx` (dòng 50-55)

```typescript
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Product content */}
    </Card>
  );
}
```

#### B. Frontend - ProductDetailsPage
**File:** `src/pages/ProductDetails/ProductDetailsPage.tsx`

```typescript
export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { product, loading, error } = useProductDetails(id!);
  const { addToCart } = useCart();
  const { showNotification } = useNotification();
  const [quantity, setQuantity] = useState(1);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <NotFound />;

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity, product.name);
      showNotification('success', `Added ${quantity} ${product.name} to cart`);
    } catch (err) {
      showNotification('error', 'Failed to add to cart');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          <ImageWithFallback 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full rounded-lg"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <Badge>{product.type}</Badge>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>
          
          {/* Price */}
          <p className="text-2xl font-bold text-teal-600">
            {product.price.toLocaleString('vi-VN')} VND
          </p>

          {/* Stock Status */}
          {product.stock > 0 ? (
            <Badge variant="success">In Stock ({product.stock})</Badge>
          ) : (
            <Badge variant="destructive">Out of Stock</Badge>
          )}

          {/* Type-specific details */}
          <ProductTypeDetails product={product} />

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <Label>Quantity:</Label>
            <Input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20"
            />
          </div>

          {/* Add to Cart Button */}
          <Button 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full"
          >
            <ShoppingCart className="mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### C. Frontend - useProductDetails Hook
**File:** `src/pages/ProductDetails/useProductDetails.ts`

```typescript
export function useProductDetails(productId: string) {
  const [product, setProduct] = useState<IAnyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await productApi.getProductById(productId);
        setProduct(response.data.result);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return { product, loading, error };
}
```

#### D. Frontend - Product API Service
**File:** `src/services/products/productApi.ts`

```typescript
export const productApi = {
  // GET /product/{productId} → Lấy sản phẩm theo ID
  getProductById: (id: string) => 
    api.get<ApiResponse<ProductResponse>>(`/product/${id}`),
};
```

#### E. Backend - ProductController
**File:** `controller/ProductController.java` (dòng 48-53)

```java
@RestController
@RequestMapping("/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable("id") String id) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.getProductById(id))
                .build();
    }
}
```

#### F. Backend - ProductService
**File:** `service/ProductService.java` (dòng 48-52)

```java
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductResponse getProductById(String id) {
        return productMapper.toProductResponse(
            productRepository.findById(id)
                .orElseThrow(() -> new WebException(ErrorCode.PRODUCT_NOT_FOUND))
        );
    }
}
```

### 6.3 Sơ Đồ Sequence - View Product Details

```
┌─────────┐  ┌─────────────┐  ┌───────────────────┐  ┌────────────┐  ┌─────────────────┐  ┌────────────────┐
│  User   │  │ ProductCard │  │ProductDetailsPage │  │ productApi │  │ProductController│  │ ProductService │
└────┬────┘  └──────┬──────┘  └─────────┬─────────┘  └─────┬──────┘  └────────┬────────┘  └───────┬────────┘
     │              │                   │                  │                  │                   │
     │ Click on     │                   │                  │                  │                   │
     │ product card │                   │                  │                  │                   │
     │─────────────>│                   │                  │                  │                   │
     │              │                   │                  │                  │                   │
     │              │ navigate(         │                  │                  │                   │
     │              │ /products/{id})   │                  │                  │                   │
     │              │──────────────────>│                  │                  │                   │
     │              │                   │                  │                  │                   │
     │              │                   │ useProductDetails│                  │                   │
     │              │                   │ (productId)      │                  │                   │
     │              │                   │                  │                  │                   │
     │              │                   │ setLoading(true) │                  │                   │
     │              │                   │                  │                  │                   │
     │              │                   │ getProductById() │                  │                   │
     │              │                   │─────────────────>│                  │                   │
     │              │                   │                  │                  │                   │
     │              │                   │                  │ GET /product/{id}│                   │
     │              │                   │                  │─────────────────>│                   │
     │              │                   │                  │                  │                   │
     │              │                   │                  │                  │ getProductById()  │
     │              │                   │                  │                  │──────────────────>│
     │              │                   │                  │                  │                   │
     │              │                   │                  │                  │                   │ findById()
     │              │                   │                  │                  │                   │ → Product
     │              │                   │                  │                  │                   │
     │              │                   │                  │                  │                   │ toProductResponse()
     │              │                   │                  │                  │                   │
     │              │                   │                  │                  │ ProductResponse   │
     │              │                   │                  │                  │<──────────────────│
     │              │                   │                  │                  │                   │
     │              │                   │                  │ ApiResponse      │                   │
     │              │                   │                  │ {result: product}│                   │
     │              │                   │                  │<─────────────────│                   │
     │              │                   │                  │                  │                   │
     │              │                   │ response         │                  │                   │
     │              │                   │<─────────────────│                  │                   │
     │              │                   │                  │                  │                   │
     │              │                   │ setProduct()     │                  │                   │
     │              │                   │ setLoading(false)│                  │                   │
     │              │                   │                  │                  │                   │
     │              │                   │ Render product   │                  │                   │
     │              │                   │ details view     │                  │                   │
     │              │                   │                  │                  │                   │
     │ View product │                   │                  │                  │                   │
     │ details page │                   │                  │                  │                   │
     │<─────────────────────────────────│                  │                  │                   │
```

---


## Use Case 7: Search Products

### 7.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  HomePage → useHomePage → useProduct → productApi → Backend                     │
│      ↓           ↓            ↓            ↓            ↓                       │
│  Entry      getAllProducts  safeCall   GET /product  All products               │
│  point           ↓                                       ↓                       │
│             products[]                              Response                     │
│                  ↓                                                               │
│            ProductGrid ←──────────────────────────────────┘                     │
│                  ↓                                                               │
│         ┌────────┴────────┐                                                     │
│         ↓                 ↓                                                     │
│    SearchBar        ProductFilters                                              │
│    (text search)    (type, price, condition)                                    │
│         ↓                 ↓                                                     │
│         └────────┬────────┘                                                     │
│                  ↓                                                               │
│         filteredProducts (useMemo - client-side filtering)                      │
│                  ↓                                                               │
│            ProductCard[]                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request (chỉ 1 lần khi load)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductController → ProductService → ProductRepository                          │
│         ↓                   ↓               ↓                                   │
│  GET /product        getAllProducts    findAll()                                │
│                             ↓               ↓                                   │
│                      ProductMapper     List<Product>                            │
│                             ↓                                                   │
│                      List<ProductResponse>                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Lưu ý quan trọng:** Search và Filter được thực hiện hoàn toàn ở Frontend (client-side). Backend chỉ trả về tất cả sản phẩm một lần.

### 7.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - HomePage
**File:** `src/pages/Home/HomePage.tsx` (dòng 15-35)

```typescript
export function HomePage() {
  const {
    products,        // Danh sách sản phẩm từ API
    cartItemCount,   // Số lượng item trong giỏ
    handleShopNow,   // Scroll đến section products
    handleViewCart,  // Navigate đến /cart
    loading,
    error,
  } = useHomePage();

  return (
    <div className="space-y-8">
      <HeroSection
        cartItemCount={cartItemCount}
        onShopNow={handleShopNow}
        onViewCart={handleViewCart}
      />
      <div id="products" className="scroll-mt-4">
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
```

#### B. Frontend - useHomePage Hook
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

  // Navigate đến cart
  const handleViewCart = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  // Đếm số items trong cart
  const cartItemCount = currentOrder.items.length;

  return { products, cartItemCount, loading, error, handleShopNow, handleViewCart };
}
```

#### C. Frontend - useProduct Hook
**File:** `src/hooks/useProduct.ts` (dòng 5-60)

```typescript
export function useProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wrapper xử lý loading/error
  const safeCall = async <T>(fn: () => Promise<AxiosResponse<ApiResponse<T>>>): Promise<T | null> => {
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
  const getAllProducts = useCallback(async (): Promise<IAnyProduct[] | null> => {
    return await safeCall(() => productApi.getAllProducts());
  }, []);

  // Lấy sản phẩm theo ID
  const getProductById = useCallback(async (id: string): Promise<IAnyProduct | null> => {
    return await safeCall(() => productApi.getProductById(id));
  }, []);

  return { loading, error, getAllProducts, getProductById };
}
```

#### D. Frontend - ProductGrid (Search & Filter)
**File:** `src/components/product/ProductGrid.tsx` (dòng 70-180)

```typescript
export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { showNotification } = useNotification();
  const { addToCart } = useCart();
  
  // State quản lý filters
  const [filters, setFilters] = useState<IProductFilters>({
    types: [],                              // Filter theo loại: BOOK, CD, DVD, NEWSPAPER
    priceRange: { min: 0, max: 1_000_000 }, // Filter theo giá
    condition: 'All',                       // Filter theo tình trạng: New, Used
    searchQuery: '',                        // Search text
  });

  // Filter products dựa trên filters state (CLIENT-SIDE)
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search products by title, author, artist, director..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Layout: Sidebar Filters + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside>
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </aside>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### E. Frontend - ProductFilters Component
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
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {/* Type Filter - Checkboxes */}
      <div>
        <h4 className="font-medium mb-2">Product Type</h4>
        {types.map((type) => (
          <div key={type} className="flex items-center gap-2">
            <Checkbox
              id={type}
              checked={filters.types.includes(type)}
              onCheckedChange={() => handleTypeToggle(type)}
            />
            <Label htmlFor={type}>{type}</Label>
          </div>
        ))}
      </div>

      {/* Price Range Filter - Slider */}
      <div>
        <h4 className="font-medium mb-2">Price Range</h4>
        <Slider
          min={0}
          max={1_000_000}
          step={100000}
          value={[filters.priceRange.min, filters.priceRange.max]}
          onValueChange={handlePriceRangeChange}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>{filters.priceRange.min.toLocaleString('vi-VN')}đ</span>
          <span>{filters.priceRange.max.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Condition Filter - Radio */}
      <div>
        <h4 className="font-medium mb-2">Condition</h4>
        {conditions.map((condition) => (
          <div key={condition} className="flex items-center gap-2">
            <Checkbox
              id={condition}
              checked={filters.condition === condition}
              onCheckedChange={() => handleConditionChange(condition)}
            />
            <Label htmlFor={condition}>{condition}</Label>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

#### F. Frontend - Product API Service
**File:** `src/services/products/productApi.ts`

```typescript
export const productApi = {
  // GET /product → Lấy toàn bộ sản phẩm
  getAllProducts: () => 
    api.get<ApiResponse<ProductResponse[]>>("/product"),

  // GET /product/{productId} → Lấy sản phẩm theo ID
  getProductById: (id: string) => 
    api.get<ApiResponse<ProductResponse>>(`/product/${id}`),
};
```

#### G. Backend - ProductController
**File:** `controller/ProductController.java` (dòng 55-60)

```java
@GetMapping
public ApiResponse<List<ProductResponse>> getProducts() {
    return ApiResponse.<List<ProductResponse>>builder()
            .result(productService.getAllProducts())
            .build();
}
```

#### H. Backend - ProductService
**File:** `service/ProductService.java` (dòng 55-60)

```java
public List<ProductResponse> getAllProducts() {
    return productRepository.findAll()
            .stream()
            .map(productMapper::toProductResponse)
            .collect(Collectors.toList());
}
```

### 7.3 Sơ Đồ Sequence - Search Products

```
┌─────────┐  ┌──────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────────┐  ┌────────────────┐
│  User   │  │ HomePage │  │ ProductGrid │  │ useProduct │  │ProductController│  │ ProductService │
└────┬────┘  └────┬─────┘  └──────┬──────┘  └─────┬──────┘  └────────┬────────┘  └───────┬────────┘
     │            │               │               │                  │                   │
     │ Visit /    │               │               │                  │                   │
     │───────────>│               │               │                  │                   │
     │            │               │               │                  │                   │
     │            │ useHomePage() │               │                  │                   │
     │            │ useEffect()   │               │                  │                   │
     │            │               │               │                  │                   │
     │            │ getAllProducts()              │                  │                   │
     │            │──────────────────────────────>│                  │                   │
     │            │               │               │                  │                   │
     │            │               │               │ GET /product     │                   │
     │            │               │               │─────────────────>│                   │
     │            │               │               │                  │                   │
     │            │               │               │                  │ getAllProducts()  │
     │            │               │               │                  │──────────────────>│
     │            │               │               │                  │                   │
     │            │               │               │                  │                   │ findAll()
     │            │               │               │                  │                   │ map → Response
     │            │               │               │                  │                   │
     │            │               │               │                  │ List<ProductResp> │
     │            │               │               │                  │<──────────────────│
     │            │               │               │                  │                   │
     │            │               │               │ ApiResponse      │                   │
     │            │               │               │ {result: [...]}  │                   │
     │            │               │               │<─────────────────│                   │
     │            │               │               │                  │                   │
     │            │ products[]    │               │                  │                   │
     │            │<──────────────────────────────│                  │                   │
     │            │               │               │                  │                   │
     │            │ setProducts() │               │                  │                   │
     │            │               │               │                  │                   │
     │            │ <ProductGrid  │               │                  │                   │
     │            │  products/>   │               │                  │                   │
     │            │──────────────>│               │                  │                   │
     │            │               │               │                  │                   │
     │ Type search│               │               │                  │                   │
     │ query      │               │               │                  │                   │
     │────────────────────────────>               │                  │                   │
     │            │               │               │                  │                   │
     │            │               │ handleSearch  │                  │                   │
     │            │               │ Change()      │                  │                   │
     │            │               │               │                  │                   │
     │            │               │ setFilters()  │                  │                   │
     │            │               │               │                  │                   │
     │            │               │ useMemo:      │                  │                   │
     │            │               │ filteredProducts                 │                   │
     │            │               │ (client-side) │                  │                   │
     │            │               │               │                  │                   │
     │ See filtered               │               │                  │                   │
     │ results    │               │               │                  │                   │
     │<───────────────────────────│               │                  │                   │
     │            │               │               │                  │                   │
     │ Select type│               │               │                  │                   │
     │ filter     │               │               │                  │                   │
     │────────────────────────────>               │                  │                   │
     │            │               │               │                  │                   │
     │            │               │ handleType    │                  │                   │
     │            │               │ Toggle()      │                  │                   │
     │            │               │               │                  │                   │
     │            │               │ setFilters()  │                  │                   │
     │            │               │               │                  │                   │
     │            │               │ useMemo:      │                  │                   │
     │            │               │ re-filter     │                  │                   │
     │            │               │               │                  │                   │
     │ See updated│               │               │                  │                   │
     │ results    │               │               │                  │                   │
     │<───────────────────────────│               │                  │                   │
```

---


## Use Case 8: Create Product

### 8.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Product Manager)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductManagerPage → ProductForm → productApi.createProduct() → Response       │
│         ↓                  ↓                    ↓                   ↓           │
│  Click "Add New"    Fill product info    POST /product        Success/Error     │
│                     - name, price                                  ↓            │
│                     - description                           Refresh list        │
│                     - type, stock                                               │
│                     - imageUrl, etc.                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductController → ProductService → ProductRepository                          │
│         ↓                   ↓               ↓                                   │
│  POST /product       createProduct     existsByName() → validate                │
│                             ↓               ↓                                   │
│                      ProductMapper     save(product)                            │
│                             ↓                                                   │
│                      ProductResponse                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - Product API Service
**File:** `src/services/products/productApi.ts`

```typescript
export const productApi = {
  // POST /product → Tạo sản phẩm mới
  createProduct: (data: ProductRequest) =>
    api.post<ApiResponse<ProductResponse>>("/product", data),
};

// Request type
export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  weight: number;
  type: 'BOOK' | 'CD' | 'DVD' | 'NEWSPAPER';
  imageUrl?: string;
  barcode?: string;
  condition?: 'New' | 'Used';
  // Type-specific fields
  author?: string;      // BOOK
  publisher?: string;   // BOOK, NEWSPAPER
  artist?: string;      // CD
  director?: string;    // DVD
  // ... more fields
}
```

#### B. Backend - ProductController
**File:** `controller/ProductController.java`

```java
@RestController
@RequestMapping("/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('PRODUCT_MANAGER') or hasRole('ADMIN')")
    public ApiResponse<ProductResponse> createProduct(@RequestBody @Valid ProductRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.createProduct(request))
                .build();
    }
}
```

#### C. Backend - ProductService
**File:** `service/ProductService.java`

```java
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        // 1. Validate: Kiểm tra product name đã tồn tại
        if (productRepository.existsByName(request.getName())) {
            throw new WebException(ErrorCode.PRODUCT_EXISTED);
        }

        // 2. Map request → Entity
        Product product = productMapper.toProduct(request);
        product.setActive(true);
        product.setCreatedAt(LocalDateTime.now());

        // 3. Save vào database
        Product savedProduct = productRepository.save(product);

        // 4. Trả về ProductResponse
        return productMapper.toProductResponse(savedProduct);
    }
}
```

#### D. Backend - ProductRepository
**File:** `repository/ProductRepository.java`

```java
public interface ProductRepository extends JpaRepository<Product, String> {
    boolean existsByName(String name);
}
```

### 8.3 Sơ Đồ Sequence - Create Product

```
┌──────────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────────┐  ┌────────────────┐  ┌───────────────────┐
│Product Manager│  │ ProductForm │  │ productApi │  │ProductController│  │ ProductService │  │ProductRepository  │
└──────┬───────┘  └──────┬──────┘  └─────┬──────┘  └────────┬────────┘  └───────┬────────┘  └─────────┬─────────┘
       │                 │               │                  │                   │                    │
       │ Click "Add New" │               │                  │                   │                    │
       │────────────────>│               │                  │                   │                    │
       │                 │               │                  │                   │                    │
       │ Fill form data  │               │                  │                   │                    │
       │────────────────>│               │                  │                   │                    │
       │                 │               │                  │                   │                    │
       │ Click "Save"    │               │                  │                   │                    │
       │────────────────>│               │                  │                   │                    │
       │                 │               │                  │                   │                    │
       │                 │ createProduct │                  │                   │                    │
       │                 │ (data)        │                  │                   │                    │
       │                 │──────────────>│                  │                   │                    │
       │                 │               │                  │                   │                    │
       │                 │               │ POST /product    │                   │                    │
       │                 │               │ {name, price...} │                   │                    │
       │                 │               │─────────────────>│                   │                    │
       │                 │               │                  │                   │                    │
       │                 │               │                  │ createProduct()   │                    │
       │                 │               │                  │──────────────────>│                    │
       │                 │               │                  │                   │                    │
       │                 │               │                  │                   │ existsByName()     │
       │                 │               │                  │                   │───────────────────>│
       │                 │               │                  │                   │                    │
       │                 │               │                  │                   │ false              │
       │                 │               │                  │                   │<───────────────────│
       │                 │               │                  │                   │                    │
       │                 │               │                  │                   │ save(product)      │
       │                 │               │                  │                   │───────────────────>│
       │                 │               │                  │                   │                    │
       │                 │               │                  │                   │ Product            │
       │                 │               │                  │                   │<───────────────────│
       │                 │               │                  │                   │                    │
       │                 │               │                  │ ProductResponse   │                    │
       │                 │               │                  │<──────────────────│                    │
       │                 │               │                  │                   │                    │
       │                 │               │ ApiResponse      │                   │                    │
       │                 │               │ {result: product}│                   │                    │
       │                 │               │<─────────────────│                   │                    │
       │                 │               │                  │                   │                    │
       │                 │ response      │                  │                   │                    │
       │                 │<──────────────│                  │                   │                    │
       │                 │               │                  │                   │                    │
       │ Success toast   │               │                  │                   │                    │
       │ Refresh list    │               │                  │                   │                    │
       │<────────────────│               │                  │                   │                    │
```

---

## Use Case 9: Update Product

### 9.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Product Manager)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductList → Edit Button → ProductForm (prefilled) → productApi.updateProduct │
│       ↓             ↓               ↓                         ↓                 │
│  Display list   Click edit    Load existing data        PUT /product/{id}       │
│                               Modify fields                   ↓                 │
│                               Submit                    Success/Error           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductController → ProductService → ProductRepository                          │
│         ↓                   ↓               ↓                                   │
│  PUT /product/{id}   updateProduct     findById() → update → save()             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - Product API Service
**File:** `src/services/products/productApi.ts`

```typescript
export const productApi = {
  // PUT /product/{id} → Cập nhật sản phẩm
  updateProduct: (id: string, data: ProductRequest) =>
    api.put<ApiResponse<ProductResponse>>(`/product/${id}`, data),
};
```

#### B. Backend - ProductController
**File:** `controller/ProductController.java`

```java
@PutMapping("/{id}")
@PreAuthorize("hasRole('PRODUCT_MANAGER') or hasRole('ADMIN')")
public ApiResponse<ProductResponse> updateProduct(
        @PathVariable("id") String id,
        @RequestBody @Valid ProductRequest request) {
    return ApiResponse.<ProductResponse>builder()
            .result(productService.updateProduct(id, request))
            .build();
}
```

#### C. Backend - ProductService
**File:** `service/ProductService.java`

```java
@Transactional
public ProductResponse updateProduct(String id, ProductRequest request) {
    // 1. Tìm product theo ID
    Product product = productRepository.findById(id)
            .orElseThrow(() -> new WebException(ErrorCode.PRODUCT_NOT_FOUND));

    // 2. Update các fields từ request
    productMapper.updateProduct(product, request);
    product.setUpdatedAt(LocalDateTime.now());

    // 3. Save vào database
    Product updatedProduct = productRepository.save(product);

    // 4. Trả về ProductResponse
    return productMapper.toProductResponse(updatedProduct);
}
```

### 9.3 Sơ Đồ Sequence - Update Product

```
┌──────────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────────┐  ┌────────────────┐
│Product Manager│  │ ProductForm │  │ productApi │  │ProductController│  │ ProductService │
└──────┬───────┘  └──────┬──────┘  └─────┬──────┘  └────────┬────────┘  └───────┬────────┘
       │                 │               │                  │                   │
       │ Click "Edit"    │               │ 

       │ on product      │               │                  │                   │
       │────────────────>│               │                  │                   │
       │                 │               │                  │                   │
       │ Modify fields   │               │                  │                   │
       │────────────────>│               │                  │                   │
       │                 │               │                  │                   │
       │ Click "Update"  │               │                  │                   │
       │────────────────>│               │                  │                   │
       │                 │               │                  │                   │
       │                 │ updateProduct │                  │                   │
       │                 │ (id, data)    │                  │                   │
       │                 │──────────────>│                  │                   │
       │                 │               │                  │                   │
       │                 │               │ PUT /product/{id}│                   │
       │                 │               │─────────────────>│                   │
       │                 │               │                  │                   │
       │                 │               │                  │ updateProduct()   │
       │                 │               │                  │──────────────────>│
       │                 │               │                  │                   │
       │                 │               │                  │                   │ findById()
       │                 │               │                  │                   │ update fields
       │                 │               │                  │                   │ save()
       │                 │               │                  │                   │
       │                 │               │                  │ ProductResponse   │
       │                 │               │                  │<──────────────────│
       │                 │               │                  │                   │
       │                 │               │ ApiResponse      │                   │
       │                 │               │<─────────────────│                   │
       │                 │               │                  │                   │
       │ Success toast   │               │                  │                   │
       │<────────────────│               │                  │                   │
```

---

## Use Case 10: Delete Product

### 10.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Product Manager)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductList → Delete Button → Confirm Dialog → productApi.deleteProduct        │
│       ↓             ↓               ↓                    ↓                      │
│  Display list   Click delete   Confirm action      DELETE /product/{id}         │
│                                                          ↓                      │
│                                                    Success/Error                │
│                                                          ↓                      │
│                                                    Remove from list             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ProductController → ProductService → ProductRepository                          │
│         ↓                   ↓               ↓                                   │
│  DELETE /product/{id} deleteProduct    findById() → delete() or setActive(false)│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - Product API Service
**File:** `src/services/products/productApi.ts`

```typescript
export const productApi = {
  // DELETE /product/{id} → Xóa sản phẩm
  deleteProduct: (id: string) =>
    api.delete<ApiResponse<void>>(`/product/${id}`),
};
```

#### B. Backend - ProductController
**File:** `controller/ProductController.java`

```java
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('PRODUCT_MANAGER') or hasRole('ADMIN')")
public ApiResponse<Void> deleteProduct(@PathVariable("id") String id) {
    productService.deleteProduct(id);
    return ApiResponse.<Void>builder().build();
}
```

#### C. Backend - ProductService
**File:** `service/ProductService.java`

```java
@Transactional
public void deleteProduct(String id) {
    // 1. Tìm product theo ID
    Product product = productRepository.findById(id)
            .orElseThrow(() -> new WebException(ErrorCode.PRODUCT_NOT_FOUND));

    // 2. Soft delete: set active = false
    product.setActive(false);
    productRepository.save(product);
    
    // Hoặc Hard delete:
    // productRepository.delete(product);
}
```

### 10.3 Sơ Đồ Sequence - Delete Product

```
┌──────────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────────┐  ┌────────────────┐
│Product Manager│  │ConfirmDialog│  │ productApi │  │ProductController│  │ ProductService │
└──────┬───────┘  └──────┬──────┘  └─────┬──────┘  └────────┬────────┘  └───────┬────────┘
       │                 │               │                  │                   │
       │ Click "Delete"  │               │                  │                   │
       │────────────────>│               │                  │                   │
       │                 │               │                  │                   │
       │ Show confirm    │               │                  │                   │
       │ dialog          │               │                  │                   │
       │<────────────────│               │                  │                   │
       │                 │               │                  │                   │
       │ Click "Confirm" │               │                  │                   │
       │────────────────>│               │                  │                   │
       │                 │               │                  │                   │
       │                 │ deleteProduct │                  │                   │
       │                 │ (id)          │                  │                   │
       │                 │──────────────>│                  │                   │
       │                 │               │                  │                   │
       │                 │               │DELETE /product/  │                   │
       │                 │               │{id}              │                   │
       │                 │               │─────────────────>│                   │
       │                 │               │                  │                   │
       │                 │               │                  │ deleteProduct()   │
       │                 │               │                  │──────────────────>│
       │                 │               │                  │                   │
       │                 │               │                  │                   │ findById()
       │                 │               │                  │                   │ setActive(false)
       │                 │               │                  │                   │ save()
       │                 │               │                  │                   │
       │                 │               │                  │ void              │
       │                 │               │                  │<──────────────────│
       │                 │               │                  │                   │
       │                 │               │ ApiResponse      │                   │
       │                 │               │ (empty)          │                   │
       │                 │               │<─────────────────│                   │
       │                 │               │                  │                   │
       │ Success toast   │               │                  │                   │
       │ Remove from list│               │                  │                   │
       │<────────────────│               │                  │                   │
```

---


## Use Case 11: Log In

### 11.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  LoginPage → LoginContainer → LoginForm → authApi.login() → Response            │
│      ↓            ↓              ↓              ↓              ↓                │
│  UI Layout   Business logic  Form UI      POST /auth/token  JWT Token           │
│                    ↓                                           ↓                │
│              handleLogin()                              Decode JWT              │
│                    ↓                                           ↓                │
│              Save token to storage                      Get role (scope)        │
│              (localStorage/sessionStorage)                     ↓                │
│                    ↓                                    Redirect by role        │
│              Save user info                             ADMIN → /admin          │
│                    ↓                                    PM → /productManager    │
│              Navigate                                   CUSTOMER → /            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  AuthenticationController → AuthenticationService → AccountRepository            │
│           ↓                        ↓                      ↓                     │
│  POST /auth/token           authenticate()          findByUsername()            │
│                                    ↓                      ↓                     │
│                             PasswordEncoder.matches()  Account                  │
│                                    ↓                                            │
│                             generateToken() → JWT (HS512, 1h expiry)            │
│                                    ↓                                            │
│                             AuthenticationResponse {token, authenticated}       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - LoginPage
**File:** `src/pages/Login/LoginPage.tsx` (dòng 35-80)

```typescript
export function LoginPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo và Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-700">AIMS</h1>
          <p className="text-gray-600">An Internet Media Store</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-lg border-0">
          <LoginContainer />
        </Card>

        {/* Back to Store button */}
        <div className="text-center mt-4">
          <button 
            onClick={() => navigate('/')}
            className="text-teal-600 hover:underline"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### B. Frontend - LoginContainer (Business Logic)
**File:** `src/pages/Login/LoginContainer.tsx` (dòng 45-105)

```typescript
export function LoginContainer() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  
  // Lấy returnUrl từ query params (nếu có)
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get('returnUrl');

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
      if (!token) {
        throw new Error('No token received');
      }

      // 3. Lưu token theo Remember Me option
      const tokenStorageService = data.rememberMe 
        ? defaultLocalStorageService 
        : defaultSessionStorageService;
      tokenStorageService.set(STORAGE_KEYS.AUTH_TOKEN, token);

      // 4. Decode JWT lấy role
      const decoded = jwtDecode<JWTPayload>(token);
      const role = decoded.scope;

      // 5. Lưu user info
      const userStorageService = data.rememberMe 
        ? defaultLocalStorageService 
        : defaultSessionStorageService;
      userStorageService.set(STORAGE_KEYS.USER_INFO, JSON.stringify({
        name: decoded.sub,
        role: role,
      }));

      // 6. Hiển thị thông báo thành công
      showNotification('success', LOGIN_MESSAGES.SUCCESS);

      // 7. Redirect theo role
      const redirectPath = returnUrl || getRedirectPathByRole(role);
      navigate(redirectPath, { replace: true });

    } catch (err: any) {
      // Xử lý lỗi theo status code
      if (err.response?.status === 401) {
        showNotification('error', LOGIN_MESSAGES.INVALID_CREDENTIALS);
      } else if (err.response?.status === 404) {
        showNotification('error', LOGIN_MESSAGES.USER_NOT_FOUND);
      } else {
        showNotification('error', LOGIN_MESSAGES.GENERIC_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  return <LoginForm onSubmit={handleLogin} isLoading={loading} />;
}

// Helper function
function getRedirectPathByRole(role: string): string {
  if (role.includes('ADMIN')) return '/admin';
  if (role.includes('PRODUCT_MANAGER')) return '/productManager/products';
  return '/';  // CUSTOMER
}
```

#### C. Frontend - LoginForm
**File:** `src/pages/Login/LoginForm.tsx` (dòng 30-130)

```typescript
interface LoginFormData {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    emailOrUsername: '',
    password: '',
    rememberMe: false,
  });
  const [touched, setTouched] = useState({
    emailOrUsername: false,
    password: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ emailOrUsername: true, password: true });
    
    // Validate
    if (!formData.emailOrUsername || !formData.password) {
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username/Email Input */}
      <div>
        <Label htmlFor="emailOrUsername">Username or Email</Label>
        <Input
          id="emailOrUsername"
          type="text"
          placeholder="Enter your username or email"
          value={formData.emailOrUsername}
          onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
          onBlur={() => setTouched({ ...touched, emailOrUsername: true })}
        />
        {touched.emailOrUsername && !formData.emailOrUsername && (
          <span className="text-red-500 text-sm">Username is required</span>
        )}
      </div>

      {/* Password Input */}
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onBlur={() => setTouched({ ...touched, password: true })}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="rememberMe"
          checked={formData.rememberMe}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, rememberMe: checked as boolean })
          }
        />
        <Label htmlFor="rememberMe">Remember me</Label>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

#### D. Frontend - Auth API Service
**File:** `src/services/account/authApi.ts` (dòng 15-40)

```typescript
export const authApi = {
  // POST /auth/token → Đăng nhập
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<AuthenticationResponse>>("/auth/token", data),
  
  // POST /auth/introspect → Kiểm tra token hợp lệ
  introspect: (token: string) =>
    api.post<ApiResponse<IntrospectResponse>>("/auth/introspect", { token }),

  // POST /auth/logout → Đăng xuất
  logout: (token: string) =>
    api.post<ApiResponse<void>>("/auth/logout", { token }),
};

// Types
interface AuthenticationResponse {
  token: string;
  authenticated: boolean;
}

interface JWTPayload {
  sub: string;      // username
  scope: string;    // roles (e.g., "ADMIN CUSTOMER")
  iss: string;      // issuer
  exp: number;      // expiration time
  iat: number;      // issued at
  jti: string;      // JWT ID
}
```

#### E. Backend - AuthenticationController
**File:** `controller/AuthenticationController.java` (dòng 48-68)

```java
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/token")
    public ApiResponse<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationService.authenticate(request))
                .build();
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws JOSEException, ParseException {
        return ApiResponse.<IntrospectResponse>builder()
                .result(authenticationService.introspect(request))
                .build();
    }
}
```

#### F. Backend - AuthenticationService
**File:** `service/AuthenticationService.java` (dòng 65-130)

```java
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @Value("${jwt.signerKey}")
    private String SIGNER_KEY;

    public AuthenticationResponse authenticate(AuthenticationRequest authenticationRequest) {
        String username = authenticationRequest.username();

        // 1. Tìm account theo username
        Account account = accountRepository.findByUsername(username)
                .orElseThrow(() -> new WebException(ErrorCode.ACCOUNT_NOT_EXIST));

        // 2. Verify password với BCrypt
        boolean matchPassword = passwordEncoder.matches(
            authenticationRequest.password(), 
            account.getPassword()
        );

        if (!matchPassword) {
            throw new WebException(ErrorCode.UNAUTHENTICATED);
        }

        // 3. Generate JWT token
        String token = generateToken(account);

        return AuthenticationResponse.builder()
                .authenticated(true)
                .token(token)
                .build();
    }

    private String generateToken(Account account) {
        String username = account.getUsername();

        // 1. Tạo JWT Header với thuật toán HS512
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        
        // 2. Tạo JWT Claims
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(username)                    // Tên user (unique identifier)
                .issuer("harkins.com")                // Nhà phát hành
                .issueTime(new Date())                // Thời gian tạo
                .expirationTime(new Date(             // Hết hạn sau 1 giờ
                    Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())  // Unique token ID
                .claim("scope", buildScope(account))  // Roles của user
                .build();

        // 3. Sign token với SIGNER_KEY
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);
        
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
        } catch (JOSEException e) {
            throw new RuntimeException("Cannot sign JWT token", e);
        }
        
        return jwsObject.serialize();
    }

    // Build scope từ roles của account
    private String buildScope(Account account) {
        StringJoiner scopeJoiner = new StringJoiner(" ");
        if(!CollectionUtils.isEmpty(account.getRoles())) {
            account.getRoles().forEach(role -> scopeJoiner.add(role.getName()));
        }
        return scopeJoiner.toString();  // VD: "ADMIN CUSTOMER"
    }
}
```

### 11.3 Sơ Đồ Sequence - Log In

```
┌─────────┐  ┌───────────────┐  ┌──────────────┐  ┌─────────┐  ┌────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐
│  User   │  │  LoginForm    │  │LoginContainer│  │ authApi │  │AuthenticationController│  │AuthenticationService│  │ AccountRepository │
└────┬────┘  └───────┬───────┘  └──────┬───────┘  └────┬────┘  └──────────┬───────────┘  └──────────┬──────────┘  └─────────┬─────────┘
     │               │                 │               │                  │                        │                       │
     │ Enter         │                 │               │                  │                        │                       │
     │ credentials   │                 │               │                  │                        │                       │
     │──────────────>│                 │               │                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │ Click "Sign In"                 │               │                  │                        │                       │
     │──────────────>│                 │               │                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │ onSubmit        │               │                  │                        │                       │
     │               │ (formData)      │               │                  │                        │                       │
     │               │────────────────>│               │                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │ setLoading    │                  │                        │                       │
     │               │                 │ (true)        │                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │ login()       │                  │                        │                       │
     │               │                 │──────────────>│                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │               │ POST /auth/token │                        │                       │
     │               │                 │               │ {username,       │                        │                       │
     │               │                 │               │  password}       │                        │                       │
     │               │                 │               │─────────────────>│                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │               │                  │ authenticate()        │                       │
     │               │                 │               │                  │───────────────────────>│                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │               │                  │                        │ findByUsername()      │
     │               │                 │               │                  │                        │──────────────────────>│
     │               │                 │               │                  │                        │                       │
     │               │                 │               │                  │                        │      Account          │
     │               │                 │               │                  │                        │<──────────────────────│
     │               │                 │               │                  │                        │                       │
     │               │                 │               │                  │                        │ passwordEncoder       │
     │               │                 │               │                  │                        │ .matches()            │
     │               │                 │               │                  │                        │                       │
     │               │                 │               │                  │                        │ generateToken()       │
     │               │                 │               │                  │                        │ → JWT (HS512)         │
     │               │                 │               │                  │                        │                       │
     │               │                 │               │                  │ AuthenticationResponse │                       │
     │               │                 │               │                  │ {token, authenticated} │                       │
     │               │                 │               │                  │<───────────────────────│                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │               │ ApiResponse      │                        │                       │
     │               │                 │               │ {result: {token}}│                        │                       │
     │               │                 │               │<─────────────────│                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │ response      │                  │                        │                       │
     │               │                 │<──────────────│                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │ Save token    │                  │                        │                       │
     │               │                 │ to storage    │                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │ jwtDecode()   │                  │                        │                       │
     │               │                 │ → get role    │                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │ Save user info│                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │               │                 │ navigate()    │                  │                        │                       │
     │               │                 │ by role       │                  │                        │                       │
     │               │                 │               │                  │                        │                       │
     │ Redirect to   │                 │               │                  │                        │                       │
     │ /admin or /   │                 │               │                  │                        │                       │
     │<──────────────────────────────────              │                  │                        │                       │
```

---


## Use Case 12: Log Out

### 12.1 Tổng Quan Luồng

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Header/Sidebar → Logout Button → LogoutModal → authApi.logout() → Response     │
│        ↓               ↓              ↓              ↓              ↓           │
│  Click avatar    Show modal     Confirm action  POST /auth/logout  Success      │
│                                       ↓                              ↓          │
│                                 Get token from storage         Clear storage    │
│                                       ↓                              ↓          │
│                                 Call API                       Navigate to /    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  AuthenticationController → AuthenticationService → InvalidatedTokenRepository   │
│           ↓                        ↓                         ↓                  │
│  POST /auth/logout            logout()                  save(invalidatedToken)  │
│                                    ↓                                            │
│                             verifyToken()                                       │
│                                    ↓                                            │
│                             Get jwtID + expiryTime                              │
│                                    ↓                                            │
│                             Save to blacklist                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Chi Tiết Các File và Dòng Code

#### A. Frontend - LogoutModal Component
**File:** `src/components/LogoutModal.tsx` (dòng 130-180)

```typescript
interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLogout: () => void;
}

export function LogoutModal({ open, onOpenChange, onConfirmLogout }: LogoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);

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
      sessionStorage.removeItem('aims_admin_user');
      
      // 4. Hiển thị thông báo thành công
      toast.success('Đăng xuất thành công');
      
      // 5. Đóng modal và redirect
      onOpenChange(false);
      onConfirmLogout();  // Parent xử lý redirect về home
      
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Đăng xuất thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to log out? You will need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### B. Frontend - useAuth Hook
**File:** `src/hooks/useAuth.ts` (dòng 140-150)

```typescript
export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const storageService = defaultLocalStorageService;

  const logout = useCallback(() => {
    // Clear storage
    storageService.remove(STORAGE_KEYS.AUTH_TOKEN);
    storageService.remove(STORAGE_KEYS.USER_INFO);
    
    // Clear state
    setUser(null);
    
    // Redirect về home
    navigate("/");
  }, [storageService, navigate]);

  return { user, logout, ... };
}
```

#### C. Frontend - Auth API Service
**File:** `src/services/account/authApi.ts`

```typescript
export const authApi = {
  // POST /auth/logout → Đăng xuất
  logout: (token: string) =>
    api.post<ApiResponse<void>>("/auth/logout", { token }),
};
```

#### D. Backend - AuthenticationController
**File:** `controller/AuthenticationController.java` (dòng 62-68)

```java
@PostMapping("/logout")
public ApiResponse<Void> logout(@RequestBody LogoutRequest request)
        throws ParseException, JOSEException {
    authenticationService.logout(request);
    return ApiResponse.<Void>builder().build();
}
```

#### E. Backend - AuthenticationService
**File:** `service/AuthenticationService.java` (dòng 84-95)

```java
public void logout(LogoutRequest request) throws ParseException, JOSEException {
    // 1. Verify token còn hợp lệ
    var signToken = verifyToken(request.token());

    // 2. Lấy JWT ID và expiry time
    String jit = signToken.getJWTClaimsSet().getJWTID();
    Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();

    // 3. Lưu vào bảng InvalidatedToken (blacklist)
    InvalidatedToken invalidatedToken = InvalidatedToken.builder()
            .id(jit)
            .expiryTime(expiryTime)
            .build();

    invalidatedTokenRepository.save(invalidatedToken);
}

// Verify token helper
private SignedJWT verifyToken(String token) throws JOSEException, ParseException {
    JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
    SignedJWT signedJWT = SignedJWT.parse(token);

    // Verify signature
    boolean verified = signedJWT.verify(verifier);
    
    // Check expiration
    Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
    boolean notExpired = expiryTime.after(new Date());

    // Check blacklist
    String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
    boolean notBlacklisted = !invalidatedTokenRepository.existsById(jwtId);

    if (!verified || !notExpired || !notBlacklisted) {
        throw new WebException(ErrorCode.UNAUTHENTICATED);
    }

    return signedJWT;
}
```

#### F. Backend - InvalidatedToken Entity
**File:** `entity/InvalidatedToken.java`

```java
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvalidatedToken {
    @Id
    private String id;  // JWT ID (jti claim)
    
    private Date expiryTime;  // Token expiry time
}
```

### 12.3 Sơ Đồ Sequence - Log Out

```
┌─────────┐  ┌─────────────┐  ┌─────────┐  ┌────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│  User   │  │ LogoutModal │  │ authApi │  │AuthenticationController│  │AuthenticationService│  │InvalidatedTokenRepository│
└────┬────┘  └──────┬──────┘  └────┬────┘  └──────────┬───────────┘  └──────────┬──────────┘  └────────────┬────────────┘
     │              │              │                  │                        │                          │
     │ Click Logout │              │                  │                        │                          │
     │─────────────>│              │                  │                        │                          │
     │              │              │                  │                        │                          │
     │ Show modal   │              │                  │                        │                          │
     │<─────────────│              │                  │                        │                          │
     │              │              │                  │                        │                          │
     │ Click        │              │                  │                        │                          │
     │ "Confirm"    │              │                  │                        │                          │
     │─────────────>│              │                  │                        │                          │
     │              │              │                  │                        │                          │
     │              │ setIsLoading │                  │                        │                          │
     │              │ (true)       │                  │                        │                          │
     │              │              │                  │                        │                          │
     │              │ Get token    │                  │                        │                          │
     │              │ from storage │                  │                        │                          │
     │              │              │                  │                        │                          │
     │              │ logout(token)│                  │                        │                          │
     │              │─────────────>│                  │                        │                          │
     │              │              │                  │                        │                          │
     │              │              │ POST /auth/logout│                        │                          │
     │              │              │ {token}          │                        │                          │
     │              │              │─────────────────>│                        │                          │
     │              │              │                  │                        │                          │
     │              │              │                  │ logout()               │                          │
     │              │              │                  │───────────────────────>│                          │
     │              │              │                  │                        │                          │
     │              │              │                  │                        │ verifyToken()            │
     │              │              │                  │                        │ → SignedJWT              │
     │              │              │                  │                        │                          │
     │              │              │                  │                        │ Get jwtID, expiryTime    │
     │              │              │                  │                        │                          │
     │              │              │                  │                        │ save(invalidatedToken)   │
     │              │              │                  │                        │─────────────────────────>│
     │              │              │                  │                        │                          │
     │              │              │                  │                        │ void                     │
     │              │              │                  │                        │<─────────────────────────│
     │              │              │                  │                        │                          │
     │              │              │                  │ void                   │                          │
     │              │              │                  │<───────────────────────│                          │
     │              │              │                  │                        │                          │
     │              │              │ ApiResponse      │                        │                          │
     │              │              │ (empty)          │                        │                          │
     │              │              │<─────────────────│                        │                          │
     │              │              │                  │                        │                          │
     │              │ response     │                  │                        │                          │
     │              │<─────────────│                  │                        │                          │
     │              │              │                  │                        │                          │
     │              │ Clear storage│                  │                        │                          │
     │              │ (localStorage│                  │                        │                          │
     │              │ sessionStorage)                 │                        │                          │
     │              │              │                  │                        │                          │
     │              │ toast.success│                  │                        │                          │
     │              │              │                  │                        │                          │
     │              │ onConfirm    │                  │                        │                          │
     │              │ Logout()     │                  │                        │                          │
     │              │ → navigate(/)│                  │                        │                          │
     │              │              │                  │                        │                          │
     │ Redirect to  │              │                  │                        │                          │
     │ Home page    │              │                  │                        │                          │
     │<─────────────│              │                  │                        │                          │
```

---


## Tổng Kết API Endpoints

### Authentication APIs

| Method | Endpoint | Mô Tả | Request Body | Response |
|--------|----------|-------|--------------|----------|
| POST | `/auth/token` | Đăng nhập | `{username, password}` | `{token, authenticated}` |
| POST | `/auth/introspect` | Kiểm tra token | `{token}` | `{valid}` |
| POST | `/auth/logout` | Đăng xuất | `{token}` | `void` |

### Product APIs

| Method | Endpoint | Mô Tả | Request Body | Response |
|--------|----------|-------|--------------|----------|
| GET | `/product` | Lấy tất cả sản phẩm | - | `List<ProductResponse>` |
| GET | `/product/{id}` | Lấy sản phẩm theo ID | - | `ProductResponse` |
| POST | `/product` | Tạo sản phẩm mới | `ProductRequest` | `ProductResponse` |
| PUT | `/product/{id}` | Cập nhật sản phẩm | `ProductRequest` | `ProductResponse` |
| DELETE | `/product/{id}` | Xóa sản phẩm | - | `void` |

### Cart APIs

| Method | Endpoint | Mô Tả | Request Body | Response |
|--------|----------|-------|--------------|----------|
| POST | `/cartItem` | Thêm sản phẩm vào giỏ | `{productId, quantity, accountId?}` | `CartItemResponse` |
| GET | `/cartItem/list` | Lấy danh sách cart items | Query: `accountId`, `guestUuid` | `List<CartItemResponse>` |
| PUT | `/cartItem/{id}` | Cập nhật số lượng | `{quantity}` | `CartItemResponse` |
| DELETE | `/cartItem/{id}` | Xóa item khỏi giỏ | - | `void` |

### Order APIs

| Method | Endpoint | Mô Tả | Request Body | Response |
|--------|----------|-------|--------------|----------|
| POST | `/order/cart` | Đặt hàng (logged-in) | `{accountId, cartItemIds, newAddress}` | `OrderResponse` |
| POST | `/order/guest/cart` | Đặt hàng (guest) | `{guestUuid, cartItemIds, newAddress}` | `OrderResponse` |
| GET | `/order/{id}` | Lấy thông tin đơn hàng | - | `OrderResponse` |

### Payment APIs

| Method | Endpoint | Mô Tả | Request Body | Response |
|--------|----------|-------|--------------|----------|
| POST | `/payOrder/viet-qr` | Tạo QR code thanh toán | `{orderId, amount}` | `String (QR code)` |
| GET | `/payOrder/viet-qr/verify/{orderId}` | Kiểm tra trạng thái thanh toán | - | `String (SUCCESS/PENDING/FAILED)` |
| POST | `/payOrder/paypal` | Thanh toán qua PayPal | `{orderId, cardInfo}` | `String (SUCCESS/FAILED)` |

---

## Error Codes

| Code | Tên | Mô Tả | HTTP Status |
|------|-----|-------|-------------|
| 1001 | ACCOUNT_NOT_FOUND | Không tìm thấy tài khoản | 404 |
| 1002 | ACCOUNT_NOT_EXIST | Tài khoản không tồn tại (login) | 404 |
| 1003 | UNAUTHENTICATED | Sai mật khẩu hoặc token không hợp lệ | 401 |
| 1009 | PRODUCT_NOT_FOUND | Không tìm thấy sản phẩm | 404 |
| 1010 | PRODUCT_EXISTED | Sản phẩm đã tồn tại | 400 |
| 1011 | PRODUCT_OUT_OF_STOCK | Sản phẩm hết hàng | 400 |
| 1012 | CART_NOT_FOUND | Không tìm thấy giỏ hàng | 404 |
| 1013 | CARTITEM_NOT_FOUND | Không tìm thấy item trong giỏ | 404 |
| 1014 | ORDER_NOT_FOUND | Không tìm thấy đơn hàng | 404 |
| 1015 | ADDRESS_NOT_FOUND | Không tìm thấy địa chỉ | 404 |
| 1016 | ADDRESS_REQUIRED | Thiếu thông tin địa chỉ | 400 |
| 1017 | INVALID_PRICE | Số tiền không hợp lệ | 400 |

---

## Tổng Kết Files Theo Use Case

| Use Case | Frontend Files | Backend Files |
|----------|----------------|---------------|
| **Place Order** | `CartPage.tsx`, `CheckoutFlow.tsx`, `ShippingForm.tsx`, `useOrder.ts`, `orderApi.ts`, `OrderSuccess.tsx` | `OrderController.java`, `OrderService.java`, `OrderRepository.java` |
| **Add to Cart** | `ProductCard.tsx`, `ProductGrid.tsx`, `CartContext.tsx`, `cartApi.ts` | `CartItemController.java`, `CartItemService.java`, `CartItemRepository.java` |
| **Pay Order (VietQR)** | `PaymentMethodSelector.tsx`, `VietQRPayment.tsx`, `paymentApi.ts` | `PayOrderController.java`, `PaymentService.java`, `IQrPayment.java` |
| **Pay Order (Credit Card)** | `CreditCardPayment.tsx`, `paymentApi.ts` | `PayOrderController.java`, `PaymentService.java`, `IPayment.java` |
| **Select Delivery** | `CheckoutFlow.tsx`, `ShippingForm.tsx`, `OrderSummary.tsx` | `DeliveryInfo.java`, `DeliveryMethod.java` |
| **View Product Details** | `ProductDetailsPage.tsx`, `useProductDetails.ts`, `productApi.ts` | `ProductController.java`, `ProductService.java` |
| **Search Products** | `HomePage.tsx`, `useHomePage.ts`, `ProductGrid.tsx`, `ProductFilters.tsx`, `productApi.ts` | `ProductController.java`, `ProductService.java` |
| **Create Product** | `ProductForm.tsx`, `productApi.ts` | `ProductController.java`, `ProductService.java` |
| **Update Product** | `ProductForm.tsx`, `productApi.ts` | `ProductController.java`, `ProductService.java` |
| **Delete Product** | `ConfirmDialog.tsx`, `productApi.ts` | `ProductController.java`, `ProductService.java` |
| **Log In** | `LoginPage.tsx`, `LoginContainer.tsx`, `LoginForm.tsx`, `authApi.ts`, `useAuth.ts` | `AuthenticationController.java`, `AuthenticationService.java` |
| **Log Out** | `LogoutModal.tsx`, `authApi.ts`, `useAuth.ts` | `AuthenticationController.java`, `AuthenticationService.java` |

---

## Luồng Dữ Liệu Chung

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  User Action → Page Component → Hook/Context → API Service → HTTP Request       │
│       ↑                                                            │            │
│       │                                                            ▼            │
│       └──────────────── Update State ← Response ←──────────────────┘            │
│                              ↓                                                   │
│                         Re-render UI                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP (REST API)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Controller → Service → Repository → Database                                   │
│       ↑           ↓          ↓           ↓                                      │
│       │      Business    JPA Query    MySQL/PostgreSQL                          │
│       │       Logic                                                             │
│       │           ↓                                                             │
│       └───── Response ← Entity → DTO (MapStruct)                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

*Tài liệu được tạo tự động từ source code của hệ thống AIMS*
*Phiên bản: 1.0*
*Ngày cập nhật: 04/01/2026*
