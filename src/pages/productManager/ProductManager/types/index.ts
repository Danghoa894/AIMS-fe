// Tạo local IProduct interface cho Product Manager
export interface IProduct {
  product_id: string;
  title: string;
  current_price: number;
  stock: number;
  weight: number;
  status: string;
  image?: string;
  imageUrl?: string;
  category: string;
}

// Thêm các types cụ thể cho Product Manager
export interface ProductFormData {
  title: string
  category: string
  weight: string
  current_price: string
  stock: string
  status: string
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