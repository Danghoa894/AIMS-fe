/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN index.ts
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Content Coupling (thấp) / Import Coupling
*    - Với lớp nào:
*         + cartApi
*         + deliveryApi
*         + paymentApi
*    - Lý do:
*         - File này chỉ re-export module khác → không có logic.
*
* 2. COHESION:
*    - Mức độ: Logical Cohesion
*    - Giữa các thành phần:
*         + export * from './cartApi'
*         + export * from './deliveryApi'
*         + export * from './paymentApi'
*    - Lý do:
*         - Tập hợp các API lại cho tiện import, không liên quan nghiệp vụ.
* --------------------------------------------------------- */
export * from './cartApi';
export * from './deliveryApi';
export * from './paymentApi';
