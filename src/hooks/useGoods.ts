import { useCallback, useState } from "react";
import { goodsApi } from "../services/products/goodsApi";
/*
    Hook dùng với sản phẩm với người dùng 
    API phục vụ tìm kiếm, lọc, sắp xếp, view thông tin chi tiết, review.
*/
export const useGoods = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const safeCall = async (fn: () => Promise<any>) => {
        try {
        setLoading(true);
        setError(null);
        const res = await fn();
        return res.data.result ?? res.data;
        } catch (err: any) {
        setError(err?.response?.data?.message || "Something went wrong");
        return null;
        } finally {
        setLoading(false);
        }
    };
    /* BASIC GETTERS */
    const getById = useCallback(async (id: string) => {
        return await safeCall(() => goodsApi.getById(id));
    }, []);

    const getDetails = useCallback(async (id: string) => {
        return await safeCall(() => goodsApi.getDetails(id));
    }, []);

    const getReviews = useCallback(async (id: string) => {
        return await safeCall(() => goodsApi.getReviews(id));
    }, []);

    /* SEARCH */
    const searchByName = useCallback(async (name: string) => {
        return await safeCall(() => goodsApi.searchByName(name));
    }, []);

    const searchByCategory = useCallback(async (category: string) => {
        return await safeCall(() => goodsApi.searchByCategory(category));
    }, []);

    /* FILTER */

    const getByRating = useCallback(async (min: number) => {
        return await safeCall(() => goodsApi.getByRating(min));
    }, []);

    const getByBrand = useCallback(async (brand: string) => {
        return await safeCall(() => goodsApi.getByBrand(brand));
    }, []);

    const getByPrice = useCallback(async (price: number) => {
        return await safeCall(() => goodsApi.getByPrice(price));
    }, []);

    /* SORTING */

    const sortByNameAsc = useCallback(async () => {
        return await safeCall(() => goodsApi.sortByNameAsc());
    }, []);

    const sortByNameDesc = useCallback(async () => {
        return await safeCall(() => goodsApi.sortByNameDesc());
    }, []);

    return {
        loading,
        error,

        // Basic
        getById,
        getDetails,
        getReviews,

        // Search
        searchByName,
        searchByCategory,

        // Filter
        getByRating,
        getByBrand,
        getByPrice,

        // Sort
        sortByNameAsc,
        sortByNameDesc,
    };
}