import { api } from "../../api/axiosClient";

export const voucherApi = {
    // POST /vouchers → Tạo voucher
    createVoucher: (data: {
        identifiedVoucherId?: number;
        expiryDate?: string;
        validated?: boolean;
        voucherName?: string;
        voucherDescription?: string;
        discountAmount?: number;
    }) => api.post(`/vouchers`, data),

    // GET /vouchers → Lấy tất cả voucher
    getAll: () => api.get(`/vouchers`),

    // GET /vouchers/{voucherId} → Lấy voucher theo ID
    getById: (voucherId: string) => api.get(`/vouchers/${voucherId}`),

    // DELETE /vouchers/{voucherId} → Xóa voucher
    deleteVoucher: (voucherId: string) => api.delete(`/vouchers/${voucherId}`)
};
