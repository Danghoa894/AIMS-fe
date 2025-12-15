import { api } from "../../api/axiosClient";
/*
    API dùng với sản phẩm dành cho người dùng 
    Phục vụ tìm kiếm, lọc, sắp xếp, xem thông tin chi tiết, đánh giá.
*/
export const goodsApi = {

    //GET /goods/by-rating?min= → Lấy sản phẩm theo điểm đánh giá hơn bằng min
    getByRating: (min: number) =>
        api.get(`/goods/by-rating`, { params: { min } }),

    //GET /goods/sort-name-asc → Sắp xếp sản phẩm theo tên tăng dần
    sortByNameAsc: () => api.get(`/goods/sort-name-asc`),

    //GET /goods/sort-name-desc → Sắp xếp sản phẩm theo tên giảm dần
    sortByNameDesc: () => api.get(`/goods/sort-name-desc`),

    //GET /goods/{goodsName}?goodsName= → Tìm kiếm sản phẩm theo tên
    searchByName: (name: string) =>
        api.get(`/goods/${name}`, { params: { goodsName: name } }),

    //GET /goods/{goodsCategory}?goodsCategory= → Tìm kiếm sản phẩm theo danh mục
    searchByCategory: (category: string) =>
        api.get(`/goods/${category}`, { params: { goodsCategory: category } }),

    //GET /goods/by-id/{goodsId} → Lấy sản phẩm theo ID
    getById: (goodsId: string) =>
        api.get(`/goods/by-id/${goodsId}`),

    //GET /goods/by-brand/{goodsBrand} → Lấy sản phẩm theo thương hiệu
    getByBrand: (brand: string) =>
        api.get(`/goods/by-brand/${brand}`),

    //GET /goods/by-price/{goodsPrice} → Lấy sản phẩm theo giá
    getByPrice: (price: number) =>
        api.get(`/goods/by-price/${price}`),

    //GET /goods/details/{goodsId} → Lấy chi tiết sản phẩm
    getDetails: (goodsId: string) =>
        api.get(`/goods/details/${goodsId}`),

    //GET /goods/{goodsId}/reviews → Lấy đánh giá của sản phẩm
    getReviews: (goodsId: string) =>
        api.get(`/goods/${goodsId}/reviews`),
};
