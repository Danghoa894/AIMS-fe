import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PlusCircle, AlertCircle, ShieldAlert, Package, Trash2 } from "lucide-react";

import { productApi } from "../../../services/products/productApi";
import { ProductDTO, ProductRequestDTO, ProductTypee } from "../../../types/product.types"; 
import { useAuth } from "../../../hooks/useAuth";

import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import { Card } from "../../../components/ui/card";

import ProductForm from "./ProductForm";
import ProductItem from "./ProductItem";

// ============= TAB CONSTANTS =============
const TABS = {
  ACTIVE: 'active',
  DELETED: 'deleted'
} as const;

type TabType = typeof TABS[keyof typeof TABS];

const emptyProduct: ProductRequestDTO = {
  name: "",
  description: "",
  type: ProductTypee.CD, 
  stock: 0,
  weight: 0,
  price: 0,
  artist: "",
  recordLabel: "",
  genre: "",
  trackList: [],
};

// ============= TAB BUTTON COMPONENT =============
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}> = ({ active, onClick, icon, label, count }) => (
  <Button
    onClick={onClick}
    variant={active ? "default" : "outline"}
    className={`flex items-center gap-2 ${
      active ? 'bg-teal-600 hover:bg-teal-700' : ''
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
    <span className={`text-xs px-2 py-0.5 rounded-full ${
      active ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
    }`}>
      {count}
    </span>
  </Button>
);

// ============= MAIN COMPONENT =============
const ProductManagerPage = () => {
  // Auth
  const { user, isLoading } = useAuth();
  
  // States
  const [products, setProducts] = useState<ProductDTO[]>([]); 
  const [activeTab, setActiveTab] = useState<TabType>(TABS.ACTIVE);
  const [newProduct, setNewProduct] = useState<ProductRequestDTO>(emptyProduct); 
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null); 
  const [error, setError] = useState<string | null>(null);

  // CHECK PRODUCT_MANAGER ROLE
  const isProductManager = useCallback(() => {
    return user?.scope === "PRODUCT_MANAGER";
  }, [user]);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      const res = await productApi.getAllProducts();
      const products = res.data.result.map((p: ProductDTO) => ({
        ...p,
        trackList: p.trackList || []
      }));
      setProducts(products);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch products");
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user && isProductManager()) {
      loadProducts();
    }
  }, [loadProducts, isLoading, user, isProductManager]);

  // Computed Values - Filter products by tab
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      activeTab === TABS.ACTIVE ? p.active : !p.active
    );
  }, [products, activeTab]);

  const activeCount = useMemo(() => 
    products.filter(p => p.active).length, 
    [products]
  );

  const deletedCount = useMemo(() => 
    products.filter(p => !p.active).length, 
    [products]
  );

  // Tab Change Handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setIsAdding(false);
    setIsEditing(false);
    setEditingProduct(null);
    setError(null);
  }, []);

  // Input handler
  const handleChange = useCallback(
    (field: keyof ProductRequestDTO, value: any) => { 
      if (isEditing && editingProduct) {
        setEditingProduct((prev) => 
          prev ? { ...prev, [field]: value } : null
        );
      } else {
        setNewProduct((prev) => ({ ...prev, [field]: value }));
      }
    },
    [isEditing, editingProduct]
  );

  // Add product
  const handleAdd = useCallback(async () => {
    try {
      console.log("Sending request:", newProduct);
      
      const res = await productApi.createProduct(newProduct);
      const created: ProductDTO = res.data.result; 

      setProducts((prev) => [...prev, created]);
      setNewProduct(emptyProduct);
      setIsAdding(false);
      setError(null);
    } catch (err: any) {
      console.error("Error:", err);
      console.error("Response data:", err.response?.data);
      setError(err.response?.data?.message || "Failed to create product");
    }
  }, [newProduct]);

  // Edit handlers
  const startEdit = useCallback((product: ProductDTO) => { 
    setEditingProduct(product);
    setIsEditing(true);
    setIsAdding(false); 
    setError(null);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!editingProduct) return;

    try {
      const { id, createdDate, lastModifiedDate, active, ...updateData } = editingProduct;
      
      const res = await productApi.updateProduct(id, updateData);
      const updatedProduct: ProductDTO = res.data.result; 

      setProducts((prev) => 
        prev.map((p) => (p.id === id ? updatedProduct : p))
      );
      
      setEditingProduct(null);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update product");
    }
  }, [editingProduct]);

  const cancelEdit = useCallback(() => {
    setEditingProduct(null);
    setIsEditing(false);
  }, []);

  // Delete handler
  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product? (Soft Delete)")) {
      return;
    }
    
    try {
      await productApi.deleteProduct(id);
      
      // Update UI: set active = false
      setProducts((prev) => 
        prev.map((p) => (p.id === id ? { ...p, active: false } : p))
      );
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete product");
    }
  }, []);
  
  const startAdding = useCallback(() => {
    setIsAdding(true);
    setIsEditing(false); 
    setNewProduct(emptyProduct);
    setEditingProduct(null);
  }, []);

  // Early returns
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-screen">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Unauthorized</h2>
        <p className="text-gray-600 mt-2">Please login to access this page</p>

        <Button 
          className="mt-4 bg-green-600 hover:bg-green-700" 
          onClick={() => {
            const token = "eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJoYXJraW5zLmNvbSIsInN1YiI6InByb2R1Y3RtYW5hZ2VyMiIsImV4cCI6MTc2NTgxMDUwOCwiaWF0IjoxNzY1ODA2OTA4LCJqdGkiOiI1ZmE3YzIyYy1lMmMwLTQ2OGEtODQ1Mi1mNTlkODU0YzQ5N2QiLCJzY29wZSI6IlBST0RVQ1RfTUFOQUdFUiJ9.GzKOuQkeN3-kn4AUTPng9bweu83-hb9oNrr8uTJaTxvVmLRvNy8v2f2NVgp80GpXcjVzK8oYApDVvR-ZKN2Ixg";
            localStorage.setItem("token", token);
            window.location.reload();
          }}
        >
          ⚡ Quick Test Login (Product Manager)
        </Button>

        <Button className="mt-4" onClick={() => window.location.href = "/login"}>
          Go to Login
        </Button>
      </div>
    );
  }

  if (!isProductManager()) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-screen">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          You need <span className="font-bold text-teal-600">PRODUCT_MANAGER</span> role to access this page
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Current role: <span className="font-semibold text-red-600">{user.scope}</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          (Admin role is NOT allowed on this page)
        </p>
      </div>
    );
  }

  // Active form logic
  const activeForm = isAdding
    ? { 
        data: newProduct, 
        onSave: handleAdd, 
        onCancel: () => setIsAdding(false), 
        isEditMode: false 
      }
    : isEditing && editingProduct
    ? { 
        data: {
            name: editingProduct.name,
            description: editingProduct.description,
            type: editingProduct.type,
            stock: editingProduct.stock,
            weight: editingProduct.weight,
            price: editingProduct.price,
            artist: editingProduct.artist,
            recordLabel: editingProduct.recordLabel,
            genre: editingProduct.genre,
            trackList: editingProduct.trackList || [],
        } as ProductRequestDTO,
        onSave: handleUpdate, 
        onCancel: cancelEdit, 
        isEditMode: true 
      }
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Product Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as: <span className="font-semibold">{user.sub}</span> 
            (<span className="text-teal-600 font-semibold">{user.scope}</span>)
          </p>
        </div>

        {!isAdding && !isEditing && activeTab === TABS.ACTIVE && (
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={startAdding}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      <Separator />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-300 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-900 text-sm">{error}</span>
        </div>
      )}

      {/* Form */}
      {activeForm && (
        <ProductForm
          data={activeForm.data as ProductRequestDTO} 
          onChange={handleChange}
          onSave={activeForm.onSave}
          onCancel={activeForm.onCancel}
          isEditMode={activeForm.isEditMode}
        />
      )}

      <Separator />

      {/* TABS NAVIGATION */}
      <div className="flex gap-3">
        <TabButton
          active={activeTab === TABS.ACTIVE}
          onClick={() => handleTabChange(TABS.ACTIVE)}
          icon={<Package className="w-4 h-4" />}
          label="Active Products"
          count={activeCount}
        />
        <TabButton
          active={activeTab === TABS.DELETED}
          onClick={() => handleTabChange(TABS.DELETED)}
          icon={<Trash2 className="w-4 h-4" />}
          label="Deleted Products"
          count={deletedCount}
        />
      </div>

      {/* Product List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {activeTab === TABS.ACTIVE ? 'Active' : 'Deleted'} Products ({filteredProducts.length})
        </h2>

        {filteredProducts.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No {activeTab} products found
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((p) => (
              <ProductItem 
                key={p.id} 
                product={p} 
                onEdit={startEdit} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagerPage;