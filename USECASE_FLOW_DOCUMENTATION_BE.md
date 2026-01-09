# Tài Liệu Mô Tả Chi Tiết Luồng Backend - AIMS

## Mục Lục
1. [Use Case: Login/Logout](#1-use-case-loginlogout)
2. [Use Case: Search Products](#2-use-case-search-products)
3. [Use Case: View Product Details](#3-use-case-view-product-details)
4. [Use Case: Add To Cart](#4-use-case-add-to-cart)
5. [Use Case: Place Order](#5-use-case-place-order)
6. [Use Case: Select Delivery Method](#6-use-case-select-delivery-method)
7. [Use Case: Pay Order](#7-use-case-pay-order)

---

## Tổng Quan Kiến Trúc Backend

### Package Structure
```
com.harkins.AIMS_BE/
├── controller/          # REST API endpoints
├── service/             # Business logic
├── repository/          # Data access layer (JPA)
├── entity/              # JPA entities
├── dto/
│   ├── request/         # Request DTOs
│   └── response/        # Response DTOs
├── mapper/              # Entity ↔ DTO mapping (MapStruct)
├── exception/           # Custom exceptions & error codes
├── enums/               # Enums (OrderStatus, PaymentMethod, ...)
├── configuration/       # Security, JWT config
├── payment/             # Payment integrations (VietQR, PayPal)
└── validator/           # Custom validators
```

### Công Nghệ Sử Dụng
- **Framework:** Spring Boot
- **Security:** Spring Security + JWT (Nimbus JOSE)
- **Database:** JPA/Hibernate
- **Mapping:** MapStruct
- **Build:** Maven

---

## 1. Use Case: Login/Logout

### 1.1 Tổng Quan Luồng Login

```
Client → POST /auth/token → AuthenticationController → AuthenticationService
                                                              ↓
                                                    AccountRepository.findByUsername()
                                                              ↓
                                                    PasswordEncoder.matches()
                                                              ↓
                                                    generateToken() → JWT
                                                              ↓
                                                    AuthenticationResponse
```

### 1.2 Chi Tiết Các File và Dòng Code

#### A. Controller Layer
**File:** `controller/AuthenticationController.java` (dòng 48-53)

```java
@PostMapping("/token")
public ApiResponse<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
    return ApiResponse.<AuthenticationResponse>builder()
            .result(authenticationService.authenticate(request))
            .build();
}
```
- **Endpoint:** `POST /auth/token`
- **Request Body:** `AuthenticationRequest` gồm `username`, `password`
- **Response:** `ApiResponse<AuthenticationResponse>` chứa JWT token

#### B. Service Layer - Authentication
**File:** `service/AuthenticationService.java` (dòng 65-82)

```java
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
```

#### C. JWT Token Generation
**File:** `service/AuthenticationService.java` (dòng 105-130)

```java
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
    jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
    
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
```

### 1.3 Tổng Quan Luồng Logout

```
Client → POST /auth/logout → AuthenticationController → AuthenticationService
                                                              ↓
                                                    verifyToken() → SignedJWT
                                                              ↓
                                                    Lấy jwtID + expiryTime
                                                              ↓
                                                    InvalidatedTokenRepository.save()
```

#### A. Logout Endpoint
**File:** `controller/AuthenticationController.java` (dòng 62-68)

```java
@PostMapping("/logout")
public ApiResponse<Void> logout(@RequestBody LogoutRequest request)
        throws ParseException, JOSEException {
    authenticationService.logout(request);
    return ApiResponse.<Void>builder().build();
}
```

#### B. Logout Service Logic
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
```

### 1.4 Token Introspection
**File:** `service/AuthenticationService.java` (dòng 55-63)

```java
public IntrospectResponse introspect(IntrospectRequest request)
        throws JOSEException, ParseException {
    var token = request.token();
    boolean isValid = true;

    try {
        verifyToken(token);  // Verify signature + expiry + blacklist
    } catch (WebException e) {
        isValid = false;
    }

    return IntrospectResponse.builder()
            .valid(isValid)
            .build();
}
```

### 1.5 Sơ Đồ Sequence Login

```
┌─────────┐     ┌────────────────────┐     ┌─────────────────────┐     ┌───────────────────┐
│ Client  │     │ AuthController     │     │ AuthService         │     │ AccountRepository │
└────┬────┘     └─────────┬──────────┘     └──────────┬──────────┘     └─────────┬─────────┘
     │                    │                           │                          │
     │ POST /auth/token   │                           │                          │
     │ {username,password}│                           │                          │
     │───────────────────>│                           │                          │
     │                    │                           │                          │
     │                    │ authenticate(request)     │                          │
     │                    │──────────────────────────>│                          │
     │                    │                           │                          │
     │                    │                           │ findByUsername(username) │
     │                    │                           │─────────────────────────>│
     │                    │                           │                          │
     │                    │                           │        Account           │
     │                    │                           │<─────────────────────────│
     │                    │                           │                          │
     │                    │                           │ passwordEncoder.matches()│
     │                    │                           │ generateToken(account)   │
     │                    │                           │                          │
     │                    │ AuthenticationResponse    │                          │
     │                    │ {authenticated, token}    │                          │
     │                    │<──────────────────────────│                          │
     │                    │                           │                          │
     │ ApiResponse        │                           │                          │
     │ {result: {token}}  │                           │                          │
     │<───────────────────│                           │                          │
```

---

## 2. Use Case: Search Products

### 2.1 Tổng Quan Luồng

```
Client → GET /product → ProductController → ProductService
                                                  ↓
                                        ProductRepository.findAll()
                                                  ↓
                                        ProductMapper.toProductResponse()
                                                  ↓
                                        List<ProductResponse>
```

### 2.2 Chi Tiết Các File và Dòng Code

#### A. Controller Layer
**File:** `controller/ProductController.java` (dòng 55-60)

```java
@GetMapping
public ApiResponse<List<ProductResponse>> getProducts() {
    return ApiResponse.<List<ProductResponse>>builder()
            .result(productService.getAllProducts())
            .build();
}
```
- **Endpoint:** `GET /product`
- **Response:** `ApiResponse<List<ProductResponse>>` chứa danh sách tất cả sản phẩm

#### B. Service Layer
**File:** `service/ProductService.java` (dòng 55-60)

```java
public List<ProductResponse> getAllProducts() {
    return productRepository.findAll()
            .stream()
            .map(productMapper::toProductResponse)
            .collect(Collectors.toList());
}
```
- **Chức năng:** Lấy tất cả products từ database và map sang DTO
- **Lưu ý:** Search/filter được thực hiện ở Frontend (client-side filtering)

#### C. Repository Layer
**File:** `repository/ProductRepository.java`

```java
public interface ProductRepository extends JpaRepository<Product, String> {
    boolean existsByName(String name);
}
```
- **Kế thừa:** `JpaRepository` cung cấp `findAll()`, `findById()`, `save()`, `delete()`

### 2.3 Sơ Đồ Sequence

```
┌─────────┐     ┌───────────────────┐     ┌────────────────┐     ┌───────────────────┐
│ Client  │     │ ProductController │     │ ProductService │     │ ProductRepository │
└────┬────┘     └─────────┬─────────┘     └───────┬────────┘     └─────────┬─────────┘
     │                    │                       │                        │
     │ GET /product       │                       │                        │
     │───────────────────>│                       │                        │
     │                    │                       │                        │
     │                    │ getAllProducts()      │                        │
     │                    │──────────────────────>│                        │
     │                    │                       │                        │
     │                    │                       │ findAll()              │
     │                    │                       │───────────────────────>│
     │                    │                       │                        │
     │                    │                       │   List<Product>        │
     │                    │                       │<───────────────────────│
     │                    │                       │                        │
     │                    │                       │ map → ProductResponse  │
     │                    │                       │                        │
     │                    │ List<ProductResponse> │                        │
     │                    │<──────────────────────│                        │
     │                    │                       │                        │
     │ ApiResponse        │                       │                        │
     │<───────────────────│                       │                        │
```

---

## 3. Use Case: View Product Details

### 3.1 Tổng Quan Luồng

```
Client → GET /product/{id} → ProductController → ProductService
                                                       ↓
                                           ProductRepository.findById()
                                                       ↓
                                           ProductMapper.toProductResponse()
                                                       ↓
                                           ProductResponse
```

### 3.2 Chi Tiết Các File và Dòng Code

#### A. Controller Layer
**File:** `controller/ProductController.java` (dòng 48-53)

```java
@GetMapping("/{id}")
public ApiResponse<ProductResponse> getProduct(@PathVariable("id") String id) {
    return ApiResponse.<ProductResponse>builder()
            .result(productService.getProductById(id))
            .build();
}
```
- **Endpoint:** `GET /product/{id}`
- **Path Variable:** `id` - Product ID
- **Response:** `ApiResponse<ProductResponse>` chứa thông tin chi tiết sản phẩm

#### B. Service Layer
**File:** `service/ProductService.java` (dòng 48-52)

```java
public ProductResponse getProductById(String id) {
    return productMapper.toProductResponse(
        productRepository.findById(id)
            .orElseThrow(() -> new WebException(ErrorCode.PRODUCT_NOT_FOUND))
    );
}
```
- **Chức năng:** Tìm product theo ID, throw exception nếu không tìm thấy
- **Error Code:** `PRODUCT_NOT_FOUND` (1009)

---

## 4. Use Case: Add To Cart

### 4.1 Tổng Quan Luồng

```
Client → POST /cartItem → CartItemController → CartItemService
                                                     ↓
                                         Xác định Cart (Account hoặc Guest)
                                                     ↓
                                         ProductRepository.findById()
                                                     ↓
                                         Kiểm tra sản phẩm đã có trong cart?
                                                     ↓
                                    ┌────────────────┴────────────────┐
                                    │                                 │
                              Có: Update quantity              Không: Tạo mới
                                    │                                 │
                                    └────────────────┬────────────────┘
                                                     ↓
                                         CartItemRepository.save()
                                                     ↓
                                         Set Cookie GUEST_CART_ID (nếu guest)
```

### 4.2 Chi Tiết Các File và Dòng Code

#### A. Controller Layer
**File:** `controller/CartItemController.java` (dòng 50-75)

```java
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
```
- **Endpoint:** `POST /cartItem`
- **Request Body:** `CartItemRequest` gồm `productId`, `quantity`, `accountId` (optional)
- **Cookie:** `GUEST_CART_ID` - UUID cho guest user
- **Response:** `CartItemResponse` chứa thông tin cart item đã thêm

#### B. Service Layer - Add To Cart Logic
**File:** `service/CartItemService.java` (dòng 40-105)

```java
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
        cartItem.calTotalPrice();  // Tính lại totalPrice
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
```

#### C. Guest Cart Handler
**File:** `service/CartItemService.java` (dòng 107-125)

```java
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
```

### 4.3 Get Cart Items
**File:** `controller/CartItemController.java` (dòng 90-110)

```java
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
```
- **Endpoint:** `GET /cartItem/list`
- **Query Params:** `accountId`, `guestUuid` (optional)
- **Cookie Fallback:** Đọc `GUEST_CART_ID` từ cookie nếu không có params

### 4.4 Sơ Đồ Sequence Add To Cart

```
┌─────────┐     ┌────────────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Client  │     │ CartItemController │     │ CartItemService │     │ Repositories   │
└────┬────┘     └─────────┬──────────┘     └────────┬────────┘     └───────┬────────┘
     │                    │                         │                      │
     │ POST /cartItem     │                         │                      │
     │ {productId, qty}   │                         │                      │
     │ Cookie: GUEST_ID   │                         │                      │
     │───────────────────>│                         │                      │
     │                    │                         │                      │
     │                    │ addProductToCart(req)   │                      │
     │                    │────────────────────────>│                      │
     │                    │                         │                      │
     │                    │                         │ findByAccountId()    │
     │                    │                         │ or handleGuestCart() │
     │                    │                         │─────────────────────>│
     │                    │                         │                      │
     │                    │                         │      Cart            │
     │                    │                         │<─────────────────────│
     │                    │                         │                      │
     │                    │                         │ findById(productId)  │
     │                    │                         │─────────────────────>│
     │                    │                         │                      │
     │                    │                         │      Product         │
     │                    │                         │<─────────────────────│
     │                    │                         │                      │
     │                    │                         │ existsByCartAndProduct│
     │                    │                         │─────────────────────>│
     │                    │                         │                      │
     │                    │                         │ save(cartItem)       │
     │                    │                         │─────────────────────>│
     │                    │                         │                      │
     │                    │ CartItemResponse        │                      │
     │                    │<────────────────────────│                      │
     │                    │                         │                      │
     │ Set-Cookie:        │                         │                      │
     │ GUEST_CART_ID=xxx  │                         │                      │
     │ ApiResponse        │                         │                      │
     │<───────────────────│                         │                      │
```

---

## 5. Use Case: Place Order

### 5.1 Tổng Quan Luồng

```
Client → POST /order/cart (hoặc /order/guest/cart) → OrderController → OrderService
                                                                            ↓
                                                              Validate Account/Guest
                                                                            ↓
                                                              resolveDeliveryInfo()
                                                                            ↓
                                                              Tạo Order + OrderItems
                                                                            ↓
                                                              Giảm stock sản phẩm
                                                                            ↓
                                                              Xóa CartItems đã mua
                                                                            ↓
                                                              OrderResponse
```

### 5.2 Chi Tiết Các File và Dòng Code

#### A. Controller Layer - Cart Order (Logged-in User)
**File:** `controller/OrderController.java` (dòng 50-55)

```java
@PostMapping("/cart")
public ApiResponse<OrderResponse> cartOrder(@RequestBody CartOrderRequest order) {
    return ApiResponse.<OrderResponse>builder()
            .result(orderService.placeCartOrder(order))
            .build();
}
```
- **Endpoint:** `POST /order/cart`
- **Request Body:** `CartOrderRequest` gồm `accountId`, `cartItemIds[]`, `addressId` hoặc `newAddress`

#### B. Controller Layer - Cart Order (Guest)
**File:** `controller/OrderController.java` (dòng 63-68)

```java
@PostMapping("/guest/cart")
public ApiResponse<OrderResponse> cartOrderForGuest(@RequestBody GuestCartOrderRequest order) {
    return ApiResponse.<OrderResponse>builder()
            .result(orderService.placeCartOrderForGuest(order))
            .build();
}
```
- **Endpoint:** `POST /order/guest/cart`
- **Request Body:** `GuestCartOrderRequest` gồm `guestUuid`, `cartItemIds[]`, `newAddress`

#### C. Service Layer - Place Cart Order (Logged-in)
**File:** `service/OrderService.java` (dòng 80-125)

```java
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
```

#### D. Service Layer - Place Cart Order (Guest)
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

#### E. Helper - Resolve Delivery Info
**File:** `service/OrderService.java` (dòng 127-165)

```java
private DeliveryInfo resolveDeliveryInfo(String addressId, AddressRequest newAddress, Account account) {
    // Case 1: Sử dụng địa chỉ đã lưu
    if (addressId != null) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new WebException(ErrorCode.ADDRESS_NOT_FOUND));

        // Snapshot địa chỉ vào DeliveryInfo
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
        // Tạo và lưu Address mới cho account
        Address address = Address.builder()
                .recipientName(newAddress.getRecipientName())
                .phoneNumber(newAddress.getPhoneNumber())
                .street(newAddress.getStreet())
                .city(newAddress.getCity())
                .email(newAddress.getEmail())
                .build();

        account.addAddress(address);  // Cascade save
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

### 5.3 Sơ Đồ Sequence Place Order

```
┌─────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────────────────┐
│ Client  │     │ OrderController │     │ OrderService │     │ Repositories         │
└────┬────┘     └────────┬────────┘     └──────┬───────┘     └──────────┬───────────┘
     │                   │                     │                        │
     │ POST /order/cart  │                     │                        │
     │ {accountId,       │                     │                        │
     │  cartItemIds,     │                     │                        │
     │  newAddress}      │                     │                        │
     │──────────────────>│                     │                        │
     │                   │                     │                        │
     │                   │ placeCartOrder(req) │                        │
     │                   │────────────────────>│                        │
     │                   │                     │                        │
     │                   │                     │ findById(accountId)    │
     │                   │                     │───────────────────────>│
     │                   │                     │                        │
     │                   │                     │ resolveDeliveryInfo()  │
     │                   │                     │                        │
     │                   │                     │ findAllById(cartItemIds)
     │                   │                     │───────────────────────>│
     │                   │                     │                        │
     │                   │                     │ for each CartItem:     │
     │                   │                     │   - Create OrderItem   │
     │                   │                     │   - Reduce stock       │
     │                   │                     │   - save(product)      │
     │                   │                     │───────────────────────>│
     │                   │                     │                        │
     │                   │                     │ save(order)            │
     │                   │                     │───────────────────────>│
     │                   │                     │                        │
     │                   │                     │ Remove CartItems       │
     │                   │                     │───────────────────────>│
     │                   │                     │                        │
     │                   │ OrderResponse       │                        │
     │                   │<────────────────────│                        │
     │                   │                     │                        │
     │ ApiResponse       │                     │                        │
     │<──────────────────│                     │                        │
```

---

## 6. Use Case: Select Delivery Method

### 6.1 Tổng Quan

Trong hệ thống AIMS, việc chọn phương thức giao hàng được xử lý như sau:
- **Frontend:** Tính phí ship dựa trên tỉnh/thành và trọng lượng
- **Backend:** Lưu `DeliveryMethod` vào `DeliveryInfo` khi tạo Order

### 6.2 Delivery Method Enum
**File:** `enums/DeliveryMethod.java`

```java
public enum DeliveryMethod {
    STANDARD,    // Giao hàng tiêu chuẩn
    EXPRESS,     // Giao hàng nhanh
    SAME_DAY     // Giao trong ngày
}
```

### 6.3 DeliveryInfo Entity
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

### 6.4 Tích Hợp Trong Order Flow

Khi tạo Order, `DeliveryInfo` được tạo từ `AddressRequest`:

```java
// Trong OrderService.resolveDeliveryInfo()
return DeliveryInfo.builder()
        .recipientName(newAddress.getRecipientName())
        .phoneNumber(newAddress.getPhoneNumber())
        .street(newAddress.getStreet())
        .city(newAddress.getCity())
        .email(newAddress.getEmail())
        .deliveryMethod(DeliveryMethod.STANDARD)  // Default: STANDARD
        .build();
```

### 6.5 Lưu Ý
- Phí ship được tính ở Frontend dựa trên công thức:
  - Hà Nội/HCM: 22,000đ cho 3kg đầu + 2,500đ/0.5kg thêm
  - Tỉnh khác: 30,000đ cho 0.5kg đầu + 2,500đ/0.5kg thêm
  - Giảm 25,000đ cho đơn > 100,000đ
- Backend hiện chỉ lưu `DeliveryMethod`, chưa tính phí ship

---

## 7. Use Case: Pay Order

### 7.1 Tổng Quan Luồng

```
Client → POST /payOrder/viet-qr → PayOrderController → PaymentService
                                                            ↓
                                                  IQrPayment.generateQrCode()
                                                            ↓
                                                  QR Code String
                                        
Client → GET /payOrder/viet-qr/verify/{orderId} → PaymentService.verifyPayment()
                                                            ↓
                                                  "SUCCESS" / "PENDING" / "FAILED"

Client → POST /payOrder/paypal → PaymentService.payOrderByCreditCard()
                                                            ↓
                                                  IPayment.payOrder()
```

### 7.2 Chi Tiết Các File và Dòng Code

#### A. Controller Layer - VietQR Payment
**File:** `controller/PayOrderController.java` (dòng 35-45)

```java
@PostMapping("/viet-qr")
public ApiResponse<String> payOrder(@RequestBody @Valid PayOrderRequest request) {
    String qrCode = service.generateQrCode(
            request.getOrderId(),
            request.getAmount());

    return ApiResponse.<String>builder()
            .result(qrCode)
            .build();
}
```
- **Endpoint:** `POST /payOrder/viet-qr`
- **Request Body:** `PayOrderRequest` gồm `orderId`, `amount`
- **Response:** QR Code string để hiển thị

#### B. Controller Layer - Verify Payment
**File:** `controller/PayOrderController.java` (dòng 47-52)

```java
@GetMapping("/viet-qr/verify/{orderId}")
public ApiResponse<String> verify(@PathVariable String orderId) {
    return ApiResponse.<String>builder()
            .result(service.verifyPayment(orderId))
            .build();
}
```
- **Endpoint:** `GET /payOrder/viet-qr/verify/{orderId}`
- **Response:** Payment status ("SUCCESS", "PENDING", "FAILED")

#### C. Controller Layer - PayPal/Credit Card
**File:** `controller/PayOrderController.java` (dòng 54-59)

```java
@PostMapping("/paypal")
public ApiResponse<String> processCreditCardPayment(@RequestBody Map<String, Object> request) {
    return ApiResponse.<String>builder()
            .result(service.payOrderByCreditCard(request))
            .build();
}
```
- **Endpoint:** `POST /payOrder/paypal`
- **Request Body:** Map chứa `orderId` và thông tin thanh toán

#### D. Service Layer
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

    public String payOrderByCreditCard(Map<String, Object> info) {
        return credPayment.payOrder((String) info.get("orderId"));
    }
}
```

### 7.3 Payment Interfaces
**File:** `payment/IQrPayment.java`

```java
public interface IQrPayment {
    String generateQrCode(String orderId, Integer amount);
}
```

**File:** `payment/IPayment.java`

```java
public interface IPayment {
    String payOrder(String orderId);
}
```

### 7.4 Sơ Đồ Sequence Pay Order (VietQR)

```
┌─────────┐     ┌──────────────────┐     ┌────────────────┐     ┌────────────┐
│ Client  │     │ PayOrderController│     │ PaymentService │     │ IQrPayment │
└────┬────┘     └────────┬─────────┘     └───────┬────────┘     └─────┬──────┘
     │                   │                       │                    │
     │ POST /payOrder/   │                       │                    │
     │ viet-qr           │                       │                    │
     │ {orderId, amount} │                       │                    │
     │──────────────────>│                       │                    │
     │                   │                       │                    │
     │                   │ generateQrCode()      │                    │
     │                   │──────────────────────>│                    │
     │                   │                       │                    │
     │                   │                       │ generateQrCode()   │
     │                   │                       │───────────────────>│
     │                   │                       │                    │
     │                   │                       │   QR Code String   │
     │                   │                       │<───────────────────│
     │                   │                       │                    │
     │                   │ QR Code String        │                    │
     │                   │<──────────────────────│                    │
     │                   │                       │                    │
     │ ApiResponse       │                       │                    │
     │ {result: qrCode}  │                       │                    │
     │<──────────────────│                       │                    │
     │                   │                       │                    │
     │ [User scans QR]   │                       │                    │
     │                   │                       │                    │
     │ GET /payOrder/    │                       │                    │
     │ viet-qr/verify/   │                       │                    │
     │ {orderId}         │                       │                    │
     │──────────────────>│                       │                    │
     │                   │                       │                    │
     │                   │ verifyPayment()       │                    │
     │                   │──────────────────────>│                    │
     │                   │                       │                    │
     │                   │ "SUCCESS"             │                    │
     │                   │<──────────────────────│                    │
     │                   │                       │                    │
     │ ApiResponse       │                       │                    │
     │ {result: SUCCESS} │                       │                    │
     │<──────────────────│                       │                    │
```

---

## Tổng Kết Error Codes

| Code | Tên | Mô Tả |
|------|-----|-------|
| 1001 | ACCOUNT_NOT_FOUND | Không tìm thấy tài khoản |
| 1002 | ACCOUNT_NOT_EXIST | Tài khoản không tồn tại (login) |
| 1003 | UNAUTHENTICATED | Sai mật khẩu hoặc token không hợp lệ |
| 1009 | PRODUCT_NOT_FOUND | Không tìm thấy sản phẩm |
| 1010 | PRODUCT_EXISTED | Sản phẩm đã tồn tại |
| 1011 | PRODUCT_OUT_OF_STOCK | Sản phẩm hết hàng |
| 1012 | CART_NOT_FOUND | Không tìm thấy giỏ hàng |
| 1013 | CARTITEM_NOT_FOUND | Không tìm thấy item trong giỏ |
| 1014 | ORDER_NOT_FOUND | Không tìm thấy đơn hàng |
| 1015 | ADDRESS_NOT_FOUND | Không tìm thấy địa chỉ |
| 1016 | ADDRESS_REQUIRED | Thiếu thông tin địa chỉ |
| 1017 | INVALID_PRICE | Số tiền không hợp lệ |

---

## API Endpoints Summary

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/auth/token` | Đăng nhập, lấy JWT token |
| POST | `/auth/introspect` | Kiểm tra token hợp lệ |
| POST | `/auth/logout` | Đăng xuất, invalidate token |
| GET | `/product` | Lấy tất cả sản phẩm |
| GET | `/product/{id}` | Lấy chi tiết sản phẩm |
| POST | `/cartItem` | Thêm sản phẩm vào giỏ |
| GET | `/cartItem/list` | Lấy danh sách cart items |
| PUT | `/cartItem/{id}` | Cập nhật số lượng |
| DELETE | `/cartItem/{id}` | Xóa item khỏi giỏ |
| POST | `/order/cart` | Đặt hàng từ cart (logged-in) |
| POST | `/order/guest/cart` | Đặt hàng từ cart (guest) |
| GET | `/order/{id}` | Lấy thông tin đơn hàng |
| POST | `/payOrder/viet-qr` | Tạo QR code thanh toán |
| GET | `/payOrder/viet-qr/verify/{orderId}` | Kiểm tra trạng thái thanh toán |
| POST | `/payOrder/paypal` | Thanh toán qua PayPal |
