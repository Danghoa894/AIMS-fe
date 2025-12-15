import {ProductType} from "./product.types"
// ==================== PAYMENT STATUS ====================
// Type union matching Back-end PaymentStatus enum
export type PaymentStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "CREATED"
  | "ERROR";

// ==================== PRODUCT ====================
// Based on Back-end Product class
export interface IProduct {
  id: string                
  name: string              
  description?: string      
  price: number             
  stock: number             
  weight: number            
  type: ProductType         
  active: boolean           
  imageUrl?: string         

  createdDate?: string      
  lastModifiedDate?: string
}


// ==================== CART ITEM ====================
// Based on Back-end ProductAddedToCart class
export interface ICartItem {
  id: string; // unique identifier
  product: IProduct;
  addedQuantity: number;
  totalPrice: number;
}

// ==================== DELIVERY INFO ====================
// Based on Back-end DeliveryInfo class
export interface IDeliveryInfo {
  deliveryId?: string; // unique identifier
  fullName: string;
  Email: string; // Note: Capital 'E' as per spec
  phoneNumber: string;
  address: string;
  province: string; // Province/City for delivery fee calculation
  note?: string;
  deliveryMethod: string; // Chosen delivery method
  deliveryFee: number; // Calculated shipping fee
}
//====================== AUTHENTICATED ====================
export interface AuthenticationResponse {
  token: string;
  authenticated: boolean;
}
// ==================== ORDER ====================
// Based on Back-end Order class
export interface IOrder {
  orderId?: string;
  products: ICartItem[];
  productCost: number; // Total value of the products
  totalWeight: number;
  totalAmount: number; // Total amount of the entire order
  deliveryInfo?: IDeliveryInfo;
  orderStatus: string;
  transactionInfo?: ITransactionInfo;
}

// ==================== TRANSACTION INFO ====================
// Based on Back-end TransactionInfo class
export interface ITransactionInfo {
  transactionID: string;
  content: string;
  dateTime: Date;
  paymentStatus: PaymentStatus;
  errorMessage?: string;
  invoiceStatus: boolean;
  qrCodeString: string; // QR Code string for display
}

// ==================== PRODUCT MANAGER TYPES ====================
export interface ProductFormData {
  title: string
  type: string
  weight: string
  current_price: string
  stock: string
  status: string
  image?: string // Thêm field ảnh
}

export interface ProductItemProps {
  product: IProduct
  onEdit: (product: IProduct) => void
  onDelete: (id: string) => void
  isEditing: boolean
}

export interface ProductFormProps {
  data: ProductFormData
  onChange: (field: keyof ProductFormData, value: string) => void
  onSave: () => void
  onCancel: () => void
  isEdit: boolean
}

// Constants cho Product Manager
export const STATUSES = ['Available', 'Out of Stock', 'Discontinued'] as const
export const CATEGORIES = ['Beverage', 'Food', 'Electronics', 'Apparel', 'Other'] as const