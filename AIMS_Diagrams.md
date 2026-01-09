# AIMS System - UML Diagrams

## Mục lục
1. [Use Case 1: Place Order](#use-case-1-place-order)
2. [Use Case 2: Add Product to Cart](#use-case-2-add-product-to-cart)
3. [Use Case 3: Pay Order (VietQR)](#use-case-3-pay-order-vietqr)
4. [Use Case 4: Pay Order by Credit Card](#use-case-4-pay-order-by-credit-card)
5. [Use Case 5: Select Delivery Method](#use-case-5-select-delivery-method)
6. [Use Case 6: View Product Details](#use-case-6-view-product-details)
7. [Use Case 7: Search Products](#use-case-7-search-products)
8. [Use Case 8: Create Product](#use-case-8-create-product)
9. [Use Case 9: Update Product](#use-case-9-update-product)
10. [Use Case 10: Delete Product](#use-case-10-delete-product)
11. [Use Case 11: Log In](#use-case-11-log-in)
12. [Use Case 12: Log Out](#use-case-12-log-out)

---

## Unified Analysis Class Diagram (Toàn hệ thống)

```mermaid
classDiagram
    %% Boundary Classes
    class HomePage {
        <<boundary>>
    }
    class ProductDetailsPage {
        <<boundary>>
    }
    class CartPage {
        <<boundary>>
    }
    class CheckoutFlow {
        <<boundary>>
    }
    class LoginPage {
        <<boundary>>
    }
    class ProductManagerPage {
        <<boundary>>
    }
    class AdminDashboard {
        <<boundary>>
    }
    class PaymentPage {
        <<boundary>>
    }

    %% Controller Classes
    class ProductController {
        <<controller>>
        +createProduct()
        +getProduct()
        +getProducts()
        +updateProduct()
        +deleteProduct()
    }
    class CartController {
        <<controller>>
        +getCartByCartId()
        +getCartByAccountId()
    }
    class CartItemController {
        <<controller>>
        +addProductToCart()
        +getCartItemById()
        +getAllCartItems()
        +updateCartItem()
        +deleteCartItem()
    }
    class OrderController {
        <<controller>>
        +directOrder()
        +cartOrder()
        +getOrderById()
        +getAllOrders()
        +deleteOrderById()
        +updateOrderStatus()
        +cancelOrder()
    }
    class AuthenticationController {
        <<controller>>
        +login()
        +introspect()
        +logout()
    }
    class PayOrderByCreditCardController {
        <<controller>>
        +createTransaction()
        +captureTransaction()
    }
    class PayOrderByQrController {
        <<controller>>
        +generateQrCode()
    }

    %% Entity Classes
    class Account {
        <<entity>>
        -id: String
        -username: String
        -password: String
        -email: String
        -phoneNumber: String
        -createdDate: LocalDateTime
    }
    class Product {
        <<entity>>
        -id: String
        -name: String
        -description: String
        -type: ProductType
        -stock: int
        -weight: BigDecimal
        -price: BigDecimal
        -active: boolean
    }
    class Cart {
        <<entity>>
        -id: String
        -guestUuid: String
        -createdDate: LocalDateTime
    }
    class CartItem {
        <<entity>>
        -id: String
        -quantity: int
        -unitPrice: BigDecimal
        -totalPrice: BigDecimal
    }
    class Order {
        <<entity>>
        -id: String
        -orderStatus: OrderStatus
        -totalPrice: BigDecimal
        -deliveryFee: BigDecimal
        -totalWeight: BigDecimal
    }
    class OrderItem {
        <<entity>>
        -id: String
        -quantity: int
        -unitPrice: BigDecimal
        -totalPrice: BigDecimal
    }
    class DeliveryInfo {
        <<entity>>
        -fullName: String
        -phoneNumber: String
        -address: String
        -city: String
    }
    class TransactionInfo {
        <<entity>>
        -id: String
        -amount: BigDecimal
        -paymentStatus: PaymentStatus
        -paymentMethod: PaymentMethod
    }
    class Role {
        <<entity>>
        -name: String
        -description: String
    }

    %% Relationships
    Account "1" -- "1" Cart
    Account "1" -- "*" Role
    Cart "1" -- "*" CartItem
    CartItem "*" -- "1" Product
    Order "*" -- "1" Account
    Order "1" -- "*" OrderItem
    Order "1" -- "1" DeliveryInfo
    Order "1" -- "1" TransactionInfo
    OrderItem "*" -- "1" Product

    %% Boundary to Controller
    HomePage --> ProductController
    ProductDetailsPage --> ProductController
    CartPage --> CartItemController
    CheckoutFlow --> OrderController
    CheckoutFlow --> PayOrderByCreditCardController
    CheckoutFlow --> PayOrderByQrController
    LoginPage --> AuthenticationController
    ProductManagerPage --> ProductController
```

---

## Use Case 1: Place Order

### 1.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant CheckoutFlow as :CheckoutFlow<<boundary>>
    participant OrderController as :OrderController<<controller>>
    participant OrderService as :OrderService<<controller>>
    participant Order as :Order<<entity>>
    participant OrderItem as :OrderItem<<entity>>
    participant DeliveryInfo as :DeliveryInfo<<entity>>
    participant Product as :Product<<entity>>
    participant Cart as :Cart<<entity>>
    participant CartItem as :CartItem<<entity>>

    Customer->>CheckoutFlow: 1. submitOrder(deliveryInfo, cartItemIds)
    CheckoutFlow->>OrderController: 2. cartOrder(CartOrderRequest)
    OrderController->>OrderService: 3. placeCartOrder(request)
    
    OrderService->>Order: 4. findAccount(accountId)
    Order-->>OrderService: account
    
    OrderService->>DeliveryInfo: 5. resolveDeliveryInfo(addressId, newAddress)
    DeliveryInfo-->>OrderService: deliveryInfo
    
    OrderService->>Cart: 6. loadCartItems(cartItemIds)
    Cart-->>OrderService: cartItems
    
    loop for each CartItem
        OrderService->>Product: 7. reserve(product, quantity)
        Product-->>OrderService: reservedQuantity
        OrderService->>OrderItem: 8. create(product, quantity, price)
        OrderItem-->>OrderService: orderItem
    end
    
    OrderService->>Order: 9. create(account, deliveryInfo, items)
    Order->>Order: 10. calTotalPrice()
    Order-->>OrderService: order
    
    OrderService->>CartItem: 11. clearPurchasedItems(items)
    
    OrderService-->>OrderController: 12. OrderResponse
    OrderController-->>CheckoutFlow: 13. ApiResponse<OrderResponse>
    CheckoutFlow-->>Customer: 14. displayOrderConfirmation()
```

### 1.2 Analysis Class Diagram

```mermaid
classDiagram
    class CheckoutFlow {
        <<boundary>>
        +submitOrder()
        +displayOrderConfirmation()
    }
    class OrderController {
        <<controller>>
        +cartOrder(CartOrderRequest): ApiResponse
        +directOrder(DirectOrderRequest): ApiResponse
    }
    class OrderService {
        <<controller>>
        +placeCartOrder(request): OrderResponse
        +placeDirectOrder(request): OrderResponse
    }
    class Order {
        <<entity>>
        -id: String
        -orderStatus: OrderStatus
        -totalPrice: BigDecimal
        -deliveryFee: BigDecimal
        +calTotalPrice()
        +addItem(OrderItem)
    }
    class OrderItem {
        <<entity>>
        -id: String
        -quantity: int
        -unitPrice: BigDecimal
        -totalPrice: BigDecimal
    }
    class DeliveryInfo {
        <<entity>>
        -fullName: String
        -phoneNumber: String
        -address: String
        -city: String
    }
    class Cart {
        <<entity>>
        -id: String
        -items: List~CartItem~
    }
    class CartItem {
        <<entity>>
        -id: String
        -quantity: int
        -product: Product
    }
    class Product {
        <<entity>>
        -id: String
        -stock: int
        -price: BigDecimal
    }
    class Account {
        <<entity>>
        -id: String
        -username: String
    }

    CheckoutFlow --> OrderController
    OrderController --> OrderService
    OrderService --> Order
    OrderService --> Cart
    Order "1" *-- "*" OrderItem
    Order "1" *-- "1" DeliveryInfo
    Order "*" --> "1" Account
    Cart "1" *-- "*" CartItem
    CartItem "*" --> "1" Product
    OrderItem "*" --> "1" Product
```

### 1.3 Communication Diagram

```mermaid
flowchart LR
    Customer((Customer))
    CheckoutFlow[":CheckoutFlow\n<<boundary>>"]
    OrderController[":OrderController\n<<controller>>"]
    OrderService[":OrderService\n<<controller>>"]
    Order[":Order\n<<entity>>"]
    OrderItem[":OrderItem\n<<entity>>"]
    DeliveryInfo[":DeliveryInfo\n<<entity>>"]
    Cart[":Cart\n<<entity>>"]
    Product[":Product\n<<entity>>"]

    Customer -->|"1: submitOrder()"| CheckoutFlow
    CheckoutFlow -->|"2: cartOrder()"| OrderController
    OrderController -->|"3: placeCartOrder()"| OrderService
    OrderService -->|"4: loadCartItems()"| Cart
    OrderService -->|"5: reserve()"| Product
    OrderService -->|"6: create()"| Order
    OrderService -->|"7: create()"| OrderItem
    OrderService -->|"8: resolve()"| DeliveryInfo
    Order -->|"9: calTotalPrice()"| Order
```

---

## Use Case 2: Add Product to Cart

### 2.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant ProductDetailsPage as :ProductDetailsPage<<boundary>>
    participant CartContext as :CartContext<<boundary>>
    participant CartItemController as :CartItemController<<controller>>
    participant CartItemService as :CartItemService<<controller>>
    participant Cart as :Cart<<entity>>
    participant CartItem as :CartItem<<entity>>
    participant Product as :Product<<entity>>

    Customer->>ProductDetailsPage: 1. clickAddToCart(productId, quantity)
    ProductDetailsPage->>CartContext: 2. addToCart(productId, quantity)
    CartContext->>CartItemController: 3. POST /cartItem (CartItemRequest)
    CartItemController->>CartItemService: 4. addProductToCart(request, context)
    
    CartItemService->>Cart: 5. resolveCart(context)
    alt isAuthenticated
        Cart-->>CartItemService: accountCart
    else isGuest
        CartItemService->>Cart: 6. handleGuestCart(guestUuid)
        Cart-->>CartItemService: guestCart
    end
    
    CartItemService->>Product: 7. loadProduct(productId)
    Product-->>CartItemService: product
    
    CartItemService->>CartItem: 8. findOrCreateCartItem(cart, product, quantity)
    alt existingItem
        CartItem->>CartItem: 9. updateExistingItem(quantity)
    else newItem
        CartItemService->>CartItem: 10. createNewItem(cart, product, quantity)
    end
    CartItem->>CartItem: 11. calTotalPrice()
    CartItem-->>CartItemService: cartItem
    
    CartItemService->>Cart: 12. addItem(cartItem)
    CartItemService-->>CartItemController: 13. CartItemResponse
    CartItemController-->>CartContext: 14. ApiResponse<CartItemResponse>
    CartContext->>CartContext: 15. fetchCart(true)
    CartContext-->>ProductDetailsPage: 16. showNotification("success")
    ProductDetailsPage-->>Customer: 17. displaySuccessMessage()
```

### 2.2 Analysis Class Diagram

```mermaid
classDiagram
    class ProductDetailsPage {
        <<boundary>>
        +clickAddToCart()
        +displaySuccessMessage()
    }
    class CartContext {
        <<boundary>>
        +addToCart(productId, quantity)
        +fetchCart()
        +showNotification()
    }
    class CartItemController {
        <<controller>>
        +addProductToCart(request): ApiResponse
    }
    class CartItemService {
        <<controller>>
        +addProductToCart(request, context): CartItemResponse
        -resolveCart(context): Cart
        -loadProduct(productId): Product
        -findOrCreateCartItem(): CartItem
    }
    class Cart {
        <<entity>>
        -id: String
        -guestUuid: String
        -items: List~CartItem~
        +addItem(CartItem)
    }
    class CartItem {
        <<entity>>
        -id: String
        -quantity: int
        -unitPrice: BigDecimal
        -totalPrice: BigDecimal
        +calTotalPrice()
    }
    class Product {
        <<entity>>
        -id: String
        -name: String
        -stock: int
        -price: BigDecimal
        -active: boolean
    }
    class Account {
        <<entity>>
        -id: String
    }

    ProductDetailsPage --> CartContext
    CartContext --> CartItemController
    CartItemController --> CartItemService
    CartItemService --> Cart
    CartItemService --> Product
    Cart "1" *-- "*" CartItem
    Cart "*" --> "0..1" Account
    CartItem "*" --> "1" Product
```

### 2.3 Communication Diagram

```mermaid
flowchart LR
    Customer((Customer))
    ProductDetailsPage[":ProductDetailsPage\n<<boundary>>"]
    CartContext[":CartContext\n<<boundary>>"]
    CartItemController[":CartItemController\n<<controller>>"]
    CartItemService[":CartItemService\n<<controller>>"]
    Cart[":Cart\n<<entity>>"]
    CartItem[":CartItem\n<<entity>>"]
    Product[":Product\n<<entity>>"]

    Customer -->|"1: clickAddToCart()"| ProductDetailsPage
    ProductDetailsPage -->|"2: addToCart()"| CartContext
    CartContext -->|"3: POST /cartItem"| CartItemController
    CartItemController -->|"4: addProductToCart()"| CartItemService
    CartItemService -->|"5: resolveCart()"| Cart
    CartItemService -->|"6: loadProduct()"| Product
    CartItemService -->|"7: findOrCreate()"| CartItem
    CartItem -->|"8: calTotalPrice()"| CartItem
    Cart -->|"9: addItem()"| Cart
```

---

## Use Case 3: Pay Order (VietQR)

### 3.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant PaymentPage as :PaymentPage<<boundary>>
    participant VietQRPayment as :VietQRPayment<<boundary>>
    participant PayOrderByQrController as :PayOrderByQrController<<controller>>
    participant PaymentService as :PaymentService<<controller>>
    participant QrPaymentRegister as :QrPaymentRegister<<controller>>
    participant VietQrSubsystem as :VietQrSubsystem<<controller>>
    participant Order as :Order<<entity>>
    participant TransactionInfo as :TransactionInfo<<entity>>

    Customer->>PaymentPage: 1. selectPaymentMethod("VietQR")
    PaymentPage->>VietQRPayment: 2. initiateVietQRPayment(orderId)
    VietQRPayment->>PayOrderByQrController: 3. POST /payment/qr/{provider} (QrRequest)
    PayOrderByQrController->>PaymentService: 4. createTransactionInfo(orderId)
    
    PaymentService->>Order: 5. findById(orderId)
    Order-->>PaymentService: order
    
    PaymentService->>TransactionInfo: 6. create(order, amount, CREATED)
    TransactionInfo-->>PaymentService: transactionInfo
    
    PayOrderByQrController->>PaymentService: 7. getAmount(orderId)
    PaymentService-->>PayOrderByQrController: amount
    
    PayOrderByQrController->>QrPaymentRegister: 8. get(provider)
    QrPaymentRegister-->>PayOrderByQrController: vietQrSubsystem
    
    PayOrderByQrController->>VietQrSubsystem: 9. generateQrCode(orderId, amount)
    VietQrSubsystem->>VietQrSubsystem: 10. callVietQrAPI()
    VietQrSubsystem-->>PayOrderByQrController: qrCodeString
    
    PayOrderByQrController-->>VietQRPayment: 11. ApiResponse<qrCodeString>
    VietQRPayment->>VietQRPayment: 12. displayQRCode(qrCodeString)
    VietQRPayment-->>Customer: 13. showQRCodeForScanning()
    
    Note over Customer,VietQrSubsystem: Customer scans QR and pays via banking app
    
    VietQrSubsystem->>PaymentService: 14. callback(paymentResult)
    PaymentService->>TransactionInfo: 15. updateStatus(SUCCESS)
    PaymentService->>Order: 16. setOrderStatus(PAID)
    
    VietQRPayment->>PaymentService: 17. verifyPayment(transactionId)
    PaymentService-->>VietQRPayment: 18. paymentStatus
    VietQRPayment-->>Customer: 19. displayPaymentSuccess()
```

### 3.2 Analysis Class Diagram

```mermaid
classDiagram
    class PaymentPage {
        <<boundary>>
        +selectPaymentMethod()
    }
    class VietQRPayment {
        <<boundary>>
        +initiateVietQRPayment()
        +displayQRCode()
        +displayPaymentSuccess()
    }
    class PayOrderByQrController {
        <<controller>>
        +generateQrCode(provider, request): ApiResponse
    }
    class PaymentService {
        <<controller>>
        +createTransactionInfo(orderId): TransactionInfoResponse
        +getAmount(orderId): BigDecimal
        +saveSuccessTransaction(): TransactionInfoResponse
        +updateTransactionStatus(): TransactionInfoResponse
    }
    class QrPaymentRegister {
        <<controller>>
        +get(provider): IQrPayment
    }
    class VietQrSubsystem {
        <<controller>>
        +generateQrCode(orderId, amount): String
        -callVietQrAPI()
    }
    class Order {
        <<entity>>
        -id: String
        -orderStatus: OrderStatus
        -totalPrice: BigDecimal
    }
    class TransactionInfo {
        <<entity>>
        -id: String
        -amount: BigDecimal
        -paymentStatus: PaymentStatus
        -paymentMethod: PaymentMethod
        -gatewayTransactionId: String
    }

    PaymentPage --> VietQRPayment
    VietQRPayment --> PayOrderByQrController
    PayOrderByQrController --> PaymentService
    PayOrderByQrController --> QrPaymentRegister
    QrPaymentRegister --> VietQrSubsystem
    PaymentService --> Order
    PaymentService --> TransactionInfo
    Order "1" -- "1" TransactionInfo
```

### 3.3 Communication Diagram

```mermaid
flowchart LR
    Customer((Customer))
    PaymentPage[":PaymentPage\n<<boundary>>"]
    VietQRPayment[":VietQRPayment\n<<boundary>>"]
    PayOrderByQrController[":PayOrderByQrController\n<<controller>>"]
    PaymentService[":PaymentService\n<<controller>>"]
    QrPaymentRegister[":QrPaymentRegister\n<<controller>>"]
    VietQrSubsystem[":VietQrSubsystem\n<<controller>>"]
    Order[":Order\n<<entity>>"]
    TransactionInfo[":TransactionInfo\n<<entity>>"]

    Customer -->|"1: selectPaymentMethod()"| PaymentPage
    PaymentPage -->|"2: initiateVietQRPayment()"| VietQRPayment
    VietQRPayment -->|"3: POST /payment/qr"| PayOrderByQrController
    PayOrderByQrController -->|"4: createTransactionInfo()"| PaymentService
    PaymentService -->|"5: findById()"| Order
    PaymentService -->|"6: create()"| TransactionInfo
    PayOrderByQrController -->|"7: get(provider)"| QrPaymentRegister
    QrPaymentRegister -->|"8: generateQrCode()"| VietQrSubsystem
```

---

## Use Case 4: Pay Order by Credit Card

### 4.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant PaymentPage as :PaymentPage<<boundary>>
    participant CreditCardPayment as :CreditCardPayment<<boundary>>
    participant PayOrderByCreditCardController as :PayOrderByCreditCardController<<controller>>
    participant PaymentService as :PaymentService<<controller>>
    participant CreditCardPaymentRegister as :CreditCardPaymentRegister<<controller>>
    participant PaypalSubsystem as :PaypalSubsystem<<controller>>
    participant Order as :Order<<entity>>
    participant TransactionInfo as :TransactionInfo<<entity>>

    Customer->>PaymentPage: 1. selectPaymentMethod("CreditCard")
    PaymentPage->>CreditCardPayment: 2. enterCardDetails(cardInfo)
    CreditCardPayment->>PayOrderByCreditCardController: 3. POST /payment/credit-card/{provider}/create
    
    PayOrderByCreditCardController->>PaymentService: 4. createTransactionInfo(orderId)
    PaymentService->>Order: 5. findById(orderId)
    Order-->>PaymentService: order
    PaymentService->>TransactionInfo: 6. create(order, amount, CREATED)
    TransactionInfo-->>PaymentService: transactionInfo
    
    PayOrderByCreditCardController->>PaymentService: 7. getAmount(orderId)
    PaymentService-->>PayOrderByCreditCardController: amount
    
    PayOrderByCreditCardController->>PaymentService: 8. setPaymentMethod(orderId, PAYPAL)
    
    PayOrderByCreditCardController->>CreditCardPaymentRegister: 9. get(provider)
    CreditCardPaymentRegister-->>PayOrderByCreditCardController: paypalSubsystem
    
    PayOrderByCreditCardController->>PaypalSubsystem: 10. createTransaction(orderId, amount)
    PaypalSubsystem->>PaypalSubsystem: 11. callPaypalCreateOrderAPI()
    PaypalSubsystem-->>PayOrderByCreditCardController: externalOrderId
    
    PayOrderByCreditCardController-->>CreditCardPayment: 12. ApiResponse<externalOrderId>
    CreditCardPayment-->>Customer: 13. redirectToPaypalCheckout()
    
    Note over Customer,PaypalSubsystem: Customer completes payment on Paypal
    
    Customer->>CreditCardPayment: 14. paypalCallback(externalOrderId)
    CreditCardPayment->>PayOrderByCreditCardController: 15. POST /payment/credit-card/{provider}/capture/{externalOrderId}
    
    PayOrderByCreditCardController->>PaypalSubsystem: 16. captureTransaction(externalOrderId)
    PaypalSubsystem->>PaypalSubsystem: 17. callPaypalCaptureAPI()
    PaypalSubsystem-->>PayOrderByCreditCardController: transactionStatusDto
    
    alt paymentSuccess
        PayOrderByCreditCardController->>PaymentService: 18. saveSuccessTransaction(orderId, paymentMethod, gatewayId, paidAt)
        PaymentService->>TransactionInfo: 19. update(SUCCESS)
        PaymentService->>Order: 20. setOrderStatus(PAID)
    else paymentFailed
        PayOrderByCreditCardController->>PaymentService: 21. updateTransactionStatus(orderId, FAILED)
    end
    
    PayOrderByCreditCardController-->>CreditCardPayment: 22. ApiResponse<TransactionInfoResponse>
    CreditCardPayment-->>Customer: 23. displayPaymentResult()
```

### 4.2 Analysis Class Diagram

```mermaid
classDiagram
    class PaymentPage {
        <<boundary>>
        +selectPaymentMethod()
    }
    class CreditCardPayment {
        <<boundary>>
        +enterCardDetails()
        +redirectToPaypalCheckout()
        +displayPaymentResult()
    }
    class PayOrderByCreditCardController {
        <<controller>>
        +createTransaction(provider, request): ApiResponse
        +captureTransaction(provider, externalOrderId): ApiResponse
    }
    class PaymentService {
        <<controller>>
        +createTransactionInfo(orderId): TransactionInfoResponse
        +getAmount(orderId): BigDecimal
        +setPaymentMethod(orderId, method)
        +saveSuccessTransaction(): TransactionInfoResponse
        +updateTransactionStatus(): TransactionInfoResponse
    }
    class CreditCardPaymentRegister {
        <<controller>>
        +get(provider): ICreditCardPayment
    }
    class PaypalSubsystem {
        <<controller>>
        +createTransaction(orderId, amount): String
        +captureTransaction(externalOrderId): TransactionStatusDto
        -callPaypalCreateOrderAPI()
        -callPaypalCaptureAPI()
    }
    class Order {
        <<entity>>
        -id: String
        -orderStatus: OrderStatus
        -totalPrice: BigDecimal
    }
    class TransactionInfo {
        <<entity>>
        -id: String
        -amount: BigDecimal
        -paymentStatus: PaymentStatus
        -paymentMethod: PaymentMethod
        -gatewayTransactionId: String
        -paidAt: LocalDateTime
    }

    PaymentPage --> CreditCardPayment
    CreditCardPayment --> PayOrderByCreditCardController
    PayOrderByCreditCardController --> PaymentService
    PayOrderByCreditCardController --> CreditCardPaymentRegister
    CreditCardPaymentRegister --> PaypalSubsystem
    PaymentService --> Order
    PaymentService --> TransactionInfo
    Order "1" -- "1" TransactionInfo
```

### 4.3 Communication Diagram

```mermaid
flowchart LR
    Customer((Customer))
    PaymentPage[":PaymentPage\n<<boundary>>"]
    CreditCardPayment[":CreditCardPayment\n<<boundary>>"]
    PayOrderByCreditCardController[":PayOrderByCreditCardController\n<<controller>>"]
    PaymentService[":PaymentService\n<<controller>>"]
    CreditCardPaymentRegister[":CreditCardPaymentRegister\n<<controller>>"]
    PaypalSubsystem[":PaypalSubsystem\n<<controller>>"]
    Order[":Order\n<<entity>>"]
    TransactionInfo[":TransactionInfo\n<<entity>>"]

    Customer -->|"1: selectPaymentMethod()"| PaymentPage
    PaymentPage -->|"2: enterCardDetails()"| CreditCardPayment
    CreditCardPayment -->|"3: POST /create"| PayOrderByCreditCardController
    PayOrderByCreditCardController -->|"4: createTransactionInfo()"| PaymentService
    PaymentService -->|"5: findById()"| Order
    PaymentService -->|"6: create()"| TransactionInfo
    PayOrderByCreditCardController -->|"7: get(provider)"| CreditCardPaymentRegister
    CreditCardPaymentRegister -->|"8: createTransaction()"| PaypalSubsystem
    CreditCardPayment -->|"9: POST /capture"| PayOrderByCreditCardController
    PaypalSubsystem -->|"10: captureTransaction()"| PaypalSubsystem
```

---

## Use Case 5: Select Delivery Method

### 5.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant CheckoutFlow as :CheckoutFlow<<boundary>>
    participant ShippingForm as :ShippingForm<<boundary>>
    participant CheckoutContext as :CheckoutContext<<boundary>>
    participant DeliveryHandler as :DeliveryHandler<<controller>>
    participant DeliveryInfoResolver as :DeliveryInfoResolver<<controller>>
    participant DeliveryInfo as :DeliveryInfo<<entity>>
    participant Order as :Order<<entity>>

    Customer->>CheckoutFlow: 1. proceedToCheckout()
    CheckoutFlow->>ShippingForm: 2. displayShippingForm()
    ShippingForm-->>Customer: 3. showDeliveryOptions()
    
    Customer->>ShippingForm: 4. enterDeliveryInfo(fullName, phone, address, province)
    Customer->>ShippingForm: 5. selectDeliveryMethod(method)
    
    ShippingForm->>CheckoutContext: 6. handleSubmitDeliveryInfo(deliveryInfo)
    CheckoutContext->>DeliveryHandler: 7. calculateAndSubmit(deliveryInfo, weight, productCost)
    
    DeliveryHandler->>DeliveryHandler: 8. calculateFee(weight, province, orderValue)
    
    Note over DeliveryHandler: Tính phí vận chuyển theo quy tắc:<br/>- Hà Nội/HCM: 22,000đ cơ bản<br/>- Tỉnh khác: 30,000đ cơ bản<br/>- Trên 3kg: +2,500đ/0.5kg<br/>- Đơn >= 100,000đ: -25,000đ
    
    DeliveryHandler-->>CheckoutContext: 9. deliveryFee
    
    CheckoutContext->>DeliveryInfoResolver: 10. resolveDeliveryInfo(deliveryInfo)
    DeliveryInfoResolver->>DeliveryInfo: 11. create(fullName, phone, address, city)
    DeliveryInfo-->>DeliveryInfoResolver: deliveryInfo
    DeliveryInfoResolver-->>CheckoutContext: deliveryInfo
    
    CheckoutContext->>CheckoutContext: 12. setShippingData(deliveryInfo)
    CheckoutContext->>CheckoutContext: 13. generateOrderId()
    
    CheckoutContext-->>ShippingForm: 14. deliveryInfoSubmitted
    ShippingForm-->>Customer: 15. displayDeliveryConfirmation(fee)
    CheckoutFlow->>CheckoutFlow: 16. nextStep() -> Payment
```

### 5.2 Analysis Class Diagram

```mermaid
classDiagram
    class CheckoutFlow {
        <<boundary>>
        +proceedToCheckout()
        +nextStep()
    }
    class ShippingForm {
        <<boundary>>
        +displayShippingForm()
        +showDeliveryOptions()
        +displayDeliveryConfirmation()
    }
    class CheckoutContext {
        <<boundary>>
        +handleSubmitDeliveryInfo()
        +setShippingData()
        +generateOrderId()
        +calculateTotalWeight()
        +calculateProductCost()
    }
    class DeliveryHandler {
        <<controller>>
        +calculateAndSubmit(deliveryInfo, weight, cost)
        +calculateFee(weight, province, orderValue): number
    }
    class DeliveryInfoResolver {
        <<controller>>
        +resolveDeliveryInfo(deliveryInfo): DeliveryInfo
        +resolveForAccount(addressId, newAddress, account): DeliveryInfo
        +resolveForGuest(newAddress): DeliveryInfo
    }
    class DeliveryInfo {
        <<entity>>
        -deliveryId: String
        -fullName: String
        -phoneNumber: String
        -address: String
        -city: String
        -deliveryMethod: String
        -deliveryFee: BigDecimal
    }
    class Order {
        <<entity>>
        -id: String
        -deliveryFee: BigDecimal
        -totalWeight: BigDecimal
        +calDeliveryFee(): BigDecimal
    }

    CheckoutFlow --> ShippingForm
    ShippingForm --> CheckoutContext
    CheckoutContext --> DeliveryHandler
    DeliveryHandler --> DeliveryInfoResolver
    DeliveryInfoResolver --> DeliveryInfo
    Order "1" *-- "1" DeliveryInfo
```

### 5.3 Communication Diagram

```mermaid
flowchart LR
    Customer((Customer))
    CheckoutFlow[":CheckoutFlow\n<<boundary>>"]
    ShippingForm[":ShippingForm\n<<boundary>>"]
    CheckoutContext[":CheckoutContext\n<<boundary>>"]
    DeliveryHandler[":DeliveryHandler\n<<controller>>"]
    DeliveryInfoResolver[":DeliveryInfoResolver\n<<controller>>"]
    DeliveryInfo[":DeliveryInfo\n<<entity>>"]

    Customer -->|"1: proceedToCheckout()"| CheckoutFlow
    CheckoutFlow -->|"2: displayShippingForm()"| ShippingForm
    Customer -->|"3: enterDeliveryInfo()"| ShippingForm
    ShippingForm -->|"4: handleSubmitDeliveryInfo()"| CheckoutContext
    CheckoutContext -->|"5: calculateAndSubmit()"| DeliveryHandler
    DeliveryHandler -->|"6: calculateFee()"| DeliveryHandler
    CheckoutContext -->|"7: resolveDeliveryInfo()"| DeliveryInfoResolver
    DeliveryInfoResolver -->|"8: create()"| DeliveryInfo
```

---

## Use Case 6: View Product Details

### 6.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant HomePage as :HomePage<<boundary>>
    participant ProductDetailsPage as :ProductDetailsPage<<boundary>>
    participant ProductController as :ProductController<<controller>>
    participant ProductService as :ProductService<<controller>>
    participant ProductResponseDispatcher as :ProductResponseDispatcher<<controller>>
    participant Product as :Product<<entity>>

    Customer->>HomePage: 1. browseProducts()
    HomePage-->>Customer: 2. displayProductList()
    
    Customer->>HomePage: 3. clickProduct(productId)
    HomePage->>ProductDetailsPage: 4. navigate(/products/{id})
    
    ProductDetailsPage->>ProductController: 5. GET /product/{id}
    ProductController->>ProductService: 6. getProductById(id)
    
    ProductService->>Product: 7. findById(id)
    Product-->>ProductService: product
    
    ProductService->>ProductResponseDispatcher: 8. toProductResponse(product)
    
    alt productType == BOOK
        ProductResponseDispatcher->>ProductResponseDispatcher: 9a. mapBookDetails()
    else productType == CD
        ProductResponseDispatcher->>ProductResponseDispatcher: 9b. mapCDDetails()
    else productType == DVD
        ProductResponseDispatcher->>ProductResponseDispatcher: 9c. mapDVDDetails()
    else productType == NEWSPAPER
        ProductResponseDispatcher->>ProductResponseDispatcher: 9d. mapNewspaperDetails()
    end
    
    ProductResponseDispatcher-->>ProductService: productResponse
    ProductService-->>ProductController: BaseProductResponse
    ProductController-->>ProductDetailsPage: 10. ApiResponse<BaseProductResponse>
    
    ProductDetailsPage->>ProductDetailsPage: 11. renderProductDetails()
    ProductDetailsPage-->>Customer: 12. displayProductInfo(name, price, description, stock, type-specific details)
```

### 6.2 Analysis Class Diagram

```mermaid
classDiagram
    class HomePage {
        <<boundary>>
        +browseProducts()
        +displayProductList()
        +clickProduct(productId)
    }
    class ProductDetailsPage {
        <<boundary>>
        +navigate(productId)
        +renderProductDetails()
        +displayProductInfo()
    }
    class ProductController {
        <<controller>>
        +getProduct(id): ApiResponse
    }
    class ProductService {
        <<controller>>
        +getProductById(id): BaseProductResponse
    }
    class ProductResponseDispatcher {
        <<controller>>
        +toProductResponse(product): BaseProductResponse
        -mapBookDetails()
        -mapCDDetails()
        -mapDVDDetails()
        -mapNewspaperDetails()
    }
    class Product {
        <<entity>>
        -id: String
        -name: String
        -description: String
        -type: ProductType
        -stock: int
        -price: BigDecimal
        -weight: BigDecimal
        -imageUrl: String
        -active: boolean
    }
    class Book {
        <<entity>>
        -author: String
        -publisher: String
        -publicationDate: Date
        -pages: int
        -language: String
    }
    class CD {
        <<entity>>
        -artist: String
        -recordLabel: String
        -trackList: String
        -genre: String
    }
    class DVD {
        <<entity>>
        -director: String
        -runtime: int
        -studio: String
        -language: String
        -subtitles: String
    }
    class Newspaper {
        <<entity>>
        -publisher: String
        -publicationDate: Date
        -genre: String
    }

    HomePage --> ProductDetailsPage
    ProductDetailsPage --> ProductController
    ProductController --> ProductService
    ProductService --> ProductResponseDispatcher
    ProductService --> Product
    Product <|-- Book
    Product <|-- CD
    Product <|-- DVD
    Product <|-- Newspaper
```

### 6.3 Communication Diagram

```mermaid
flowchart LR
    Customer((Customer))
    HomePage[":HomePage\n<<boundary>>"]
    ProductDetailsPage[":ProductDetailsPage\n<<boundary>>"]
    ProductController[":ProductController\n<<controller>>"]
    ProductService[":ProductService\n<<controller>>"]
    ProductResponseDispatcher[":ProductResponseDispatcher\n<<controller>>"]
    Product[":Product\n<<entity>>"]

    Customer -->|"1: browseProducts()"| HomePage
    Customer -->|"2: clickProduct()"| HomePage
    HomePage -->|"3: navigate()"| ProductDetailsPage
    ProductDetailsPage -->|"4: GET /product/{id}"| ProductController
    ProductController -->|"5: getProductById()"| ProductService
    ProductService -->|"6: findById()"| Product
    ProductService -->|"7: toProductResponse()"| ProductResponseDispatcher
```

---

## Use Case 7: Search Products

### 7.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant HomePage as :HomePage<<boundary>>
    participant ProductFilters as :ProductFilters<<boundary>>
    participant ProductGrid as :ProductGrid<<boundary>>
    participant ProductController as :ProductController<<controller>>
    participant ProductService as :ProductService<<controller>>
    participant ProductRepository as :ProductRepository<<controller>>
    participant Product as :Product<<entity>>

    Customer->>HomePage: 1. visitHomePage()
    HomePage->>ProductController: 2. GET /product
    ProductController->>ProductService: 3. getAllProducts()
    ProductService->>ProductRepository: 4. findAll()
    ProductRepository->>Product: 5. query()
    Product-->>ProductRepository: products[]
    ProductRepository-->>ProductService: products[]
    ProductService-->>ProductController: List<BaseProductResponse>
    ProductController-->>HomePage: 6. ApiResponse<List<BaseProductResponse>>
    HomePage->>ProductGrid: 7. displayProducts(products)
    ProductGrid-->>Customer: 8. showProductList()
    
    Customer->>ProductFilters: 9. enterSearchKeyword(keyword)
    ProductFilters->>ProductFilters: 10. filterByName(keyword)
    ProductFilters-->>ProductGrid: 11. filteredProducts
    ProductGrid-->>Customer: 12. showFilteredResults()
    
    Customer->>ProductFilters: 13. selectCategory(type)
    ProductFilters->>ProductFilters: 14. filterByType(type)
    ProductFilters-->>ProductGrid: 15. filteredProducts
    ProductGrid-->>Customer: 16. showFilteredResults()
    
    Customer->>ProductFilters: 17. setPriceRange(min, max)
    ProductFilters->>ProductFilters: 18. filterByPrice(min, max)
    ProductFilters-->>ProductGrid: 19. filteredProducts
    ProductGrid-->>Customer: 20. showFilteredResults()
```

### 7.2 Analysis Class Diagram

```mermaid
classDiagram
    class HomePage {
        <<boundary>>
        +visitHomePage()
        +loadProducts()
    }
    class ProductFilters {
        <<boundary>>
        +enterSearchKeyword(keyword)
        +selectCategory(type)
        +setPriceRange(min, max)
        -filterByName(keyword)
        -filterByType(type)
        -filterByPrice(min, max)
    }
    class ProductGrid {
        <<boundary>>
        +displayProducts(products)
        +showProductList()
        +showFilteredResults()
    }
    class ProductController {
        <<controller>>
        +getProducts(): ApiResponse
    }
    class ProductService {
        <<controller>>
        +getAllProducts(): List~BaseProductResponse~
    }
    class ProductRepository {
        <<controller>>
        +findAll(): List~Product~
        +findByType(type): List~Product~
        +findByNameContaining(keyword): List~Product~
    }
    class Product {
        <<entity>>
        -id: String
        -name: String
        -type: ProductType
        -price: BigDecimal
        -stock: int
        -active: boolean
    }

    HomePage --> ProductFilters
    HomePage --> ProductGrid
    HomePage --> ProductController
    ProductFilters --> ProductGrid
    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductRepository --> Product
```

### 7.3 Communication Diagram

```mermaid
flowchart LR
    Customer((Customer))
    HomePage[":HomePage\n<<boundary>>"]
    ProductFilters[":ProductFilters\n<<boundary>>"]
    ProductGrid[":ProductGrid\n<<boundary>>"]
    ProductController[":ProductController\n<<controller>>"]
    ProductService[":ProductService\n<<controller>>"]
    ProductRepository[":ProductRepository\n<<controller>>"]
    Product[":Product\n<<entity>>"]

    Customer -->|"1: visitHomePage()"| HomePage
    HomePage -->|"2: GET /product"| ProductController
    ProductController -->|"3: getAllProducts()"| ProductService
    ProductService -->|"4: findAll()"| ProductRepository
    ProductRepository -->|"5: query()"| Product
    HomePage -->|"6: displayProducts()"| ProductGrid
    Customer -->|"7: enterSearchKeyword()"| ProductFilters
    ProductFilters -->|"8: filterByName()"| ProductFilters
    ProductFilters -->|"9: filteredProducts"| ProductGrid
```

---

## Use Case 8: Create Product

### 8.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor ProductManager
    participant ProductManagerPage as :ProductManagerPage<<boundary>>
    participant ProductForm as :ProductForm<<boundary>>
    participant ProductController as :ProductController<<controller>>
    participant ProductService as :ProductService<<controller>>
    participant ProductCreateDispatcher as :ProductCreateDispatcher<<controller>>
    participant ProductRepository as :ProductRepository<<controller>>
    participant Product as :Product<<entity>>

    ProductManager->>ProductManagerPage: 1. clickCreateProduct()
    ProductManagerPage->>ProductForm: 2. openProductForm(mode="create")
    ProductForm-->>ProductManager: 3. displayEmptyForm()
    
    ProductManager->>ProductForm: 4. fillProductDetails(name, description, type, price, stock, weight)
    ProductManager->>ProductForm: 5. fillTypeSpecificDetails(bookDetails/cdDetails/dvdDetails)
    ProductManager->>ProductForm: 6. uploadImage(imageFile)
    ProductManager->>ProductForm: 7. submitForm()
    
    ProductForm->>ProductController: 8. POST /product (BaseProductRequest)
    ProductController->>ProductService: 9. createProduct(productRequest)
    
    ProductService->>ProductRepository: 10. existsByName(name)
    ProductRepository-->>ProductService: exists
    
    alt productExists
        ProductService-->>ProductController: 11a. throw WebException(PRODUCT_EXISTED)
        ProductController-->>ProductForm: 12a. ApiResponse(error)
        ProductForm-->>ProductManager: 13a. showError("Product already exists")
    else productNotExists
        ProductService->>ProductCreateDispatcher: 11b. create(productRequest)
        
        alt type == BOOK
            ProductCreateDispatcher->>Product: 12b. createBook(request)
        else type == CD
            ProductCreateDispatcher->>Product: 12c. createCD(request)
        else type == DVD
            ProductCreateDispatcher->>Product: 12d. createDVD(request)
        else type == NEWSPAPER
            ProductCreateDispatcher->>Product: 12e. createNewspaper(request)
        end
        
        Product-->>ProductCreateDispatcher: product
        ProductCreateDispatcher-->>ProductService: product
        
        ProductService->>ProductRepository: 13. save(product)
        ProductRepository-->>ProductService: savedProduct
        
        ProductService-->>ProductController: 14. BaseProductResponse
        ProductController-->>ProductForm: 15. ApiResponse<BaseProductResponse>
        ProductForm-->>ProductManager: 16. showSuccess("Product created successfully")
        ProductManagerPage->>ProductManagerPage: 17. refreshProductList()
    end
```

### 8.2 Analysis Class Diagram

```mermaid
classDiagram
    class ProductManagerPage {
        <<boundary>>
        +clickCreateProduct()
        +refreshProductList()
    }
    class ProductForm {
        <<boundary>>
        +openProductForm(mode)
        +displayEmptyForm()
        +fillProductDetails()
        +fillTypeSpecificDetails()
        +uploadImage()
        +submitForm()
        +showSuccess()
        +showError()
    }
    class ProductController {
        <<controller>>
        +createProduct(request): ApiResponse
    }
    class ProductService {
        <<controller>>
        +createProduct(request): BaseProductResponse
    }
    class ProductCreateDispatcher {
        <<controller>>
        +create(request): Product
        -createBook(request): Book
        -createCD(request): CD
        -createDVD(request): DVD
        -createNewspaper(request): Newspaper
    }
    class ProductRepository {
        <<controller>>
        +existsByName(name): boolean
        +save(product): Product
    }
    class Product {
        <<entity>>
        -id: String
        -name: String
        -description: String
        -type: ProductType
        -stock: int
        -price: BigDecimal
        -weight: BigDecimal
        -imageUrl: String
        -createdDate: LocalDateTime
        -active: boolean
    }

    ProductManagerPage --> ProductForm
    ProductForm --> ProductController
    ProductController --> ProductService
    ProductService --> ProductCreateDispatcher
    ProductService --> ProductRepository
    ProductCreateDispatcher --> Product
    ProductRepository --> Product
```

### 8.3 Communication Diagram

```mermaid
flowchart LR
    ProductManager((ProductManager))
    ProductManagerPage[":ProductManagerPage\n<<boundary>>"]
    ProductForm[":ProductForm\n<<boundary>>"]
    ProductController[":ProductController\n<<controller>>"]
    ProductService[":ProductService\n<<controller>>"]
    ProductCreateDispatcher[":ProductCreateDispatcher\n<<controller>>"]
    ProductRepository[":ProductRepository\n<<controller>>"]
    Product[":Product\n<<entity>>"]

    ProductManager -->|"1: clickCreateProduct()"| ProductManagerPage
    ProductManagerPage -->|"2: openProductForm()"| ProductForm
    ProductManager -->|"3: fillProductDetails()"| ProductForm
    ProductForm -->|"4: POST /product"| ProductController
    ProductController -->|"5: createProduct()"| ProductService
    ProductService -->|"6: existsByName()"| ProductRepository
    ProductService -->|"7: create()"| ProductCreateDispatcher
    ProductCreateDispatcher -->|"8: createProduct()"| Product
    ProductService -->|"9: save()"| ProductRepository
```

---

## Use Case 9: Update Product

### 9.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor ProductManager
    participant ProductManagerPage as :ProductManagerPage<<boundary>>
    participant ProductForm as :ProductForm<<boundary>>
    participant ProductController as :ProductController<<controller>>
    participant ProductService as :ProductService<<controller>>
    participant ProductUpdateDispatcher as :ProductUpdateDispatcher<<controller>>
    participant ProductRepository as :ProductRepository<<controller>>
    participant Product as :Product<<entity>>

    ProductManager->>ProductManagerPage: 1. selectProduct(productId)
    ProductManagerPage->>ProductController: 2. GET /product/{id}
    ProductController->>ProductService: 3. getProductById(id)
    ProductService->>ProductRepository: 4. findById(id)
    ProductRepository-->>ProductService: product
    ProductService-->>ProductController: BaseProductResponse
    ProductController-->>ProductManagerPage: 5. ApiResponse<BaseProductResponse>
    
    ProductManagerPage->>ProductForm: 6. openProductForm(mode="edit", product)
    ProductForm-->>ProductManager: 7. displayFilledForm(productDetails)
    
    ProductManager->>ProductForm: 8. modifyProductDetails(name, price, stock, etc.)
    ProductManager->>ProductForm: 9. submitForm()
    
    ProductForm->>ProductController: 10. PUT /product/{id} (BaseProductRequest)
    ProductController->>ProductService: 11. updateProduct(id, productRequest)
    
    ProductService->>ProductRepository: 12. findById(id)
    ProductRepository-->>ProductService: existingProduct
    
    alt productNotFound
        ProductService-->>ProductController: 13a. throw WebException(PRODUCT_NOT_FOUND)
        ProductController-->>ProductForm: 14a. ApiResponse(error)
        ProductForm-->>ProductManager: 15a. showError("Product not found")
    else productFound
        ProductService->>ProductUpdateDispatcher: 13b. updateProduct(request, existingProduct)
        
        ProductUpdateDispatcher->>Product: 14b. updateFields(name, description, price, stock, weight)
        
        alt type == BOOK
            ProductUpdateDispatcher->>Product: 15b. updateBookFields()
        else type == CD
            ProductUpdateDispatcher->>Product: 15c. updateCDFields()
        else type == DVD
            ProductUpdateDispatcher->>Product: 15d. updateDVDFields()
        else type == NEWSPAPER
            ProductUpdateDispatcher->>Product: 15e. updateNewspaperFields()
        end
        
        Product->>Product: 16. setActive(true)
        Product->>Product: 17. setLastModifiedDate(now)
        
        ProductService->>ProductRepository: 18. save(product)
        ProductRepository-->>ProductService: updatedProduct
        
        ProductService-->>ProductController: 19. BaseProductResponse
        ProductController-->>ProductForm: 20. ApiResponse<BaseProductResponse>
        ProductForm-->>ProductManager: 21. showSuccess("Product updated successfully")
        ProductManagerPage->>ProductManagerPage: 22. refreshProductList()
    end
```

### 9.2 Analysis Class Diagram

```mermaid
classDiagram
    class ProductManagerPage {
        <<boundary>>
        +selectProduct(productId)
        +refreshProductList()
    }
    class ProductForm {
        <<boundary>>
        +openProductForm(mode, product)
        +displayFilledForm()
        +modifyProductDetails()
        +submitForm()
        +showSuccess()
        +showError()
    }
    class ProductController {
        <<controller>>
        +getProduct(id): ApiResponse
        +updateProduct(id, request): ApiResponse
    }
    class ProductService {
        <<controller>>
        +getProductById(id): BaseProductResponse
        +updateProduct(id, request): BaseProductResponse
    }
    class ProductUpdateDispatcher {
        <<controller>>
        +updateProduct(request, product)
        -updateBookFields()
        -updateCDFields()
        -updateDVDFields()
        -updateNewspaperFields()
    }
    class ProductRepository {
        <<controller>>
        +findById(id): Optional~Product~
        +save(product): Product
    }
    class Product {
        <<entity>>
        -id: String
        -name: String
        -description: String
        -type: ProductType
        -stock: int
        -price: BigDecimal
        -weight: BigDecimal
        -lastModifiedDate: LocalDateTime
        -active: boolean
        +setActive(boolean)
        +setLastModifiedDate(LocalDateTime)
    }

    ProductManagerPage --> ProductForm
    ProductForm --> ProductController
    ProductController --> ProductService
    ProductService --> ProductUpdateDispatcher
    ProductService --> ProductRepository
    ProductUpdateDispatcher --> Product
    ProductRepository --> Product
```

### 9.3 Communication Diagram

```mermaid
flowchart LR
    ProductManager((ProductManager))
    ProductManagerPage[":ProductManagerPage\n<<boundary>>"]
    ProductForm[":ProductForm\n<<boundary>>"]
    ProductController[":ProductController\n<<controller>>"]
    ProductService[":ProductService\n<<controller>>"]
    ProductUpdateDispatcher[":ProductUpdateDispatcher\n<<controller>>"]
    ProductRepository[":ProductRepository\n<<controller>>"]
    Product[":Product\n<<entity>>"]

    ProductManager -->|"1: selectProduct()"| ProductManagerPage
    ProductManagerPage -->|"2: GET /product/{id}"| ProductController
    ProductController -->|"3: getProductById()"| ProductService
    ProductService -->|"4: findById()"| ProductRepository
    ProductManagerPage -->|"5: openProductForm()"| ProductForm
    ProductManager -->|"6: modifyProductDetails()"| ProductForm
    ProductForm -->|"7: PUT /product/{id}"| ProductController
    ProductController -->|"8: updateProduct()"| ProductService
    ProductService -->|"9: updateProduct()"| ProductUpdateDispatcher
    ProductUpdateDispatcher -->|"10: updateFields()"| Product
    ProductService -->|"11: save()"| ProductRepository
```

---

## Use Case 10: Delete Product

### 10.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor ProductManager
    participant ProductManagerPage as :ProductManagerPage<<boundary>>
    participant ConfirmDialog as :ConfirmDialog<<boundary>>
    participant ProductController as :ProductController<<controller>>
    participant ProductService as :ProductService<<controller>>
    participant ProductRepository as :ProductRepository<<controller>>
    participant Product as :Product<<entity>>

    ProductManager->>ProductManagerPage: 1. selectProduct(productId)
    ProductManager->>ProductManagerPage: 2. clickDeleteProduct()
    
    ProductManagerPage->>ConfirmDialog: 3. showConfirmation("Are you sure you want to delete this product?")
    ConfirmDialog-->>ProductManager: 4. displayConfirmDialog()
    
    alt userCancels
        ProductManager->>ConfirmDialog: 5a. clickCancel()
        ConfirmDialog-->>ProductManagerPage: 6a. cancelled
        ProductManagerPage-->>ProductManager: 7a. returnToProductList()
    else userConfirms
        ProductManager->>ConfirmDialog: 5b. clickConfirm()
        ConfirmDialog->>ProductManagerPage: 6b. confirmed
        
        ProductManagerPage->>ProductController: 7b. DELETE /product/{id}
        ProductController->>ProductService: 8. deleteProduct(id)
        
        ProductService->>ProductRepository: 9. findById(id)
        ProductRepository-->>ProductService: product
        
        alt productNotFound
            ProductService-->>ProductController: 10a. throw WebException(PRODUCT_NOT_FOUND)
            ProductController-->>ProductManagerPage: 11a. ApiResponse(error)
            ProductManagerPage-->>ProductManager: 12a. showError("Product not found")
        else productFound
            Note over ProductService,Product: Soft delete - chỉ đánh dấu inactive<br/>không xóa khỏi database
            ProductService->>Product: 10b. setActive(false)
            ProductService->>ProductRepository: 11b. save(product)
            ProductRepository-->>ProductService: savedProduct
            
            ProductService-->>ProductController: 12b. "Product deleted Successfully!"
            ProductController-->>ProductManagerPage: 13. ApiResponse<String>
            ProductManagerPage-->>ProductManager: 14. showSuccess("Product deleted successfully")
            ProductManagerPage->>ProductManagerPage: 15. refreshProductList()
        end
    end
```

### 10.2 Analysis Class Diagram

```mermaid
classDiagram
    class ProductManagerPage {
        <<boundary>>
        +selectProduct(productId)
        +clickDeleteProduct()
        +refreshProductList()
        +showSuccess()
        +showError()
    }
    class ConfirmDialog {
        <<boundary>>
        +showConfirmation(message)
        +displayConfirmDialog()
        +clickConfirm()
        +clickCancel()
    }
    class ProductController {
        <<controller>>
        +deleteProduct(id): ApiResponse
    }
    class ProductService {
        <<controller>>
        +deleteProduct(id)
    }
    class ProductRepository {
        <<controller>>
        +findById(id): Optional~Product~
        +save(product): Product
    }
    class Product {
        <<entity>>
        -id: String
        -name: String
        -active: boolean
        +setActive(boolean)
    }

    ProductManagerPage --> ConfirmDialog
    ProductManagerPage --> ProductController
    ProductController --> ProductService
    ProductService --> ProductRepository
    ProductRepository --> Product
```

### 10.3 Communication Diagram

```mermaid
flowchart LR
    ProductManager((ProductManager))
    ProductManagerPage[":ProductManagerPage\n<<boundary>>"]
    ConfirmDialog[":ConfirmDialog\n<<boundary>>"]
    ProductController[":ProductController\n<<controller>>"]
    ProductService[":ProductService\n<<controller>>"]
    ProductRepository[":ProductRepository\n<<controller>>"]
    Product[":Product\n<<entity>>"]

    ProductManager -->|"1: selectProduct()"| ProductManagerPage
    ProductManager -->|"2: clickDeleteProduct()"| ProductManagerPage
    ProductManagerPage -->|"3: showConfirmation()"| ConfirmDialog
    ProductManager -->|"4: clickConfirm()"| ConfirmDialog
    ConfirmDialog -->|"5: confirmed"| ProductManagerPage
    ProductManagerPage -->|"6: DELETE /product/{id}"| ProductController
    ProductController -->|"7: deleteProduct()"| ProductService
    ProductService -->|"8: findById()"| ProductRepository
    ProductService -->|"9: setActive(false)"| Product
    ProductService -->|"10: save()"| ProductRepository
```

---

## Use Case 11: Log In

### 11.1 Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant LoginPage as :LoginPage<<boundary>>
    participant LoginForm as :LoginForm<<boundary>>
    participant AuthenticationController as :AuthenticationController<<controller>>
    participant AuthenticationService as :AuthenticationService<<controller>>
    participant AccountRepository as :AccountRepository<<controller>>
    participant Account as :Account<<entity>>
    participant InvalidatedToken as :InvalidatedToken<<entity>>

    User->>LoginPage: 1. navigateToLogin()
    LoginPage->>LoginForm: 2. displayLoginForm()
    LoginForm-->>User: 3. showUsernamePasswordFields()
    
    User->>LoginForm: 4. enterCredentials(username, password)
    User->>LoginForm: 5. clickLogin()
    
    LoginForm->>AuthenticationController: 6. POST /auth/token (AuthenticationRequest)
    AuthenticationController->>AuthenticationService: 7. authenticate(request)
    
    AuthenticationService->>AccountRepository: 8. findByUsername(username)
    AccountRepository->>Account: 9. query(username)
    Account-->>AccountRepository: account
    AccountRepository-->>AuthenticationService: account
    
    alt accountNotFound
        AuthenticationService-->>AuthenticationController: 10a. throw WebException(ACCOUNT_NOT_EXIST)
        AuthenticationController-->>LoginForm: 11a. ApiResponse(error)
        LoginForm-->>User: 12a. showError("Account does not exist")
    else accountFound
        AuthenticationService->>AuthenticationService: 10b. passwordEncoder.matches(password, account.password)
        
        alt passwordNotMatch
            AuthenticationService-->>AuthenticationController: 11b. throw WebException(LOGIN_ERROR)
            AuthenticationController-->>LoginForm: 12b. ApiResponse(error)
            LoginForm-->>User: 13b. showError("Invalid credentials")
        else passwordMatch
            AuthenticationService->>AuthenticationService: 11c. generateToken(account)
            Note over AuthenticationService: Tạo JWT token với:<br/>- subject: username<br/>- issuer: harkins.com<br/>- expiration: 1 hour<br/>- scope: roles
            AuthenticationService->>AuthenticationService: 12c. buildScope(account.roles)
            AuthenticationService-->>AuthenticationController: 13c. AuthenticationResponse(token, authenticated=true)
            AuthenticationController-->>LoginForm: 14. ApiResponse<AuthenticationResponse>
            LoginForm->>LoginForm: 15. saveTokenToStorage(token)
            LoginForm-->>User: 16. redirectToHomePage()
        end
    end
```

### 11.2 Analysis Class Diagram

```mermaid
classDiagram
    class LoginPage {
        <<boundary>>
        +navigateToLogin()
    }
    class LoginForm {
        <<boundary>>
        +displayLoginForm()
        +showUsernamePasswordFields()
        +enterCredentials(username, password)
        +clickLogin()
        +saveTokenToStorage(token)
        +redirectToHomePage()
        +showError(message)
    }
    class AuthenticationController {
        <<controller>>
        +login(request): ApiResponse
    }
    class AuthenticationService {
        <<controller>>
        +authenticate(request): AuthenticationResponse
        -generateToken(account): String
        -buildScope(roles): String
    }
    class AccountRepository {
        <<controller>>
        +findByUsername(username): Optional~Account~
    }
    class Account {
        <<entity>>
        -id: String
        -username: String
        -password: String
        -email: String
        -roles: Set~Role~
    }
    class Role {
        <<entity>>
        -name: String
        -description: String
    }
    class InvalidatedToken {
        <<entity>>
        -id: String
        -expiryTime: Date
    }

    LoginPage --> LoginForm
    LoginForm --> AuthenticationController
    AuthenticationController --> AuthenticationService
    AuthenticationService --> AccountRepository
    AccountRepository --> Account
    Account "*" -- "*" Role
```

### 11.3 Communication Diagram

```mermaid
flowchart LR
    User((User))
    LoginPage[":LoginPage\n<<boundary>>"]
    LoginForm[":LoginForm\n<<boundary>>"]
    AuthenticationController[":AuthenticationController\n<<controller>>"]
    AuthenticationService[":AuthenticationService\n<<controller>>"]
    AccountRepository[":AccountRepository\n<<controller>>"]
    Account[":Account\n<<entity>>"]

    User -->|"1: navigateToLogin()"| LoginPage
    LoginPage -->|"2: displayLoginForm()"| LoginForm
    User -->|"3: enterCredentials()"| LoginForm
    User -->|"4: clickLogin()"| LoginForm
    LoginForm -->|"5: POST /auth/token"| AuthenticationController
    AuthenticationController -->|"6: authenticate()"| AuthenticationService
    AuthenticationService -->|"7: findByUsername()"| AccountRepository
    AccountRepository -->|"8: query()"| Account
    AuthenticationService -->|"9: generateToken()"| AuthenticationService
```

---
