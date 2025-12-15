import { api } from "../../api/axiosClient";

export const paymentApi = {
    // POST /zalopay/create-order → Tạo giao dịch Zalopay
    createZaloPayOrder: (data: {
        amount: number;
        orderInfo: string;
        orderType: string;
    }) => api.post(`/zalopay/create-order`, data),

    // GET /zalopay/order-status/{appTransId} → Lấy trạng thái giao dịch
    getZaloPayOrderStatus: (appTransId: string) =>
        api.get(`/zalopay/order-status/${appTransId}`),

    // POST /zalopay/callback → ZaloPay gửi callback về server
    // (frontend thường không dùng API này, nhưng mình vẫn viết cho đầy đủ)
    handleZaloPayCallback: (data: any) =>
        api.post(`/zalopay/callback`, data),
};
