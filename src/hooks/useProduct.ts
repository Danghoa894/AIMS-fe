import { useState, useCallback } from "react";
import { productApi } from "../services/products/productApi";
import type { ProductCreateRequest } from "../types/product.types";

export function useProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wrapper dùng chung để giảm lặp code
  const safeCall = async (fn: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fn();
      return res.data.result ?? res.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Something went wrong";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // 🔷 CRUD ACTIONS
  // --------------------------------

  // CREATE
  const createProduct = useCallback(async (data: ProductCreateRequest) => {
    return await safeCall(() => productApi.createProduct(data));
  }, []);

  // READ ALL
  const getAllProducts = useCallback(async () => {
    return await safeCall(() => productApi.getAllProducts());
  }, []);

  // READ BY ID
  const getProductById = useCallback(async (id: string) => {
    return await safeCall(() => productApi.getProductById(id));
  }, []);

  // UPDATE
  const updateProduct = useCallback(
    async (productId: string, data: Partial<ProductCreateRequest>) => {
      return await safeCall(() =>
        productApi.updateProduct(productId, data)
      );
    },
    []
  );

  // DELETE
  const deleteProduct = useCallback(async (productId: string) => {
    return await safeCall(() => productApi.deleteProduct(productId));
  }, []);

  return {
    loading,
    error,

    // CRUD Actions
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
  };
}
