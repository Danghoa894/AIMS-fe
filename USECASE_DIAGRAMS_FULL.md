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
    autonumber
    actor Customer
    participant FE as Frontend (React)
    participant CartCtx as CartContext
    participant OrderAPI as orderApi
    participant BE as Backend API
    participant OrderCtrl as OrderController
    participant OrderSvc as OrderService
    participant CartItemRepo as CartItemRepository
    participant ProductRepo as ProductRepository
    participant OrderRepo as OrderRepository
    participant DB as Database

    %% Bước 1: Customer xác nhận đặt hàng
    Customer->>FE: Click "Đặt hàng"
    FE->>FE: Validate thông tin giao hàng
    
    alt Thông tin không hợp lệ
        FE-->>Customer: Hiển thị lỗi validation
    else Thông tin hợp lệ
        FE->>OrderAPI: placeOrder(orderData)
        OrderAPI->>BE: POST /api/orders/cart-order
        BE->>OrderCtrl: cartOrder(CartOrderRequest)
        OrderCtrl->>OrderSvc: placeCartOrder(request)
        
        %% Bước 2: Lấy thông tin cart items
        OrderSvc->>CartItemRepo: findAllById(cartItemIds)
        CartItemRepo->>DB: SELECT * FROM cart_items
        DB-->>CartItemRepo: List<CartItem>
        CartItemRepo-->>OrderSvc: cartItems
        
        %% Bước 3: Kiểm tra stock
        loop Với mỗi CartItem
            OrderSvc->>ProductRepo: findById(productId)
            ProductRepo->>DB: SELECT * FROM products
            DB-->>ProductRepo: Product
            ProductRepo-->>OrderSvc: product
            
            alt Stock không đủ
                OrderSvc-->>OrderCtrl: throw AppException(INSUFFICIENT_STOCK)
                OrderCtrl-->>BE: Error Response
                BE-->>OrderAPI: 400 Bad Request
                OrderAPI-->>FE: Error
                FE-->>Customer: "Sản phẩm không đủ số lượng"
            else Stock đủ
                OrderSvc->>OrderSvc: Giảm stock sản phẩm
                OrderSvc->>ProductRepo: save(product)
            end
        end
        
        %% Bước 4: Tạo Order
        OrderSvc->>OrderSvc: Tạo Order entity
        OrderSvc->>OrderSvc: Tạo OrderItems từ CartItems
        OrderSvc->>OrderSvc: Tính toán DeliveryInfo & Fee
        OrderSvc->>OrderRepo: save(order)
        OrderRepo->>DB: INSERT INTO orders
        DB-->>OrderRepo: Order saved
        OrderRepo-->>OrderSvc: order
        
        %% Bước 5: Xóa cart items đã đặt
        OrderSvc->>CartItemRepo: deleteAllById(cartItemIds)
        CartItemRepo->>DB: DELETE FROM cart_items
        
        %% Bước 6: Trả về response
        OrderSvc-->>OrderCtrl: OrderResponse
        OrderCtrl-->>BE: ApiResponse<OrderResponse>
        BE-->>OrderAPI: 200 OK + OrderResponse
        OrderAPI-->>FE: orderData
        
        %% Bước 7: Cập nhật UI
        FE->>CartCtx: clearCart()
        FE->>FE: Navigate to Payment Page
        FE-->>Customer: Hiển thị trang thanh toán
    end
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

### 1.3 Interaction Diagram (Communication Diagram)

```mermaid
flowchart LR
    subgraph Frontend
        A[Customer] -->|1. Click đặt hàng| B[CheckoutPage]
        B -->|2. getSelectedItems| C[CartContext]
        C -->|3. return items| B
        B -->|4. placeOrder| D[orderApi]
    end

    subgraph Backend
        D -->|5. POST /orders/cart-order| E[OrderController]
        E -->|6. placeCartOrder| F[OrderService]
        F -->|7. findAllById| G[CartItemRepository]
        F -->|8. findById & save| H[ProductRepository]
        F -->|9. save| I[OrderRepository]
        F -->|10. deleteAllById| G
    end

    subgraph Database
        G -->|query| J[(Database)]
        H -->|query| J
        I -->|query| J
    end

    I -->|11. OrderResponse| F
    F -->|12. return| E
    E -->|13. ApiResponse| D
    D -->|14. orderData| B
    B -->|15. Navigate to Payment| A
```

---

## Use Case 2: Add Product to Cart

### 2.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as Frontend (React)
    participant ProductDetail as ProductDetailsPage
    participant CartCtx as CartContext
    participant CartAPI as cartApi
    participant BE as Backend API
    participant CartCtrl as CartItemController
    participant CartSvc as CartItemService
    participant CartRepo as CartRepository
    participant CartItemRepo as CartItemRepository
    participant ProductRepo as ProductRepository
    participant DB as Database

    %% Bước 1: Customer thêm sản phẩm
    Customer->>ProductDetail: Click "Thêm vào giỏ"
    ProductDetail->>ProductDetail: Lấy quantity từ input
    ProductDetail->>CartCtx: addToCart(productId, quantity)
    
    %% Bước 2: Gọi API
    CartCtx->>CartAPI: addToCart(productId, quantity)
    CartAPI->>BE: POST /api/cart-items
    Note over CartAPI,BE: Headers: Cookie (guest_uuid hoặc JWT)
    
    BE->>CartCtrl: addProductToCart(request, cookie, response)
    CartCtrl->>CartSvc: addProductToCart(request)
    
    %% Bước 3: Xử lý Cart (Guest hoặc User)
    alt Có JWT Token (Logged in User)
        CartSvc->>CartRepo: findByAccountId(accountId)
        CartRepo->>DB: SELECT * FROM carts WHERE account_id = ?
        DB-->>CartRepo: Cart
    else Không có JWT (Guest)
        alt Có guest_uuid cookie
            CartSvc->>CartRepo: findByGuestUuid(guestUuid)
            CartRepo->>DB: SELECT * FROM carts WHERE guest_uuid = ?
            DB-->>CartRepo: Cart
        else Không có cookie
            CartSvc->>CartSvc: Generate new UUID
            CartSvc->>CartRepo: save(new Cart(guestUuid))
            CartRepo->>DB: INSERT INTO carts
            DB-->>CartRepo: New Cart
            CartSvc->>CartCtrl: Set-Cookie: guest_uuid
        end
    end
    CartRepo-->>CartSvc: cart
    
    %% Bước 4: Kiểm tra Product
    CartSvc->>ProductRepo: findById(productId)
    ProductRepo->>DB: SELECT * FROM products
    DB-->>ProductRepo: Product
    ProductRepo-->>CartSvc: product
    
    alt Product không tồn tại
        CartSvc-->>CartCtrl: throw AppException(PRODUCT_NOT_FOUND)
        CartCtrl-->>BE: Error Response
        BE-->>CartAPI: 404 Not Found
        CartAPI-->>CartCtx: Error
        CartCtx-->>ProductDetail: showError()
        ProductDetail-->>Customer: "Sản phẩm không tồn tại"
    end
    
    %% Bước 5: Kiểm tra CartItem đã tồn tại chưa
    CartSvc->>CartItemRepo: existsByCartIdAndProductId(cartId, productId)
    CartItemRepo->>DB: SELECT EXISTS(...)
    DB-->>CartItemRepo: boolean
    
    alt CartItem đã tồn tại
        CartSvc->>CartItemRepo: findByCartIdAndProductId(cartId, productId)
        CartItemRepo-->>CartSvc: existingCartItem
        CartSvc->>CartSvc: existingCartItem.quantity += quantity
        CartSvc->>CartSvc: recalculate totalPrice, totalWeight
        CartSvc->>CartItemRepo: save(existingCartItem)
    else CartItem chưa tồn tại
        CartSvc->>CartSvc: Create new CartItem
        CartSvc->>CartSvc: Set unitPrice, totalPrice, totalWeight
        CartSvc->>CartItemRepo: save(newCartItem)
    end
    
    CartItemRepo->>DB: INSERT/UPDATE cart_items
    DB-->>CartItemRepo: CartItem saved
    CartItemRepo-->>CartSvc: cartItem
    
    %% Bước 6: Trả về response
    CartSvc-->>CartCtrl: CartItemResponse
    CartCtrl-->>BE: ApiResponse<CartItemResponse>
    BE-->>CartAPI: 200 OK + CartItemResponse
    CartAPI-->>CartCtx: cartItemData
    
    %% Bước 7: Cập nhật UI
    CartCtx->>CartCtx: Update cartItems state
    CartCtx-->>ProductDetail: Cart updated
    ProductDetail-->>Customer: "Đã thêm vào giỏ hàng" + Badge update
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

### 2.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Customer] -->|1. Click thêm giỏ| B[ProductDetailsPage]
        B -->|2. addToCart| C[CartContext]
        C -->|3. POST request| D[cartApi]
    end

    subgraph Backend
        D -->|4. /api/cart-items| E[CartItemController]
        E -->|5. addProductToCart| F[CartItemService]
        F -->|6. findByAccountId/GuestUuid| G[CartRepository]
        F -->|7. findById| H[ProductRepository]
        F -->|8. save| I[CartItemRepository]
    end

    subgraph Database
        G -->|query| J[(Database)]
        H -->|query| J
        I -->|query| J
    end

    I -->|9. CartItem| F
    F -->|10. CartItemResponse| E
    E -->|11. ApiResponse| D
    D -->|12. response| C
    C -->|13. update state| B
    B -->|14. show success| A
```

---

## Use Case 3: Pay Order (VietQR)

### 3.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as Frontend (React)
    participant PaymentPage as PaymentMethodSelector
    participant VietQR as VietQRPayment
    participant PayAPI as paymentApi
    participant BE as Backend API
    participant PayCtrl as PayOrderController
    participant PaySvc as PaymentService
    participant QrPayment as VietQRPaymentImpl
    participant OrderRepo as OrderRepository
    participant DB as Database

    %% Bước 1: Customer chọn phương thức thanh toán
    Customer->>PaymentPage: Chọn "VietQR"
    PaymentPage->>PaymentPage: setPaymentMethod('vietqr')
    PaymentPage->>VietQR: Render VietQRPayment component
    
    %% Bước 2: Tạo mã QR
    VietQR->>PayAPI: generateQrCode(orderId, amount)
    PayAPI->>BE: POST /api/payment/pay-order
    Note over PayAPI,BE: Body: {orderId, amount}
    
    BE->>PayCtrl: payOrder(PayOrderRequest)
    PayCtrl->>PaySvc: generateQrCode(orderId, amount)
    PaySvc->>QrPayment: generateQrCode(orderId, amount)
    
    %% Bước 3: Tạo QR Code URL
    QrPayment->>QrPayment: Build VietQR URL
    Note over QrPayment: URL format: https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount}&addInfo={orderId}
    QrPayment-->>PaySvc: qrCodeUrl
    PaySvc-->>PayCtrl: qrCodeUrl
    PayCtrl-->>BE: ApiResponse<String>
    BE-->>PayAPI: 200 OK + qrCodeUrl
    PayAPI-->>VietQR: qrCodeUrl
    
    %% Bước 4: Hiển thị QR Code
    VietQR->>VietQR: Display QR Image
    VietQR-->>Customer: Hiển thị mã QR + hướng dẫn
    
    %% Bước 5: Customer quét và thanh toán
    Customer->>Customer: Mở app ngân hàng
    Customer->>Customer: Quét mã QR
    Customer->>Customer: Xác nhận thanh toán
    
    %% Bước 6: Xác nhận thanh toán (Manual hoặc Webhook)
    Customer->>VietQR: Click "Tôi đã thanh toán"
    VietQR->>PayAPI: verifyPayment(orderId)
    PayAPI->>BE: GET /api/payment/verify/{orderId}
    
    BE->>PayCtrl: verify(orderId)
    PayCtrl->>PaySvc: verifyPayment(orderId)
    
    %% Bước 7: Cập nhật trạng thái Order
    PaySvc->>OrderRepo: findById(orderId)
    OrderRepo->>DB: SELECT * FROM orders
    DB-->>OrderRepo: Order
    OrderRepo-->>PaySvc: order
    
    PaySvc->>PaySvc: order.setOrderStatus(PAID)
    PaySvc->>OrderRepo: save(order)
    OrderRepo->>DB: UPDATE orders SET status = 'PAID'
    DB-->>OrderRepo: Updated
    
    PaySvc-->>PayCtrl: "Payment verified"
    PayCtrl-->>BE: ApiResponse<String>
    BE-->>PayAPI: 200 OK
    PayAPI-->>VietQR: success
    
    %% Bước 8: Chuyển trang
    VietQR->>FE: Navigate to OrderSuccess
    FE-->>Customer: Hiển thị "Thanh toán thành công"
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

### 3.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Customer] -->|1. Chọn VietQR| B[PaymentMethodSelector]
        B -->|2. render| C[VietQRPayment]
        C -->|3. generateQrCode| D[paymentApi]
    end

    subgraph Backend
        D -->|4. POST /payment/pay-order| E[PayOrderController]
        E -->|5. generateQrCode| F[PaymentService]
        F -->|6. generateQrCode| G[VietQRPaymentImpl]
    end

    G -->|7. qrCodeUrl| F
    F -->|8. return| E
    E -->|9. ApiResponse| D
    D -->|10. qrCodeUrl| C
    C -->|11. Display QR| A

    A -->|12. Quét & thanh toán| A
    A -->|13. Click xác nhận| C
    C -->|14. verifyPayment| D
    D -->|15. GET /verify| E
    E -->|16. verifyPayment| F
    F -->|17. update order| H[OrderRepository]
    H -->|18. save| I[(Database)]
```

---

## Use Case 4: Pay Order by Credit Card

### 4.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as Frontend (React)
    participant PaymentPage as PaymentMethodSelector
    participant CreditCard as CreditCardPayment
    participant PayAPI as paymentApi
    participant BE as Backend API
    participant PayCtrl as PayOrderController
    participant PaySvc as PaymentService
    participant CredPayment as CreditCardPaymentImpl
    participant OrderRepo as OrderRepository
    participant DB as Database

    %% Bước 1: Customer chọn Credit Card
    Customer->>PaymentPage: Chọn "Credit Card"
    PaymentPage->>PaymentPage: setPaymentMethod('credit_card')
    PaymentPage->>CreditCard: Render CreditCardPayment component
    
    %% Bước 2: Customer nhập thông tin thẻ
    CreditCard-->>Customer: Hiển thị form nhập thẻ
    Customer->>CreditCard: Nhập Card Number
    Customer->>CreditCard: Nhập Expiry Date
    Customer->>CreditCard: Nhập CVV
    Customer->>CreditCard: Nhập Cardholder Name
    
    %% Bước 3: Validate form
    CreditCard->>CreditCard: validateCardNumber()
    CreditCard->>CreditCard: validateExpiryDate()
    CreditCard->>CreditCard: validateCVV()
    
    alt Validation failed
        CreditCard-->>Customer: Hiển thị lỗi validation
    else Validation passed
        Customer->>CreditCard: Click "Thanh toán"
        
        %% Bước 4: Gửi request thanh toán
        CreditCard->>PayAPI: processCreditCardPayment(paymentData)
        PayAPI->>BE: POST /api/payment/credit-card
        Note over PayAPI,BE: Body: {orderId, cardNumber, expiryDate, cvv, cardholderName}
        
        BE->>PayCtrl: processCreditCardPayment(data)
        PayCtrl->>PaySvc: payOrderByCreditCard(data)
        PaySvc->>CredPayment: payOrder(orderId)
        
        %% Bước 5: Xử lý thanh toán (giả lập)
        CredPayment->>CredPayment: Validate card info
        CredPayment->>CredPayment: Process payment (simulated)
        
        alt Payment failed
            CredPayment-->>PaySvc: throw PaymentException
            PaySvc-->>PayCtrl: Error
            PayCtrl-->>BE: Error Response
            BE-->>PayAPI: 400 Bad Request
            PayAPI-->>CreditCard: Error
            CreditCard-->>Customer: "Thanh toán thất bại"
        else Payment success
            CredPayment-->>PaySvc: "Payment successful"
            
            %% Bước 6: Cập nhật Order status
            PaySvc->>OrderRepo: findById(orderId)
            OrderRepo->>DB: SELECT * FROM orders
            DB-->>OrderRepo: Order
            OrderRepo-->>PaySvc: order
            
            PaySvc->>PaySvc: order.setOrderStatus(PAID)
            PaySvc->>OrderRepo: save(order)
            OrderRepo->>DB: UPDATE orders SET status = 'PAID'
            DB-->>OrderRepo: Updated
            
            PaySvc-->>PayCtrl: "Payment successful"
            PayCtrl-->>BE: ApiResponse<String>
            BE-->>PayAPI: 200 OK
            PayAPI-->>CreditCard: success
            
            %% Bước 7: Chuyển trang
            CreditCard->>FE: Navigate to OrderSuccess
            FE-->>Customer: Hiển thị "Thanh toán thành công"
        end
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

### 4.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Customer] -->|1. Chọn Credit Card| B[PaymentMethodSelector]
        B -->|2. render| C[CreditCardPayment]
        A -->|3. Nhập thông tin thẻ| C
        C -->|4. validate| C
        A -->|5. Click thanh toán| C
        C -->|6. processCreditCardPayment| D[paymentApi]
    end

    subgraph Backend
        D -->|7. POST /payment/credit-card| E[PayOrderController]
        E -->|8. payOrderByCreditCard| F[PaymentService]
        F -->|9. payOrder| G[CreditCardPaymentImpl]
        G -->|10. validate & process| G
        F -->|11. findById & save| H[OrderRepository]
        H -->|12. query| I[(Database)]
    end

    H -->|13. Order updated| F
    F -->|14. success| E
    E -->|15. ApiResponse| D
    D -->|16. response| C
    C -->|17. Navigate success| A
```

---


## Use Case 5: Select Delivery Method

### 5.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as Frontend (React)
    participant Checkout as CheckoutPage
    participant DeliveryForm as DeliveryInfoForm
    participant OrderAPI as orderApi
    participant BE as Backend API
    participant OrderCtrl as OrderController
    participant OrderSvc as OrderService
    participant DB as Database

    %% Bước 1: Customer vào trang checkout
    Customer->>Checkout: Navigate to Checkout
    Checkout->>Checkout: Load cart items
    Checkout->>DeliveryForm: Render DeliveryInfoForm
    
    %% Bước 2: Hiển thị các phương thức giao hàng
    DeliveryForm-->>Customer: Hiển thị options:
    Note over DeliveryForm,Customer: - STANDARD (Giao hàng tiêu chuẩn)<br/>- EXPRESS (Giao hàng nhanh)<br/>- SAME_DAY (Giao trong ngày)
    
    %% Bước 3: Customer chọn phương thức
    Customer->>DeliveryForm: Chọn delivery method
    DeliveryForm->>DeliveryForm: setDeliveryMethod(method)
    
    %% Bước 4: Tính phí giao hàng
    DeliveryForm->>DeliveryForm: calculateDeliveryFee(method, totalWeight)
    Note over DeliveryForm: STANDARD: 15,000 VND<br/>EXPRESS: 30,000 VND<br/>SAME_DAY: 50,000 VND
    
    DeliveryForm->>DeliveryForm: Update total amount display
    DeliveryForm-->>Customer: Hiển thị phí giao hàng + tổng tiền
    
    %% Bước 5: Customer nhập thông tin giao hàng
    Customer->>DeliveryForm: Nhập Recipient Name
    Customer->>DeliveryForm: Nhập Phone Number
    Customer->>DeliveryForm: Nhập Email
    Customer->>DeliveryForm: Nhập Street Address
    Customer->>DeliveryForm: Nhập City
    
    %% Bước 6: Validate form
    DeliveryForm->>DeliveryForm: validateDeliveryInfo()
    
    alt Validation failed
        DeliveryForm-->>Customer: Hiển thị lỗi validation
    else Validation passed
        %% Bước 7: Submit order với delivery info
        Customer->>Checkout: Click "Đặt hàng"
        Checkout->>OrderAPI: placeOrder(orderData)
        Note over Checkout,OrderAPI: orderData includes deliveryMethod
        
        OrderAPI->>BE: POST /api/orders/cart-order
        BE->>OrderCtrl: cartOrder(CartOrderRequest)
        OrderCtrl->>OrderSvc: placeCartOrder(request)
        
        %% Bước 8: Tạo DeliveryInfo
        OrderSvc->>OrderSvc: resolveDeliveryInfo(addressId, addressRequest, account)
        OrderSvc->>OrderSvc: Create DeliveryInfo entity
        OrderSvc->>OrderSvc: Set deliveryMethod from request
        OrderSvc->>OrderSvc: Calculate deliveryFee based on method
        
        %% Bước 9: Tạo Order với DeliveryInfo
        OrderSvc->>OrderSvc: Create Order with DeliveryInfo
        OrderSvc->>DB: Save Order + DeliveryInfo
        DB-->>OrderSvc: Order saved
        
        OrderSvc-->>OrderCtrl: OrderResponse
        OrderCtrl-->>BE: ApiResponse<OrderResponse>
        BE-->>OrderAPI: 200 OK + OrderResponse
        OrderAPI-->>Checkout: orderData
        
        Checkout->>FE: Navigate to Payment
        FE-->>Customer: Hiển thị trang thanh toán
    end
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

### 5.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Customer] -->|1. Vào checkout| B[CheckoutPage]
        B -->|2. render| C[DeliveryInfoForm]
        A -->|3. Chọn delivery method| C
        C -->|4. calculateDeliveryFee| C
        A -->|5. Nhập thông tin| C
        C -->|6. validate| C
        A -->|7. Click đặt hàng| B
        B -->|8. placeOrder| D[orderApi]
    end

    subgraph Backend
        D -->|9. POST /orders/cart-order| E[OrderController]
        E -->|10. placeCartOrder| F[OrderService]
        F -->|11. resolveDeliveryInfo| F
        F -->|12. calculateDeliveryFee| F
        F -->|13. save| G[OrderRepository]
        G -->|14. query| H[(Database)]
    end

    G -->|15. Order| F
    F -->|16. OrderResponse| E
    E -->|17. ApiResponse| D
    D -->|18. response| B
    B -->|19. Navigate payment| A
```

---

## Use Case 6: View Product Details

### 6.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as Frontend (React)
    participant HomePage as HomePage
    participant ProductCard as ProductCard
    participant ProductDetail as ProductDetailsPage
    participant ProductAPI as productApi
    participant BE as Backend API
    participant ProductCtrl as ProductController
    participant ProductSvc as ProductService
    participant ProductRepo as ProductRepository
    participant DB as Database

    %% Bước 1: Customer xem danh sách sản phẩm
    Customer->>HomePage: Truy cập trang chủ
    HomePage->>ProductAPI: getProducts()
    ProductAPI->>BE: GET /api/products
    BE->>ProductCtrl: getProducts()
    ProductCtrl->>ProductSvc: getAllProducts()
    ProductSvc->>ProductRepo: findAll()
    ProductRepo->>DB: SELECT * FROM products
    DB-->>ProductRepo: List<Product>
    ProductRepo-->>ProductSvc: products
    ProductSvc-->>ProductCtrl: List<ProductResponse>
    ProductCtrl-->>BE: ApiResponse<List>
    BE-->>ProductAPI: 200 OK + products
    ProductAPI-->>HomePage: products
    HomePage->>HomePage: Render ProductGrid
    HomePage-->>Customer: Hiển thị danh sách sản phẩm
    
    %% Bước 2: Customer click vào sản phẩm
    Customer->>ProductCard: Click vào sản phẩm
    ProductCard->>FE: Navigate to /products/{id}
    FE->>ProductDetail: Render ProductDetailsPage
    
    %% Bước 3: Load chi tiết sản phẩm
    ProductDetail->>ProductDetail: useEffect - fetch product
    ProductDetail->>ProductAPI: getProductById(productId)
    ProductAPI->>BE: GET /api/products/{id}
    
    BE->>ProductCtrl: getProduct(id)
    ProductCtrl->>ProductSvc: getProductById(id)
    ProductSvc->>ProductRepo: findById(id)
    ProductRepo->>DB: SELECT * FROM products WHERE id = ?
    DB-->>ProductRepo: Product
    
    alt Product không tồn tại
        ProductRepo-->>ProductSvc: Optional.empty()
        ProductSvc-->>ProductCtrl: throw AppException(PRODUCT_NOT_FOUND)
        ProductCtrl-->>BE: Error Response
        BE-->>ProductAPI: 404 Not Found
        ProductAPI-->>ProductDetail: Error
        ProductDetail-->>Customer: "Sản phẩm không tồn tại"
    else Product tồn tại
        ProductRepo-->>ProductSvc: product
        ProductSvc->>ProductSvc: Map to ProductResponse
        ProductSvc-->>ProductCtrl: ProductResponse
        ProductCtrl-->>BE: ApiResponse<ProductResponse>
        BE-->>ProductAPI: 200 OK + ProductResponse
        ProductAPI-->>ProductDetail: productData
        
        %% Bước 4: Hiển thị chi tiết
        ProductDetail->>ProductDetail: setProduct(productData)
        ProductDetail-->>Customer: Hiển thị chi tiết sản phẩm
        Note over ProductDetail,Customer: - Tên sản phẩm<br/>- Hình ảnh<br/>- Giá<br/>- Mô tả<br/>- Thông tin chi tiết (theo loại)<br/>- Số lượng tồn kho<br/>- Nút "Thêm vào giỏ"
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

### 6.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Customer] -->|1. Truy cập| B[HomePage]
        B -->|2. getProducts| C[productApi]
        C -->|response| B
        B -->|3. render| D[ProductCard]
        A -->|4. Click sản phẩm| D
        D -->|5. navigate| E[ProductDetailsPage]
        E -->|6. getProductById| C
    end

    subgraph Backend
        C -->|7. GET /products| F[ProductController]
        C -->|8. GET /products/id| F
        F -->|9. getAllProducts/getProductById| G[ProductService]
        G -->|10. findAll/findById| H[ProductRepository]
        H -->|11. query| I[(Database)]
    end

    H -->|12. Product| G
    G -->|13. ProductResponse| F
    F -->|14. ApiResponse| C
    C -->|15. productData| E
    E -->|16. Display details| A
```

---

## Use Case 7: Search Products

### 7.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant FE as Frontend (React)
    participant HomePage as HomePage
    participant SearchBar as SearchBar
    participant Filters as ProductFilters
    participant ProductAPI as productApi
    participant BE as Backend API
    participant ProductCtrl as ProductController
    participant ProductSvc as ProductService
    participant ProductRepo as ProductRepository
    participant DB as Database

    %% Bước 1: Customer nhập từ khóa tìm kiếm
    Customer->>SearchBar: Nhập keyword
    SearchBar->>SearchBar: setSearchTerm(keyword)
    
    %% Bước 2: Customer chọn filters (optional)
    Customer->>Filters: Chọn category (Book/CD/DVD/Newspaper)
    Filters->>Filters: setSelectedCategory(category)
    Customer->>Filters: Chọn price range
    Filters->>Filters: setPriceRange(min, max)
    Customer->>Filters: Chọn sort order
    Filters->>Filters: setSortBy(field, direction)
    
    %% Bước 3: Trigger search
    Customer->>SearchBar: Click "Tìm kiếm" hoặc Enter
    SearchBar->>HomePage: onSearch(searchParams)
    
    %% Bước 4: Gọi API với query params
    HomePage->>ProductAPI: searchProducts(params)
    ProductAPI->>BE: GET /api/products?keyword=...&category=...&minPrice=...&maxPrice=...&sortBy=...
    
    BE->>ProductCtrl: getProducts(queryParams)
    ProductCtrl->>ProductSvc: searchProducts(params)
    
    %% Bước 5: Query database với filters
    ProductSvc->>ProductRepo: findByFilters(params)
    ProductRepo->>DB: SELECT * FROM products WHERE name LIKE ? AND type = ? AND price BETWEEN ? AND ? ORDER BY ?
    DB-->>ProductRepo: List<Product>
    ProductRepo-->>ProductSvc: filteredProducts
    
    %% Bước 6: Trả về kết quả
    ProductSvc->>ProductSvc: Map to ProductResponse list
    ProductSvc-->>ProductCtrl: List<ProductResponse>
    ProductCtrl-->>BE: ApiResponse<List>
    BE-->>ProductAPI: 200 OK + products
    ProductAPI-->>HomePage: searchResults
    
    %% Bước 7: Hiển thị kết quả
    HomePage->>HomePage: setProducts(searchResults)
    HomePage->>HomePage: Render ProductGrid with results
    
    alt Không có kết quả
        HomePage-->>Customer: "Không tìm thấy sản phẩm phù hợp"
    else Có kết quả
        HomePage-->>Customer: Hiển thị danh sách sản phẩm tìm được
        Note over HomePage,Customer: Hiển thị số lượng kết quả + pagination
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
        +handleCategoryChange()
        +handlePriceChange()
        +handleSortChange()
        +applyFilters()
    }

    class HomePage {
        <<boundary>>
        +products: Product[]
        +searchParams: SearchParams
        +loading: boolean
        +handleSearch()
        +renderResults()
    }

    class ProductController {
        <<boundary>>
        +getProducts(queryParams)
    }

    %% Control Classes
    class ProductService {
        <<control>>
        +getAllProducts()
        +searchProducts(params)
        -applyFilters(products, params)
        -applySorting(products, sortBy)
    }

    %% Entity Classes
    class Product {
        <<entity>>
        -id: String
        -name: String
        -type: String
        -price: Double
        -description: String
    }

    class SearchParams {
        <<entity>>
        -keyword: String
        -category: String
        -minPrice: Double
        -maxPrice: Double
        -sortBy: String
        -sortDirection: String
        -page: Integer
        -size: Integer
    }

    class PriceRange {
        <<entity>>
        -min: number
        -max: number
    }

    %% Relationships
    HomePage --> SearchBar : contains
    HomePage --> ProductFilters : contains
    SearchBar ..> SearchParams : creates
    ProductFilters ..> SearchParams : modifies
    HomePage --> ProductController : calls
    ProductController --> ProductService : delegates
    ProductService --> Product : queries
    ProductFilters --> PriceRange : uses
```

### 7.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Customer] -->|1. Nhập keyword| B[SearchBar]
        A -->|2. Chọn filters| C[ProductFilters]
        B -->|3. onSearch| D[HomePage]
        C -->|4. applyFilters| D
        D -->|5. searchProducts| E[productApi]
    end

    subgraph Backend
        E -->|6. GET /products?params| F[ProductController]
        F -->|7. searchProducts| G[ProductService]
        G -->|8. findByFilters| H[ProductRepository]
        H -->|9. query| I[(Database)]
    end

    H -->|10. List~Product~| G
    G -->|11. List~ProductResponse~| F
    F -->|12. ApiResponse| E
    E -->|13. searchResults| D
    D -->|14. render results| A
```

---

## Use Case 8: Create Product

### 8.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant FE as Frontend (React)
    participant AdminPage as AdminProductPage
    participant ProductForm as ProductForm
    participant ProductAPI as productApi
    participant BE as Backend API
    participant Security as SecurityFilter
    participant ProductCtrl as ProductController
    participant ProductSvc as ProductService
    participant ProductRepo as ProductRepository
    participant DB as Database

    %% Bước 1: Admin truy cập trang quản lý
    Admin->>AdminPage: Navigate to Admin Products
    AdminPage->>AdminPage: Check admin role
    AdminPage-->>Admin: Hiển thị trang quản lý sản phẩm
    
    %% Bước 2: Admin click tạo sản phẩm mới
    Admin->>AdminPage: Click "Thêm sản phẩm"
    AdminPage->>ProductForm: Open ProductForm (create mode)
    ProductForm-->>Admin: Hiển thị form tạo sản phẩm
    
    %% Bước 3: Admin nhập thông tin sản phẩm
    Admin->>ProductForm: Nhập Product Name
    Admin->>ProductForm: Nhập Description
    Admin->>ProductForm: Nhập Price
    Admin->>ProductForm: Nhập Stock
    Admin->>ProductForm: Nhập Weight
    Admin->>ProductForm: Chọn Product Type (Book/CD/DVD/Newspaper)
    Admin->>ProductForm: Upload Image
    
    %% Bước 4: Nhập thông tin chi tiết theo loại
    alt Type = Book
        Admin->>ProductForm: Nhập Author, Publisher, ISBN, Pages
    else Type = CD
        Admin->>ProductForm: Nhập Artist, Record Label, Genre, Tracks
    else Type = DVD
        Admin->>ProductForm: Nhập Director, Studio, Runtime
    else Type = Newspaper
        Admin->>ProductForm: Nhập Publisher, Publish Date, Edition
    end
    
    %% Bước 5: Validate và submit
    Admin->>ProductForm: Click "Lưu"
    ProductForm->>ProductForm: validateForm()
    
    alt Validation failed
        ProductForm-->>Admin: Hiển thị lỗi validation
    else Validation passed
        ProductForm->>ProductAPI: createProduct(productData)
        ProductAPI->>BE: POST /api/products
        Note over ProductAPI,BE: Headers: Authorization: Bearer {JWT}
        
        %% Bước 6: Security check
        BE->>Security: Verify JWT Token
        Security->>Security: Check ADMIN role
        
        alt Không có quyền
            Security-->>BE: 403 Forbidden
            BE-->>ProductAPI: 403 Forbidden
            ProductAPI-->>ProductForm: Error
            ProductForm-->>Admin: "Bạn không có quyền thực hiện"
        else Có quyền ADMIN
            Security-->>BE: Authorized
            
            BE->>ProductCtrl: createProduct(ProductRequest)
            ProductCtrl->>ProductSvc: createProduct(request)
            
            %% Bước 7: Kiểm tra trùng tên
            ProductSvc->>ProductRepo: existsByName(productName)
            ProductRepo->>DB: SELECT EXISTS(...)
            DB-->>ProductRepo: boolean
            
            alt Tên đã tồn tại
                ProductRepo-->>ProductSvc: true
                ProductSvc-->>ProductCtrl: throw AppException(PRODUCT_EXISTED)
                ProductCtrl-->>BE: Error Response
                BE-->>ProductAPI: 400 Bad Request
                ProductAPI-->>ProductForm: Error
                ProductForm-->>Admin: "Sản phẩm đã tồn tại"
            else Tên chưa tồn tại
                %% Bước 8: Tạo Product entity
                ProductSvc->>ProductSvc: Map request to Product entity
                ProductSvc->>ProductSvc: Set type-specific fields
                ProductSvc->>ProductRepo: save(product)
                ProductRepo->>DB: INSERT INTO products
                DB-->>ProductRepo: Product saved
                ProductRepo-->>ProductSvc: product
                
                ProductSvc->>ProductSvc: Map to ProductResponse
                ProductSvc-->>ProductCtrl: ProductResponse
                ProductCtrl-->>BE: ApiResponse<ProductResponse>
                BE-->>ProductAPI: 201 Created + ProductResponse
                ProductAPI-->>ProductForm: productData
                
                ProductForm->>AdminPage: Close form + refresh list
                AdminPage-->>Admin: "Tạo sản phẩm thành công"
            end
        end
    end
```

### 8.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class AdminProductPage {
        <<boundary>>
        +products: Product[]
        +showForm: boolean
        +handleCreateClick()
        +handleEditClick(product)
        +handleDeleteClick(product)
        +refreshProductList()
    }

    class ProductForm {
        <<boundary>>
        +mode: 'create' | 'edit'
        +product: Product
        +productType: string
        +handleInputChange()
        +handleTypeChange()
        +handleImageUpload()
        +validateForm()
        +handleSubmit()
    }

    class ProductController {
        <<boundary>>
        +createProduct(request)
        +updateProduct(id, request)
        +deleteProduct(id)
    }

    %% Control Classes
    class SecurityFilter {
        <<control>>
        +doFilter(request, response)
        -verifyToken(token)
        -checkRole(requiredRole)
    }

    class ProductService {
        <<control>>
        +createProduct(request)
        +updateProduct(id, request)
        +deleteProduct(id)
        -mapToEntity(request)
        -mapToResponse(product)
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

    class ProductRequest {
        <<entity>>
        -name: String
        -description: String
        -price: Double
        -stock: Integer
        -weight: Double
        -type: String
        -imageUrl: String
        -typeSpecificFields: Map
    }

    %% Relationships
    AdminProductPage --> ProductForm : opens
    ProductForm --> ProductController : calls
    ProductController --> SecurityFilter : filtered by
    ProductController --> ProductService : delegates
    ProductService --> Product : creates
    ProductForm ..> ProductRequest : creates
```

### 8.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Admin] -->|1. Click thêm SP| B[AdminProductPage]
        B -->|2. open| C[ProductForm]
        A -->|3. Nhập thông tin| C
        C -->|4. validate| C
        A -->|5. Click lưu| C
        C -->|6. createProduct| D[productApi]
    end

    subgraph Backend
        D -->|7. POST /products| E[SecurityFilter]
        E -->|8. verify JWT| E
        E -->|9. check ADMIN role| E
        E -->|10. authorized| F[ProductController]
        F -->|11. createProduct| G[ProductService]
        G -->|12. existsByName| H[ProductRepository]
        G -->|13. save| H
        H -->|14. query| I[(Database)]
    end

    H -->|15. Product| G
    G -->|16. ProductResponse| F
    F -->|17. ApiResponse| D
    D -->|18. response| C
    C -->|19. close & refresh| B
    B -->|20. success message| A
```

---


## Use Case 9: Update Product

### 9.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant FE as Frontend (React)
    participant AdminPage as AdminProductPage
    participant ProductForm as ProductForm
    participant ProductAPI as productApi
    participant BE as Backend API
    participant Security as SecurityFilter
    participant ProductCtrl as ProductController
    participant ProductSvc as ProductService
    participant ProductRepo as ProductRepository
    participant DB as Database

    %% Bước 1: Admin xem danh sách sản phẩm
    Admin->>AdminPage: Navigate to Admin Products
    AdminPage->>ProductAPI: getProducts()
    ProductAPI->>BE: GET /api/products
    BE-->>ProductAPI: List<Product>
    ProductAPI-->>AdminPage: products
    AdminPage-->>Admin: Hiển thị danh sách sản phẩm
    
    %% Bước 2: Admin chọn sản phẩm để sửa
    Admin->>AdminPage: Click "Sửa" trên sản phẩm
    AdminPage->>ProductForm: Open ProductForm (edit mode, product)
    ProductForm->>ProductForm: Populate form với product data
    ProductForm-->>Admin: Hiển thị form với thông tin hiện tại
    
    %% Bước 3: Admin chỉnh sửa thông tin
    Admin->>ProductForm: Sửa Product Name
    Admin->>ProductForm: Sửa Description
    Admin->>ProductForm: Sửa Price
    Admin->>ProductForm: Sửa Stock
    Admin->>ProductForm: Sửa các trường khác...
    
    %% Bước 4: Submit update
    Admin->>ProductForm: Click "Cập nhật"
    ProductForm->>ProductForm: validateForm()
    
    alt Validation failed
        ProductForm-->>Admin: Hiển thị lỗi validation
    else Validation passed
        ProductForm->>ProductAPI: updateProduct(productId, productData)
        ProductAPI->>BE: PUT /api/products/{id}
        Note over ProductAPI,BE: Headers: Authorization: Bearer {JWT}
        
        %% Bước 5: Security check
        BE->>Security: Verify JWT Token
        Security->>Security: Check ADMIN role
        
        alt Không có quyền
            Security-->>BE: 403 Forbidden
            BE-->>ProductAPI: 403 Forbidden
            ProductAPI-->>ProductForm: Error
            ProductForm-->>Admin: "Bạn không có quyền thực hiện"
        else Có quyền ADMIN
            Security-->>BE: Authorized
            
            BE->>ProductCtrl: updateProduct(id, ProductRequest)
            ProductCtrl->>ProductSvc: updateProduct(id, request)
            
            %% Bước 6: Tìm Product hiện tại
            ProductSvc->>ProductRepo: findById(id)
            ProductRepo->>DB: SELECT * FROM products WHERE id = ?
            DB-->>ProductRepo: Product
            
            alt Product không tồn tại
                ProductRepo-->>ProductSvc: Optional.empty()
                ProductSvc-->>ProductCtrl: throw AppException(PRODUCT_NOT_FOUND)
                ProductCtrl-->>BE: Error Response
                BE-->>ProductAPI: 404 Not Found
                ProductAPI-->>ProductForm: Error
                ProductForm-->>Admin: "Sản phẩm không tồn tại"
            else Product tồn tại
                ProductRepo-->>ProductSvc: existingProduct
                
                %% Bước 7: Cập nhật Product
                ProductSvc->>ProductSvc: Update product fields from request
                ProductSvc->>ProductSvc: productMapper.updateProduct(product, request)
                ProductSvc->>ProductRepo: save(updatedProduct)
                ProductRepo->>DB: UPDATE products SET ... WHERE id = ?
                DB-->>ProductRepo: Product updated
                ProductRepo-->>ProductSvc: product
                
                ProductSvc->>ProductSvc: Map to ProductResponse
                ProductSvc-->>ProductCtrl: ProductResponse
                ProductCtrl-->>BE: ApiResponse<ProductResponse>
                BE-->>ProductAPI: 200 OK + ProductResponse
                ProductAPI-->>ProductForm: productData
                
                ProductForm->>AdminPage: Close form + refresh list
                AdminPage-->>Admin: "Cập nhật sản phẩm thành công"
            end
        end
    end
```

### 9.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class AdminProductPage {
        <<boundary>>
        +products: Product[]
        +selectedProduct: Product
        +handleEditClick(product)
        +refreshProductList()
    }

    class ProductForm {
        <<boundary>>
        +mode: 'create' | 'edit'
        +product: Product
        +originalProduct: Product
        +handleInputChange()
        +validateForm()
        +handleUpdate()
        +hasChanges()
    }

    class ProductController {
        <<boundary>>
        +updateProduct(id, request)
    }

    %% Control Classes
    class ProductService {
        <<control>>
        +updateProduct(id, request)
        -validateProductExists(id)
        -mapRequestToEntity(product, request)
    }

    class ProductMapper {
        <<control>>
        +updateProduct(product, request)
        +toProductResponse(product)
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
        -createdAt: LocalDateTime
        -updatedAt: LocalDateTime
    }

    class ProductRequest {
        <<entity>>
        -name: String
        -description: String
        -price: Double
        -stock: Integer
        -weight: Double
        -imageUrl: String
    }

    %% Relationships
    AdminProductPage --> ProductForm : opens
    ProductForm --> ProductController : calls
    ProductController --> ProductService : delegates
    ProductService --> ProductMapper : uses
    ProductService --> Product : updates
    ProductForm ..> ProductRequest : creates
    ProductMapper --> Product : maps
```

### 9.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Admin] -->|1. Click sửa| B[AdminProductPage]
        B -->|2. open edit mode| C[ProductForm]
        C -->|3. populate data| C
        A -->|4. Sửa thông tin| C
        A -->|5. Click cập nhật| C
        C -->|6. updateProduct| D[productApi]
    end

    subgraph Backend
        D -->|7. PUT /products/id| E[SecurityFilter]
        E -->|8. verify & authorize| E
        E -->|9. pass| F[ProductController]
        F -->|10. updateProduct| G[ProductService]
        G -->|11. findById| H[ProductRepository]
        G -->|12. updateProduct| I[ProductMapper]
        G -->|13. save| H
        H -->|14. query| J[(Database)]
    end

    H -->|15. Product| G
    G -->|16. ProductResponse| F
    F -->|17. ApiResponse| D
    D -->|18. response| C
    C -->|19. close & refresh| B
    B -->|20. success message| A
```

---

## Use Case 10: Delete Product

### 10.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant FE as Frontend (React)
    participant AdminPage as AdminProductPage
    participant ConfirmDialog as ConfirmDialog
    participant ProductAPI as productApi
    participant BE as Backend API
    participant Security as SecurityFilter
    participant ProductCtrl as ProductController
    participant ProductSvc as ProductService
    participant ProductRepo as ProductRepository
    participant DB as Database

    %% Bước 1: Admin xem danh sách sản phẩm
    Admin->>AdminPage: Navigate to Admin Products
    AdminPage-->>Admin: Hiển thị danh sách sản phẩm
    
    %% Bước 2: Admin click xóa sản phẩm
    Admin->>AdminPage: Click "Xóa" trên sản phẩm
    AdminPage->>ConfirmDialog: Show confirmation dialog
    ConfirmDialog-->>Admin: "Bạn có chắc muốn xóa sản phẩm này?"
    
    alt Admin hủy
        Admin->>ConfirmDialog: Click "Hủy"
        ConfirmDialog->>AdminPage: Close dialog
    else Admin xác nhận
        Admin->>ConfirmDialog: Click "Xác nhận"
        ConfirmDialog->>AdminPage: onConfirm(productId)
        
        %% Bước 3: Gọi API xóa
        AdminPage->>ProductAPI: deleteProduct(productId)
        ProductAPI->>BE: DELETE /api/products/{id}
        Note over ProductAPI,BE: Headers: Authorization: Bearer {JWT}
        
        %% Bước 4: Security check
        BE->>Security: Verify JWT Token
        Security->>Security: Check ADMIN role
        
        alt Không có quyền
            Security-->>BE: 403 Forbidden
            BE-->>ProductAPI: 403 Forbidden
            ProductAPI-->>AdminPage: Error
            AdminPage-->>Admin: "Bạn không có quyền thực hiện"
        else Có quyền ADMIN
            Security-->>BE: Authorized
            
            BE->>ProductCtrl: deleteProduct(id)
            ProductCtrl->>ProductSvc: deleteProduct(id)
            
            %% Bước 5: Kiểm tra Product tồn tại
            ProductSvc->>ProductRepo: existsById(id)
            ProductRepo->>DB: SELECT EXISTS(...)
            DB-->>ProductRepo: boolean
            
            alt Product không tồn tại
                ProductRepo-->>ProductSvc: false
                ProductSvc-->>ProductCtrl: throw AppException(PRODUCT_NOT_FOUND)
                ProductCtrl-->>BE: Error Response
                BE-->>ProductAPI: 404 Not Found
                ProductAPI-->>AdminPage: Error
                AdminPage-->>Admin: "Sản phẩm không tồn tại"
            else Product tồn tại
                %% Bước 6: Xóa Product (soft delete hoặc hard delete)
                ProductSvc->>ProductRepo: deleteById(id)
                ProductRepo->>DB: DELETE FROM products WHERE id = ?
                Note over ProductRepo,DB: Hoặc UPDATE products SET active = false
                DB-->>ProductRepo: Deleted
                ProductRepo-->>ProductSvc: void
                
                ProductSvc-->>ProductCtrl: void
                ProductCtrl-->>BE: ApiResponse<Void>
                BE-->>ProductAPI: 200 OK
                ProductAPI-->>AdminPage: success
                
                %% Bước 7: Cập nhật UI
                AdminPage->>AdminPage: Remove product from list
                AdminPage-->>Admin: "Xóa sản phẩm thành công"
            end
        end
    end
```

### 10.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class AdminProductPage {
        <<boundary>>
        +products: Product[]
        +handleDeleteClick(product)
        +removeProductFromList(productId)
        +showSuccessMessage()
        +showErrorMessage()
    }

    class ConfirmDialog {
        <<boundary>>
        +isOpen: boolean
        +title: string
        +message: string
        +onConfirm: Function
        +onCancel: Function
        +show()
        +hide()
    }

    class ProductController {
        <<boundary>>
        +deleteProduct(id)
    }

    %% Control Classes
    class ProductService {
        <<control>>
        +deleteProduct(id)
        -validateProductExists(id)
        -checkProductInUse(id)
    }

    %% Entity Classes
    class Product {
        <<entity>>
        -id: String
        -name: String
        -active: Boolean
    }

    %% Relationships
    AdminProductPage --> ConfirmDialog : shows
    AdminProductPage --> ProductController : calls
    ProductController --> ProductService : delegates
    ProductService --> Product : deletes
```

### 10.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[Admin] -->|1. Click xóa| B[AdminProductPage]
        B -->|2. show| C[ConfirmDialog]
        A -->|3. Xác nhận| C
        C -->|4. onConfirm| B
        B -->|5. deleteProduct| D[productApi]
    end

    subgraph Backend
        D -->|6. DELETE /products/id| E[SecurityFilter]
        E -->|7. verify & authorize| E
        E -->|8. pass| F[ProductController]
        F -->|9. deleteProduct| G[ProductService]
        G -->|10. existsById| H[ProductRepository]
        G -->|11. deleteById| H
        H -->|12. query| I[(Database)]
    end

    H -->|13. void| G
    G -->|14. void| F
    F -->|15. ApiResponse| D
    D -->|16. success| B
    B -->|17. remove from list| B
    B -->|18. success message| A
```

---

## Use Case 11: Log In

### 11.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend (React)
    participant LoginPage as LoginPage
    participant AuthCtx as AuthContext
    participant AuthAPI as authApi
    participant BE as Backend API
    participant AuthCtrl as AuthenticationController
    participant AuthSvc as AuthenticationService
    participant AccountRepo as AccountRepository
    participant TokenRepo as InvalidatedTokenRepository
    participant DB as Database

    %% Bước 1: User truy cập trang login
    User->>LoginPage: Navigate to /login
    LoginPage-->>User: Hiển thị form đăng nhập
    
    %% Bước 2: User nhập thông tin
    User->>LoginPage: Nhập Username
    User->>LoginPage: Nhập Password
    
    %% Bước 3: Submit login
    User->>LoginPage: Click "Đăng nhập"
    LoginPage->>LoginPage: validateForm()
    
    alt Validation failed
        LoginPage-->>User: Hiển thị lỗi validation
    else Validation passed
        LoginPage->>AuthCtx: login(username, password)
        AuthCtx->>AuthAPI: login(credentials)
        AuthAPI->>BE: POST /api/auth/login
        Note over AuthAPI,BE: Body: {username, password}
        
        BE->>AuthCtrl: login(AuthenticationRequest)
        AuthCtrl->>AuthSvc: authenticate(request)
        
        %% Bước 4: Tìm Account
        AuthSvc->>AccountRepo: findByUsername(username)
        AccountRepo->>DB: SELECT * FROM accounts WHERE username = ?
        DB-->>AccountRepo: Account
        
        alt Account không tồn tại
            AccountRepo-->>AuthSvc: Optional.empty()
            AuthSvc-->>AuthCtrl: throw AppException(USER_NOT_EXISTED)
            AuthCtrl-->>BE: Error Response
            BE-->>AuthAPI: 401 Unauthorized
            AuthAPI-->>AuthCtx: Error
            AuthCtx-->>LoginPage: Error
            LoginPage-->>User: "Tài khoản không tồn tại"
        else Account tồn tại
            AccountRepo-->>AuthSvc: account
            
            %% Bước 5: Verify password
            AuthSvc->>AuthSvc: passwordEncoder.matches(password, account.password)
            
            alt Password không đúng
                AuthSvc-->>AuthCtrl: throw AppException(UNAUTHENTICATED)
                AuthCtrl-->>BE: Error Response
                BE-->>AuthAPI: 401 Unauthorized
                AuthAPI-->>AuthCtx: Error
                AuthCtx-->>LoginPage: Error
                LoginPage-->>User: "Mật khẩu không đúng"
            else Password đúng
                %% Bước 6: Generate JWT Token
                AuthSvc->>AuthSvc: generateToken(account)
                Note over AuthSvc: JWT contains: sub=username, scope=roles, exp=expiry
                AuthSvc->>AuthSvc: Sign token with SIGNER_KEY (HS512)
                
                %% Bước 7: Trả về response
                AuthSvc-->>AuthCtrl: AuthenticationResponse(token, authenticated=true)
                AuthCtrl-->>BE: ApiResponse<AuthenticationResponse>
                BE-->>AuthAPI: 200 OK + {token, authenticated}
                AuthAPI-->>AuthCtx: authData
                
                %% Bước 8: Lưu token và cập nhật state
                AuthCtx->>AuthCtx: localStorage.setItem('token', token)
                AuthCtx->>AuthCtx: setUser(decodedUser)
                AuthCtx->>AuthCtx: setIsAuthenticated(true)
                
                AuthCtx-->>LoginPage: success
                LoginPage->>FE: Navigate to HomePage
                FE-->>User: Chuyển về trang chủ + Hiển thị user info
            end
        end
    end
```

### 11.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class LoginPage {
        <<boundary>>
        +username: string
        +password: string
        +error: string
        +loading: boolean
        +handleInputChange()
        +validateForm()
        +handleSubmit()
        +displayError()
    }

    class AuthenticationController {
        <<boundary>>
        +login(request)
        +introspect(request)
        +logout(request)
    }

    %% Control Classes
    class AuthContext {
        <<control>>
        +user: User
        +isAuthenticated: boolean
        +token: string
        +login(username, password)
        +logout()
        +checkAuth()
        -saveToken(token)
        -decodeToken(token)
    }

    class AuthenticationService {
        <<control>>
        -accountRepository: AccountRepository
        -passwordEncoder: PasswordEncoder
        -SIGNER_KEY: String
        +authenticate(request)
        +introspect(request)
        +logout(request)
        -generateToken(account)
        -verifyToken(token)
        -buildScope(account)
    }

    %% Entity Classes
    class Account {
        <<entity>>
        -id: String
        -username: String
        -password: String
        -email: String
        -fullName: String
        -roles: List~Role~
    }

    class Role {
        <<entity>>
        -id: String
        -name: String
        -description: String
    }

    class AuthenticationRequest {
        <<entity>>
        -username: String
        -password: String
    }

    class AuthenticationResponse {
        <<entity>>
        -token: String
        -authenticated: boolean
    }

    %% Relationships
    LoginPage --> AuthContext : uses
    LoginPage --> AuthenticationController : calls
    AuthenticationController --> AuthenticationService : delegates
    AuthenticationService --> Account : authenticates
    Account "1" --> "*" Role : has
    LoginPage ..> AuthenticationRequest : creates
    AuthenticationService ..> AuthenticationResponse : returns
```

### 11.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[User] -->|1. Nhập credentials| B[LoginPage]
        B -->|2. validate| B
        B -->|3. login| C[AuthContext]
        C -->|4. login| D[authApi]
    end

    subgraph Backend
        D -->|5. POST /auth/login| E[AuthenticationController]
        E -->|6. authenticate| F[AuthenticationService]
        F -->|7. findByUsername| G[AccountRepository]
        G -->|8. query| H[(Database)]
        G -->|9. Account| F
        F -->|10. verify password| F
        F -->|11. generateToken| F
    end

    F -->|12. AuthResponse| E
    E -->|13. ApiResponse| D
    D -->|14. {token}| C
    C -->|15. save token| C
    C -->|16. setUser| C
    C -->|17. success| B
    B -->|18. navigate home| A
```

---

## Use Case 12: Log Out

### 12.1 Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend (React)
    participant Header as Header/Navbar
    participant AuthCtx as AuthContext
    participant AuthAPI as authApi
    participant BE as Backend API
    participant AuthCtrl as AuthenticationController
    participant AuthSvc as AuthenticationService
    participant TokenRepo as InvalidatedTokenRepository
    participant DB as Database

    %% Bước 1: User click logout
    User->>Header: Click "Đăng xuất"
    Header->>AuthCtx: logout()
    
    %% Bước 2: Lấy token hiện tại
    AuthCtx->>AuthCtx: Get token from localStorage
    
    %% Bước 3: Gọi API logout
    AuthCtx->>AuthAPI: logout(token)
    AuthAPI->>BE: POST /api/auth/logout
    Note over AuthAPI,BE: Body: {token}
    
    BE->>AuthCtrl: logout(LogoutRequest)
    AuthCtrl->>AuthSvc: logout(request)
    
    %% Bước 4: Verify token
    AuthSvc->>AuthSvc: verifyToken(token)
    AuthSvc->>AuthSvc: Parse JWT và lấy jit (JWT ID)
    AuthSvc->>AuthSvc: Lấy expiryTime từ token
    
    alt Token không hợp lệ
        AuthSvc-->>AuthCtrl: throw AppException(UNAUTHENTICATED)
        AuthCtrl-->>BE: Error Response
        BE-->>AuthAPI: 401 Unauthorized
        Note over AuthAPI: Vẫn tiếp tục clear local state
    else Token hợp lệ
        %% Bước 5: Invalidate token
        AuthSvc->>AuthSvc: Create InvalidatedToken(jit, expiryTime)
        AuthSvc->>TokenRepo: save(invalidatedToken)
        TokenRepo->>DB: INSERT INTO invalidated_tokens
        DB-->>TokenRepo: Saved
        TokenRepo-->>AuthSvc: invalidatedToken
        
        AuthSvc-->>AuthCtrl: void
        AuthCtrl-->>BE: ApiResponse<Void>
        BE-->>AuthAPI: 200 OK
    end
    
    AuthAPI-->>AuthCtx: response
    
    %% Bước 6: Clear local state (luôn thực hiện)
    AuthCtx->>AuthCtx: localStorage.removeItem('token')
    AuthCtx->>AuthCtx: setUser(null)
    AuthCtx->>AuthCtx: setIsAuthenticated(false)
    
    %% Bước 7: Redirect
    AuthCtx->>FE: Navigate to LoginPage
    FE-->>User: Chuyển về trang đăng nhập
```

### 12.2 Analysis Class Diagram

```mermaid
classDiagram
    %% Boundary Classes
    class Header {
        <<boundary>>
        +user: User
        +isAuthenticated: boolean
        +handleLogout()
        +displayUserInfo()
    }

    class AuthenticationController {
        <<boundary>>
        +logout(request)
    }

    %% Control Classes
    class AuthContext {
        <<control>>
        +user: User
        +isAuthenticated: boolean
        +token: string
        +logout()
        -clearToken()
        -clearUserState()
        -redirectToLogin()
    }

    class AuthenticationService {
        <<control>>
        -invalidatedTokenRepository: InvalidatedTokenRepository
        +logout(request)
        -verifyToken(token)
        -extractJwtId(token)
        -extractExpiry(token)
    }

    %% Entity Classes
    class InvalidatedToken {
        <<entity>>
        -id: String
        -expiryTime: Date
    }

    class LogoutRequest {
        <<entity>>
        -token: String
    }

    %% Relationships
    Header --> AuthContext : uses
    Header --> AuthenticationController : calls
    AuthenticationController --> AuthenticationService : delegates
    AuthenticationService --> InvalidatedToken : creates
    Header ..> LogoutRequest : creates
```

### 12.3 Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        A[User] -->|1. Click logout| B[Header]
        B -->|2. logout| C[AuthContext]
        C -->|3. get token| C
        C -->|4. logout| D[authApi]
    end

    subgraph Backend
        D -->|5. POST /auth/logout| E[AuthenticationController]
        E -->|6. logout| F[AuthenticationService]
        F -->|7. verifyToken| F
        F -->|8. create InvalidatedToken| F
        F -->|9. save| G[InvalidatedTokenRepository]
        G -->|10. insert| H[(Database)]
    end

    G -->|11. saved| F
    F -->|12. void| E
    E -->|13. ApiResponse| D
    D -->|14. response| C
    C -->|15. clear localStorage| C
    C -->|16. clear state| C
    C -->|17. navigate| B
    B -->|18. redirect login| A
```

---

## Tổng Kết

### Bảng Tóm Tắt Các Use Case

| Use Case | Actor | Boundary Classes | Control Classes | Entity Classes |
|----------|-------|------------------|-----------------|----------------|
| UC1: Place Order | Customer | CheckoutPage, OrderController | CartContext, OrderService | Order, OrderItem, DeliveryInfo, CartItem |
| UC2: Add to Cart | Customer | ProductDetailsPage, CartItemController | CartContext, CartItemService | Cart, CartItem, Product |
| UC3: Pay VietQR | Customer | VietQRPayment, PayOrderController | PaymentService, VietQRPaymentImpl | Order |
| UC4: Pay Credit Card | Customer | CreditCardPayment, PayOrderController | PaymentService, CreditCardPaymentImpl | Order, PaymentData |
| UC5: Select Delivery | Customer | DeliveryInfoForm, OrderController | OrderService | DeliveryInfo, DeliveryMethod |
| UC6: View Product | Customer | ProductDetailsPage, ProductController | ProductService | Product, Book, CD, DVD |
| UC7: Search Products | Customer | SearchBar, ProductFilters, ProductController | ProductService | Product, SearchParams |
| UC8: Create Product | Admin | ProductForm, ProductController | SecurityFilter, ProductService | Product |
| UC9: Update Product | Admin | ProductForm, ProductController | ProductService, ProductMapper | Product |
| UC10: Delete Product | Admin | ConfirmDialog, ProductController | ProductService | Product |
| UC11: Log In | User | LoginPage, AuthenticationController | AuthContext, AuthenticationService | Account, Role |
| UC12: Log Out | User | Header, AuthenticationController | AuthContext, AuthenticationService | InvalidatedToken |

### API Endpoints Summary

| Method | Endpoint | Use Case | Auth Required |
|--------|----------|----------|---------------|
| POST | /api/auth/login | UC11 | No |
| POST | /api/auth/logout | UC12 | Yes |
| GET | /api/products | UC6, UC7 | No |
| GET | /api/products/{id} | UC6 | No |
| POST | /api/products | UC8 | Admin |
| PUT | /api/products/{id} | UC9 | Admin |
| DELETE | /api/products/{id} | UC10 | Admin |
| POST | /api/cart-items | UC2 | No (Guest/User) |
| GET | /api/cart-items | UC2 | No (Guest/User) |
| POST | /api/orders/cart-order | UC1, UC5 | Yes |
| POST | /api/payment/pay-order | UC3 | Yes |
| GET | /api/payment/verify/{id} | UC3 | Yes |
| POST | /api/payment/credit-card | UC4 | Yes |

---

*Tài liệu được tạo tự động từ source code của hệ thống AIMS*
*Ngày tạo: 04/01/2026*
