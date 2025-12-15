/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN deliveryApi
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Data Coupling
*    - Với lớp nào:
*         + IDeliveryInfo (types layer)
*    - Lý do:
*         - Module chỉ nhận dữ liệu (weight, province, orderValue)
*           và trả kết quả tính phí vận chuyển.
*         - Không phụ thuộc vào mockProducts hay Cart → độc lập tốt.
*
* 2. COHESION:
*    - Mức độ: Functional Cohesion
*    - Giữa các thành phần:
*         + handleCalculateFee
*         + handleSubmitDeliveryInfo
*         → tất cả đều thuộc nghiệp vụ vận chuyển (Delivery).
*    - Lý do:
*         - Module tập trung xử lý duy nhất lĩnh vực Delivery API.
*         - Không chứa các hàm ngoài phạm vi vận chuyển.
* --------------------------------------------------------- */
import type { IDeliveryInfo } from '../types/checkout.types';

/**
 * Delivery API Service
 * Handles delivery-related API calls to Backend
 * 
 * IMPORTANT: All business logic (fee calculation, VAT, weight) 
 * is handled by Backend. Frontend only calls API and displays results.
 */

/**
 * API: Calculate Shipping Fee
 * Calls Backend to calculate delivery fee based on weight, province, and order value
 * Backend handles: Fee calculation rules, free shipping logic
 * 
 * @param weight - Total order weight (calculated by Backend)
 * @param province - Delivery province
 * @param orderValue - Total order value (calculated by Backend)
 * @returns deliveryFee from Backend
 */
export const handleCalculateFee = async (
  weight: number,
  province: string,
  orderValue: number
): Promise<number> => {
  // TODO: Replace with actual API call when Backend is ready
  // const response = await fetch('/api/delivery/calculate-fee', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ weight, province, orderValue }),
  // });
  // const data = await response.json();
  // return data.deliveryFee;

  // MOCK: Simulate API response
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock backend calculation
      const isHanoiOrHCM = province === 'Hà Nội' || province === 'TP. Hồ Chí Minh';
      let fee = 0;

      if (isHanoiOrHCM) {
        fee = 22000; // Base fee for first 3kg
        if (weight > 3) {
          fee += Math.ceil(weight - 3) * 2500;
        }
      } else {
        fee = 30000; // Base fee for first 0.5kg
        if (weight > 0.5) {
          fee += Math.ceil((weight - 0.5) * 2) * 2500;
        }
      }

      // Free shipping logic (Backend decides this)
      if (orderValue > 100000 && fee > 25000) {
        fee = Math.max(0, fee - 25000);
      } else if (orderValue > 100000) {
        fee = 0;
      }

      resolve(fee);
    }, 500);
  });
};

/**
 * API: Submit Delivery Information
 * Sends delivery info to Backend and receives updated order with calculated fees
 * Backend returns: deliveryId, calculatedFee, VAT, totalAmount, totalWeight
 * 
 * @param deliveryInfo - Customer's delivery information
 * @returns Updated IDeliveryInfo with deliveryId and calculatedFee from Backend
 */
export const handleSubmitDeliveryInfo = async (
  deliveryInfo: IDeliveryInfo
): Promise<IDeliveryInfo> => {
  // TODO: Replace with actual API call when Backend is ready
  // const response = await fetch('/api/delivery/submit', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(deliveryInfo),
  // });
  // const data = await response.json();
  // return data;

  // MOCK: Simulate Backend response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...deliveryInfo,
        deliveryId: `DEL-${Date.now()}`, // Backend generates this
        // deliveryFee is already calculated by handleCalculateFee
      });
    }, 800);
  });
};

/**
 * REMOVED: calculateVAT - This is Backend's responsibility
 * Backend calculates VAT as part of Order.totalAmount
 */
