import { api } from "../../api/axiosClient";

export const reviewApi = {
    // GET /reviews → Lấy toàn bộ review
    getAll: () => api.get(`/reviews`),

    // POST /reviews/create → Tạo review
    create: (data: {
        goodsId: string;
        userName: string;
        content: string;
        rating: number;
    }) => api.post(`/reviews/create`, data),

    // GET /reviews/{reviewId} → Lấy review theo ID
    getById: (reviewId: string) => api.get(`/reviews/${reviewId}`),

    // DELETE /reviews/{reviewId} → Xóa review
    deleteReview: (reviewId: string) => api.delete(`/reviews/${reviewId}`),

    // PUT /reviews/{reviewId} → Cập nhật review
    update: (
        reviewId: string,
        data: {
            content?: string;
            rating?: number;
        }
    ) => api.put(`/reviews/${reviewId}`, data)
};
