// ==================== DELIVERY METHODS ====================
export const DELIVERY_METHODS = ['Standard', 'Express', 'Same Day'] as const;

// ==================== SHIPPING FEE CONSTANTS (AIMS Specification) ====================
export const SHIPPING_FEE = {
  // Major cities (Hanoi & Ho Chi Minh City)
  MAJOR_CITY: {
    BASE_FEE: 22000, // VND for first 3kg
    BASE_WEIGHT: 3, // kg
    EXTRA_FEE_PER_UNIT: 2500, // VND per 0.5kg
    UNIT_WEIGHT: 0.5, // kg
  },
  
  // Other provinces
  OTHER_PROVINCE: {
    BASE_FEE: 30000, // VND for first 0.5kg
    BASE_WEIGHT: 0.5, // kg
    EXTRA_FEE_PER_UNIT: 2500, // VND per 0.5kg
    UNIT_WEIGHT: 0.5, // kg
  },
  
  // Free shipping rules
  FREE_SHIPPING: {
    MINIMUM_ORDER_VALUE: 100000, // VND
    MAX_DISCOUNT: 25000, // VND
  },
} as const;

// ==================== VAT ====================
export const VAT_RATE = 0.1; // 10%
