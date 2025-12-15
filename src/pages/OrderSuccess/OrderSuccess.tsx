/* ---------------------------------------------------------
* ĐÁNH GIÁ THIẾT KẾ MÔ-ĐUN OrderSuccess (Page Component)
* ---------------------------------------------------------
* 1. COUPLING:
*    - Mức độ: Data Coupling + Control Coupling nhẹ
*
*    - Phụ thuộc vào:
*         + React:
*               - useEffect
*         + React Router:
*               - useNavigate
*         + Context:
*               - useCheckout (CheckoutContext)
*         + Components:
*               - OrderSuccessComponent
*
*    - Lý do:
*         - Component nhận dữ liệu từ CheckoutContext → Data Coupling.
*         - Gọi navigate('/cart') trong useEffect → Control Coupling nhẹ 
*           (điều hướng dựa vào điều kiện).
*         - Không thao tác vào logic nội bộ của context hoặc component con.
*         - Không có vòng phụ thuộc giữa các mô-đun.
*       → Coupling thấp và lành mạnh.
*
* ---------------------------------------------------------
* 2. COHESION:
*    - Mức độ: Functional Cohesion (cao)
*
*    - Các chức năng chính:
*         + Kiểm tra transactionData và orderId.
*         + Điều hướng nếu thiếu dữ liệu.
*         + Truyền dữ liệu sang OrderSuccessComponent.
*
*    - Lý do:
*         - Toàn bộ logic phục vụ **một chức năng duy nhất**:
*           “Trang xác nhận đơn hàng sau thanh toán”.
*         - Không chứa logic hiển thị chi tiết đơn hàng (được tách vào component riêng).
*         - Không có logic thừa như xử lý giỏ hàng hay thanh toán.
*       → Cohesion rất cao và tách biệt rõ trách nhiệm.
*
* ---------------------------------------------------------
*/





import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCheckout } from '../../context/CheckoutContext';
import { OrderSuccess as OrderSuccessComponent } from '../../components/OrderSuccess';


export function OrderSuccess() {
  const navigate = useNavigate();
  const { currentOrder, transactionData, shippingData } = useCheckout();

  // Redirect if no transaction data
  useEffect(() => {
    if (!transactionData || !currentOrder.orderId) {
      console.log('OrderSuccess: Missing data, redirecting to cart', { 
        hasTransactionData: !!transactionData, 
        orderId: currentOrder.orderId 
      });
      navigate('/cart');
    }
  }, [transactionData, currentOrder.orderId, navigate]);

  if (!transactionData) {
    console.log('OrderSuccess: No transaction data, showing null');
    return null;
  }

  return (
    <OrderSuccessComponent
      currentOrder={currentOrder}
      transactionData={transactionData}
      shippingData={shippingData}
    />
  );
}