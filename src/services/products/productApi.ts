import {api} from "../../api/axiosClient";
import type {ProductDTO, ProductRequestDTO} from "../../types/product.types"
/* 
    API phục vụ
    CRUD (tạo, xem, sửa, xóa) bản ghi sản phẩm trong hệ thống.
*/
export const productApi = {
    
    /*
        /product
    */
    // 1. POST /product → Tạo sản phẩm mới
    createProduct: (data: ProductRequestDTO) => // Dùng ProductRequestDTO
        api.post("/product", data),
    
    // 2. GET /product → Lấy toàn bộ sản phẩm.
    getAllProducts: () => 
        api.get("/product"),


    /* 
        /product/{productId}  
    */
    // 1. GET /product/{productId} → Lấy sản phẩm theo ID     // lỗi file .json để post
    getProductById: (id: string) => api.get(`/product/${id}`),

    //2. PUT /product/{productId} -> Cập nhật sản phẩm
    updateProduct: (productId: string, data: Partial<ProductRequestDTO>) => // Dùng ProductRequestDTO
        api.put(`/product/${productId}`, data),

    // 3. DELETE /product/{productId} → Xoá sản phẩm
    deleteProduct: (productId: string) =>
        api.delete(`/product/${productId}`),
}