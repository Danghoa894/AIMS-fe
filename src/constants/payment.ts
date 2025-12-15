// ==================== PAYMENT METHODS ====================
export const PAYMENT_METHODS = {
  VIET_QR: 'VietQR',
  PAYPAL: 'PayPal',
} as const;

// ==================== PAYMENT STATUS ====================
export const PAYMENT_STATUS = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
