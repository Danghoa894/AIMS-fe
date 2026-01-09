# Tài Liệu Diagrams Chi Tiết - Hệ Thống AIMS

## Mục Lục
1. [Unified Analysis Class Diagram](#1-unified-analysis-class-diagram)
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

---

## 1. Unified Analysis Class Diagram

### 1.1 Complete System Class Diagram

```mermaid
classDiagram
    %% Entity Classes
    class Account {
        -String id
        -String username
        -String password
        -String email
        -String fullName
        -List~Role~ roles
        -List~Address~ addresses
        -Cart cart
        -LocalDateTime createdAt
        +addAddress(Address)
        +removeAddress(Address)
    }

    class Role {
        -String id
        -String name
        -String description
    }

    class Address {
        -String id
        -String recipientName
        -String phoneNumber
        -String email
        -String street
        -String city
        -Account account
    }

    class Product {
        -String id
        -String name
        -String description
        -Double price
        -Integer stock
        -Double weight
        -String type
        -String imageUrl
        -String barcode
        -String condition
        -Boolean active
        -LocalDateTime createdAt
        +reduceStock(int)
        +isAvailable() boolean
    }

    class Book {
        -String author
        -String publisher
        -String isbn
        -Integer pages
        -String language
    }

    class CD {
        -String artist
        -String recordLabel
        -String genre
        -Integer tracks
    }

    class DVD {
        -String director
        -String studio
        -Integer runtime
        -String language
    }

    class Newspaper {
        -String publisher
        -LocalDate publishDate
        -String edition
    }

    class Cart {
        -String id
        -Account account
        -String guestUuid
        -List~CartItem~ items
        -LocalDateTime createdDate
        +addItem(CartItem)
        +removeItem(CartItem)
        +getTotalPrice() double
        +getTotalWeight() double
    }

    class CartItem {
        -String id
        -Cart cart
        -Product product
        -Integer quantity
        -Double unitPrice
        -Double totalPrice
        -Double totalWeight
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +calTotalPrice()
        +calTotalWeight()
    }

    class Order {
        -String id
        -Account account
        -DeliveryInfo deliveryInfo
        -OrderStatus orderStatus
        -List~OrderItem~ items
        -Double totalAmount
        -LocalDateTime createdAt
        +addItem(OrderItem)
        +calculateTotal() double
    }

    class OrderItem {
        -String id
        -Order order
        -String productId
        -String productName
        -String productDescription
        -Integer quantity
        -Double unitPrice
        -Double totalPrice
        -Double totalWeight
        -LocalDateTime createdAt
    }

    class DeliveryInfo {
        -String id
        -String recipientName
        -String phoneNumber
        -String email
        -String street
        -String city
        -DeliveryMethod deliveryMethod
        -Double deliveryFee
    }

    class InvalidatedToken {
        -String id
        -Date expiryTime
    }

    %% Enums
    class OrderStatus {
        <<enumeration>>
        CREATED
        PENDING_PAYMENT
        PAID
        PROCESSING
        SHIPPED
        DELIVERED
        CANCELLED
    }

    class DeliveryMethod {
        <<enumeration>>
        STANDARD
        EXPRESS
        SAME_DAY
    }

    class ProductType {
        <<enumeration>>
        BOOK
        CD
        DVD
        NEWSPAPER
    }

    %% Relationships
    Account "1" --> "*" Role : has
    Account "1" --> "*" Address : has
    Account "1" --> "1" Cart : owns
    Account "1" --> "*" Order : places

    Product <|-- Book
    Product <|-- CD
    Product <|-- DVD
    Product <|-- Newspaper

    Cart "1" --> "*" CartItem : contains
    CartItem "*" --> "1" Product : references

    Order "1" --> "*" OrderItem : contains
    Order "1" --> "1" DeliveryInfo : has
    Order --> OrderStatus : has

    DeliveryInfo --> DeliveryMethod : uses
```

### 1.2 Controller Layer Class Diagram

```mermaid
classDiagram
    class AuthenticationController {
        -AuthenticationService authService
        +login(AuthenticationRequest) ApiResponse
        +introspect(IntrospectRequest) ApiResponse
        +logout(LogoutRequest) ApiResponse
    }

    class ProductController {
        -ProductService productService
        +getProducts() ApiResponse
        +getProduct(String id) ApiResponse
        +createProduct(ProductRequest) ApiResponse
        +updateProduct(String id, ProductRequest) ApiResponse
        +deleteProduct(String id) ApiResponse
    }

    class CartItemController {
        -CartItemService cartItemService
        +addProductToCart(CartItemRequest, Cookie, Response) ApiResponse
        +getCartItemList(String accountId, String guestUuid, Cookie) ApiResponse
        +updateCartItem(String id, CartItemRequest) ApiResponse
        +deleteCartItem(String id) ApiResponse
    }

    class OrderController {
        -OrderService orderService
        +cartOrder(CartOrderRequest) ApiResponse
        +cartOrderForGuest(GuestCartOrderRequest) ApiResponse
        +getOrder(String id) ApiResponse
    }

    class PayOrderController {
        -PaymentService paymentService
        +payOrder(PayOrderRequest) ApiResponse
        +verify(String orderId) ApiResponse
        +processCreditCardPayment(Map) ApiResponse
    }
```

### 1.3 Service Layer Class Diagram

```mermaid
classDiagram
    class AuthenticationService {
        -AccountRepository accountRepo
        -PasswordEncoder passwordEncoder
        -InvalidatedTokenRepository tokenRepo
        -String SIGNER_KEY
        +authenticate(AuthenticationRequest) AuthenticationResponse
        +introspect(IntrospectRequest) IntrospectResponse
        +logout(LogoutRequest) void
        -generateToken(Account) String
        -verifyToken(String) SignedJWT
        -buildScope(Account) String
    }

    class ProductService {
        -ProductRepository productRepo
        -ProductMapper productMapper
        +getAllProducts() List~ProductResponse~
        +getProductById(String) ProductResponse
        +createProduct(ProductRequest) ProductResponse
        +updateProduct(String, ProductRequest) ProductResponse
        +deleteProduct(String) void
    }

    class CartItemService {
        -CartRepository cartRepo
        -CartItemRepository cartItemRepo
        -ProductRepository productRepo
        -CartItemMapper cartItemMapper
        +addProductToCart(CartItemRequest) CartItemResponse
        +getAllCartItems(String, String) List~CartItemResponse~
        +updateCartItem(String, CartItemRequest) CartItemResponse
        +deleteCartItem(String) void
        -handleGuestCart(String) Cart
    }

    class OrderService {
        -OrderRepository orderRepo
        -AccountRepository accountRepo
        -CartItemRepository cartItemRepo
        -ProductRepository productRepo
        -AddressRepository addressRepo
        -OrderMapper orderMapper
        +placeCartOrder(CartOrderRequest) OrderResponse
        +placeCartOrderForGuest(GuestCartOrderRequest) OrderResponse
        +getOrderById(String) OrderResponse
        -resolveDeliveryInfo(String, AddressRequest, Account) DeliveryInfo
    }

    class PaymentService {
        -IQrPayment qrPayment
        -IPayment credPayment
        +generateQrCode(String, Integer) String
        +verifyPayment(String) String
        +payOrderByCreditCard(Map) String
    }

    class IQrPayment {
        <<interface>>
        +generateQrCode(String, Integer) String
    }

    class IPayment {
        <<interface>>
        +payOrder(String) String
    }

    PaymentService --> IQrPayment
    PaymentService --> IPayment
```

### 1.4 Repository Layer Class Diagram

```mermaid
classDiagram
    class JpaRepository~T, ID~ {
        <<interface>>
        +findAll() List~T~
        +findById(ID) Optional~T~
        +save(T) T
        +delete(T) void
        +existsById(ID) boolean
    }

    class AccountRepository {
        <<interface>>
        +findByUsername(String) Optional~Account~
        +existsByUsername(String) boolean
    }

    class ProductRepository {
        <<interface>>
        +existsByName(String) boolean
    }

    class CartRepository {
        <<interface>>
        +findByAccountId(String) Optional~Cart~
        +findByGuestUuid(String) Optional~Cart~
    }

    class CartItemRepository {
        <<interface>>
        +findByCartIdAndProductId(String, String) CartItem
        +existsByCartIdAndProductId(String, String) boolean
    }

    class OrderRepository {
        <<interface>>
        +findByAccountId(String) List~Order~
    }

    class InvalidatedTokenRepository {
        <<interface>>
        +existsById(String) boolean
    }

    JpaRepository <|-- AccountRepository
    JpaRepository <|-- ProductRepository
    JpaRepository <|-- CartRepository
    JpaRepository <|-- CartItemRepository
    JpaRepository <|-- OrderRepository
    JpaRepository <|-- InvalidatedTokenRepository
```

---


## Use Case 1: Place Order

### 1.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as CheckoutPage
    participant Ctrl as OrderController
    participant Svc as OrderService
    participant DB as Database

    Customer->>UI: Click "Đặt hàng"
    UI->>UI: Validate thông tin
    UI->>Ctrl: POST /api/orders/cart-order
    Ctrl->>Svc: placeCartOrder(request)
    Svc->>DB: Get cart items
    Svc->>DB: Check stock
    Svc->>DB: Update stock
    Svc->>DB: Create order
    Svc->>DB: Delete cart items
    DB-->>Svc: Order created
    Svc-->>Ctrl: OrderResponse
    Ctrl-->>UI: ApiResponse
    UI->>UI: Navigate to Payment
    UI-->>Customer: Hiển thị trang thanh toán
```

### 1.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes (UI/API)
    class CheckoutPage {
        <<boundary>>
        +orderData: OrderData
        +deliveryInfo: DeliveryInfo
        +handlePlaceOrder()
        +validateForm()
        +displayError()
    }

    class OrderController {
        <<boundary>>
        +cartOrder(request)
        +cartOrderForGuest(request)
        +getOrder(id)
    }

    %% Control Classes (Business Logic)
    class OrderService {
        <<control>>
        +placeCartOrder(request)
        +placeCartOrderForGuest(request)
        +getOrderById(id)
        -resolveDeliveryInfo()
        -calculateDeliveryFee()
        -validateStock()
    }

    class CartContext {
        <<control>>
        +cartItems: CartItem[]
        +clearCart()
        +getSelectedItems()
    }

    %% Entity Classes (Data)
    class Order {
        <<entity>>
        -id: String
        -account: Account
        -deliveryInfo: DeliveryInfo
        -orderStatus: OrderStatus
        -items: List~OrderItem~
        -totalAmount: Double
        -createdAt: LocalDateTime
    }

    class OrderItem {
        <<entity>>
        -id: String
        -productId: String
        -productName: String
        -quantity: Integer
        -unitPrice: Double
        -totalPrice: Double
    }

    class DeliveryInfo {
        <<entity>>
        -recipientName: String
        -phoneNumber: String
        -email: String
        -street: String
        -city: String
        -deliveryMethod: DeliveryMethod
        -deliveryFee: Double
    }

    class CartItem {
        <<entity>>
        -id: String
        -product: Product
        -quantity: Integer
        -unitPrice: Double
    }

    class Product {
        <<entity>>
        -id: String
        -name: String
        -price: Double
        -stock: Integer
    }

    %% Relationships
    CheckoutPage --> CartContext : uses
    CheckoutPage --> OrderController : calls
    OrderController --> OrderService : delegates
    OrderService --> Order : creates
    OrderService --> CartItem : reads
    OrderService --> Product : updates stock
    Order "1" --> "*" OrderItem : contains
    Order "1" --> "1" DeliveryInfo : has
    CartItem "*" --> "1" Product : references
```

---

## Use Case 2: Add Product to Cart

### 2.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as ProductDetailsPage
    participant Ctrl as CartItemController
    participant Svc as CartItemService
    participant DB as Database

    Customer->>UI: Click "Thêm vào giỏ"
    UI->>Ctrl: POST /api/cart-items
    Ctrl->>Svc: addProductToCart(request)
    Svc->>DB: Get/Create Cart
    Svc->>DB: Check Product exists
    Svc->>DB: Check CartItem exists
    alt CartItem exists
        Svc->>DB: Update quantity
    else CartItem not exists
        Svc->>DB: Create CartItem
    end
    DB-->>Svc: CartItem saved
    Svc-->>Ctrl: CartItemResponse
    Ctrl-->>UI: ApiResponse
    UI-->>Customer: "Đã thêm vào giỏ hàng"
```

### 2.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class ProductDetailsPage {
        <<boundary>>
        +product: Product
        +quantity: number
        +handleAddToCart()
        +showSuccessMessage()
        +showErrorMessage()
    }

    class CartItemController {
        <<boundary>>
        +addProductToCart(request, cookie, response)
        +getCartItemList(accountId, guestUuid, cookie)
        +updateCartItem(id, request)
        +deleteCartItem(id)
    }

    %% Control Classes
    class CartContext {
        <<control>>
        +cartItems: CartItem[]
        +addToCart(productId, quantity)
        +updateQuantity(itemId, quantity)
        +removeFromCart(itemId)
        +fetchCartItems()
    }

    class CartItemService {
        <<control>>
        +addProductToCart(request)
        +getAllCartItems(accountId, guestUuid)
        +updateCartItem(id, request)
        +deleteCartItem(id)
        -handleGuestCart(guestUuid)
        -calculateTotals(cartItem)
    }

    %% Entity Classes
    class Cart {
        <<entity>>
        -id: String
        -account: Account
        -guestUuid: String
        -items: List~CartItem~
        -createdDate: LocalDateTime
    }

    class CartItem {
        <<entity>>
        -id: String
        -cart: Cart
        -product: Product
        -quantity: Integer
        -unitPrice: Double
        -totalPrice: Double
        -totalWeight: Double
    }

    class Product {
        <<entity>>
        -id: String
        -name: String
        -price: Double
        -weight: Double
        -stock: Integer
    }

    %% Relationships
    ProductDetailsPage --> CartContext : uses
    ProductDetailsPage --> CartItemController : calls
    CartItemController --> CartItemService : delegates
    CartItemService --> Cart : manages
    CartItemService --> CartItem : creates/updates
    CartItemService --> Product : reads
    Cart "1" --> "*" CartItem : contains
    CartItem "*" --> "1" Product : references
```

---

## Use Case 3: Pay Order (VietQR)

### 3.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as VietQRPayment
    participant Ctrl as PayOrderController
    participant Svc as PaymentService
    participant DB as Database

    Customer->>UI: Chọn "VietQR"
    UI->>Ctrl: POST /api/payment/pay-order
    Ctrl->>Svc: generateQrCode(orderId, amount)
    Svc-->>Ctrl: qrCodeUrl
    Ctrl-->>UI: ApiResponse with URL
    UI-->>Customer: Hiển thị mã QR
    Customer->>Customer: Quét QR & thanh toán
    Customer->>UI: Click "Tôi đã thanh toán"
    UI->>Ctrl: GET /api/payment/verify/{orderId}
    Ctrl->>Svc: verifyPayment(orderId)
    Svc->>DB: Update order status = PAID
    DB-->>Svc: Order updated
    Svc-->>Ctrl: "Payment verified"
    Ctrl-->>UI: ApiResponse
    UI-->>Customer: "Thanh toán thành công"
```

### 3.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class PaymentMethodSelector {
        <<boundary>>
        +orderId: String
        +amount: number
        +paymentMethod: string
        +setPaymentMethod()
        +renderPaymentComponent()
    }

    class VietQRPayment {
        <<boundary>>
        +orderId: String
        +amount: number
        +qrCodeUrl: string
        +generateQrCode()
        +handleVerifyPayment()
        +displayQrCode()
    }

    class PayOrderController {
        <<boundary>>
        +payOrder(request)
        +verify(orderId)
        +processCreditCardPayment(data)
    }

    %% Control Classes
    class PaymentService {
        <<control>>
        -qrPayment: IQrPayment
        -credPayment: IPayment
        +generateQrCode(orderId, amount)
        +verifyPayment(orderId)
        +payOrderByCreditCard(data)
    }

    class VietQRPaymentImpl {
        <<control>>
        -bankId: String
        -accountNo: String
        -template: String
        +generateQrCode(orderId, amount)
        -buildQrUrl()
    }

    %% Entity Classes
    class Order {
        <<entity>>
        -id: String
        -orderStatus: OrderStatus
        -totalAmount: Double
        +setOrderStatus(status)
    }

    class OrderStatus {
        <<enumeration>>
        CREATED
        PENDING_PAYMENT
        PAID
        PROCESSING
    }

    %% Interface
    class IQrPayment {
        <<interface>>
        +generateQrCode(orderId, amount)
    }

    %% Relationships
    PaymentMethodSelector --> VietQRPayment : renders
    VietQRPayment --> PayOrderController : calls
    PayOrderController --> PaymentService : delegates
    PaymentService --> IQrPayment : uses
    IQrPayment <|.. VietQRPaymentImpl : implements
    PaymentService --> Order : updates
    Order --> OrderStatus : has
```

---

## Use Case 4: Pay Order by Credit Card

### 4.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as CreditCardPayment
    participant Ctrl as PayOrderController
    participant Svc as PaymentService
    participant DB as Database

    Customer->>UI: Chọn "Credit Card"
    Customer->>UI: Nhập thông tin thẻ
    UI->>UI: Validate form
    Customer->>UI: Click "Thanh toán"
    UI->>Ctrl: POST /api/payment/credit-card
    Ctrl->>Svc: payOrderByCreditCard(data)
    Svc->>Svc: Process payment
    alt Payment success
        Svc->>DB: Update order status = PAID
        DB-->>Svc: Order updated
        Svc-->>Ctrl: "Payment successful"
        Ctrl-->>UI: ApiResponse
        UI-->>Customer: "Thanh toán thành công"
    else Payment failed
        Svc-->>Ctrl: PaymentException
        Ctrl-->>UI: Error Response
        UI-->>Customer: "Thanh toán thất bại"
    end
```

### 4.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class CreditCardPayment {
        <<boundary>>
        +orderId: String
        +amount: number
        +cardNumber: string
        +expiryDate: string
        +cvv: string
        +cardholderName: string
        +handleSubmit()
        +validateForm()
        +displayError()
    }

    class PayOrderController {
        <<boundary>>
        +processCreditCardPayment(data)
        +payOrder(request)
        +verify(orderId)
    }

    %% Control Classes
    class PaymentService {
        <<control>>
        -credPayment: IPayment
        +payOrderByCreditCard(data)
        +generateQrCode(orderId, amount)
        +verifyPayment(orderId)
    }

    class CreditCardPaymentImpl {
        <<control>>
        +payOrder(orderId)
        -validateCardInfo()
        -processPayment()
    }

    %% Entity Classes
    class Order {
        <<entity>>
        -id: String
        -orderStatus: OrderStatus
        -totalAmount: Double
    }

    class PaymentData {
        <<entity>>
        -orderId: String
        -cardNumber: String
        -expiryDate: String
        -cvv: String
        -cardholderName: String
    }

    %% Interface
    class IPayment {
        <<interface>>
        +payOrder(orderId)
    }

    %% Relationships
    CreditCardPayment --> PayOrderController : calls
    PayOrderController --> PaymentService : delegates
    PaymentService --> IPayment : uses
    IPayment <|.. CreditCardPaymentImpl : implements
    PaymentService --> Order : updates
    CreditCardPayment ..> PaymentData : creates
```

---


## Use Case 5: Select Delivery Method

### 5.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as DeliveryInfoForm
    participant Ctrl as OrderController
    participant Svc as OrderService
    participant DB as Database

    Customer->>UI: Chọn delivery method
    UI->>UI: calculateDeliveryFee(method)
    UI-->>Customer: Hiển thị phí giao hàng
    Customer->>UI: Nhập thông tin giao hàng
    Customer->>UI: Click "Đặt hàng"
    UI->>UI: Validate form
    UI->>Ctrl: POST /api/orders/cart-order
    Ctrl->>Svc: placeCartOrder(request)
    Svc->>Svc: Create DeliveryInfo
    Svc->>Svc: Calculate deliveryFee
    Svc->>DB: Create Order with DeliveryInfo
    DB-->>Svc: Order saved
    Svc-->>Ctrl: OrderResponse
    Ctrl-->>UI: ApiResponse
    UI-->>Customer: Navigate to Payment
```

### 5.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class CheckoutPage {
        <<boundary>>
        +cartItems: CartItem[]
        +deliveryInfo: DeliveryInfo
        +handlePlaceOrder()
        +calculateTotal()
    }

    class DeliveryInfoForm {
        <<boundary>>
        +recipientName: string
        +phoneNumber: string
        +email: string
        +street: string
        +city: string
        +deliveryMethod: DeliveryMethod
        +deliveryFee: number
        +handleMethodChange()
        +validateForm()
        +calculateDeliveryFee()
    }

    class OrderController {
        <<boundary>>
        +cartOrder(request)
        +getOrder(id)
    }

    %% Control Classes
    class OrderService {
        <<control>>
        +placeCartOrder(request)
        -resolveDeliveryInfo()
        -calculateDeliveryFee(method)
    }

    %% Entity Classes
    class DeliveryInfo {
        <<entity>>
        -id: String
        -recipientName: String
        -phoneNumber: String
        -email: String
        -street: String
        -city: String
        -deliveryMethod: DeliveryMethod
        -deliveryFee: Double
    }

    class DeliveryMethod {
        <<enumeration>>
        STANDARD
        EXPRESS
        SAME_DAY
    }

    class Order {
        <<entity>>
        -id: String
        -deliveryInfo: DeliveryInfo
        -totalAmount: Double
    }

    %% Relationships
    CheckoutPage --> DeliveryInfoForm : contains
    CheckoutPage --> OrderController : calls
    OrderController --> OrderService : delegates
    OrderService --> DeliveryInfo : creates
    OrderService --> Order : creates
    Order "1" --> "1" DeliveryInfo : has
    DeliveryInfo --> DeliveryMethod : uses
    DeliveryInfoForm ..> DeliveryMethod : selects
```

---

## Use Case 6: View Product Details

### 6.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as ProductDetailsPage
    participant Ctrl as ProductController
    participant Svc as ProductService
    participant DB as Database

    Customer->>UI: Click vào sản phẩm
    UI->>Ctrl: GET /api/products/{id}
    Ctrl->>Svc: getProductById(id)
    Svc->>DB: findById(id)
    alt Product exists
        DB-->>Svc: Product
        Svc-->>Ctrl: ProductResponse
        Ctrl-->>UI: ApiResponse
        UI-->>Customer: Hiển thị chi tiết sản phẩm
    else Product not found
        DB-->>Svc: null
        Svc-->>Ctrl: PRODUCT_NOT_FOUND
        Ctrl-->>UI: 404 Error
        UI-->>Customer: "Sản phẩm không tồn tại"
    end
```

### 6.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class HomePage {
        <<boundary>>
        +products: Product[]
        +loading: boolean
        +fetchProducts()
        +renderProductGrid()
    }

    class ProductCard {
        <<boundary>>
        +product: Product
        +handleClick()
        +displayProductInfo()
    }

    class ProductDetailsPage {
        <<boundary>>
        +product: Product
        +quantity: number
        +loading: boolean
        +fetchProductDetails()
        +handleAddToCart()
        +displayProductDetails()
    }

    class ProductController {
        <<boundary>>
        +getProducts()
        +getProduct(id)
        +createProduct(request)
        +updateProduct(id, request)
        +deleteProduct(id)
    }

    %% Control Classes
    class ProductService {
        <<control>>
        +getAllProducts()
        +getProductById(id)
        +createProduct(request)
        +updateProduct(id, request)
        +deleteProduct(id)
    }

    %% Entity Classes
    class Product {
        <<entity>>
        -id: String
        -name: String
        -description: String
        -price: Double
        -stock: Integer
        -weight: Double
        -type: String
        -imageUrl: String
        -active: Boolean
    }

    class Book {
        <<entity>>
        -author: String
        -publisher: String
        -isbn: String
        -pages: Integer
    }

    class CD {
        <<entity>>
        -artist: String
        -recordLabel: String
        -genre: String
    }

    class DVD {
        <<entity>>
        -director: String
        -studio: String
        -runtime: Integer
    }

    %% Relationships
    HomePage --> ProductCard : renders many
    ProductCard --> ProductDetailsPage : navigates to
    ProductDetailsPage --> ProductController : calls
    ProductController --> ProductService : delegates
    ProductService --> Product : manages
    Product <|-- Book
    Product <|-- CD
    Product <|-- DVD
```

---

## Use Case 7: Search Products

### 7.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as HomePage
    participant Ctrl as ProductController
    participant Svc as ProductService
    participant DB as Database

    Customer->>UI: Nhập keyword & chọn filters
    Customer->>UI: Click "Tìm kiếm"
    UI->>Ctrl: GET /api/products?keyword=...&filters=...
    Ctrl->>Svc: searchProducts(params)
    Svc->>DB: Query with filters
    DB-->>Svc: List<Product>
    Svc-->>Ctrl: List<ProductResponse>
    Ctrl-->>UI: ApiResponse
    alt Has results
        UI-->>Customer: Hiển thị kết quả tìm kiếm
    else No results
        UI-->>Customer: "Không tìm thấy sản phẩm"
    end
```

### 7.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class SearchBar {
        <<boundary>>
        +searchTerm: string
        +handleInputChange()
        +handleSearch()
        +clearSearch()
    }

    class ProductFilters {
        <<boundary>>
        +selectedCategory: string
        +priceRange: PriceRange
        +sortBy: string
        +sortDirection: string
        +