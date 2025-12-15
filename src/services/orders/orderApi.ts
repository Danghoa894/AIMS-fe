import { api } from "../../api/axiosClient";

export const ordersApi = {
    // POST /orders/create → Tạo đơn hàng
    createOrder: (data: any) => api.post(`/orders/create`, data),

    // PUT /orders/update-item-status/{orderItemId}?status=... → Cập nhật trạng thái 1 item
    updateOrderItemStatus: (orderItemId: string, status: string) =>
        api.put(`/orders/update-item-status/${orderItemId}`, null, {
            params: { status }
        }),

    // GET /orders/order-status/{orderId} → Lấy trạng thái đơn hàng
    getOrderStatus: (orderId: string) =>
        api.get(`/orders/order-status/${orderId}`),

    // PUT /orders/{orderId}/status?status=... → Cập nhật trạng thái đơn hàng
    updateOrderStatus: (orderId: string, status: string) =>
        api.put(`/orders/${orderId}/status`, null, { params: { status } }),

    // PUT /orders/{orderId}/payment-status?status=... → Cập nhật trạng thái thanh toán
    updatePaymentStatus: (orderId: string, status: string) =>
        api.put(`/orders/${orderId}/payment-status`, null, {
            params: { status }
        }),

    // GET /orders/all → Lấy tất cả đơn hàng
    getAllOrders: () => api.get(`/orders/all`),

    // GET /orders/status/{status} → Lấy đơn hàng theo trạng thái
    getOrdersByStatus: (status: string) =>
        api.get(`/orders/status/${status}`),

    // DELETE /orders/{orderId} → Xóa đơn hàng
    deleteOrder: (orderId: string) =>
        api.delete(`/orders/${orderId}`)
};
