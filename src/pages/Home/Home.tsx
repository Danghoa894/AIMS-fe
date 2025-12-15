import { use, useEffect, useState } from "react";
import { useProduct } from "../../hooks/useProduct";    
import { useCheckout } from "../../context/CheckoutContext";

import { IProduct } from "../../types/checkout.types";
import { IAnyProduct } from "../../types/product.types";

import { Button } from "../../components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";
import { ProductGrid } from "../../components/ProductGrid";

export function Home() {
  const navigate = useNavigate();
  const { addToCart, currentOrder } = useCheckout();

  // gọi API 
  const { getAllProducts, loading, error } = useProduct();
  const [products, setProducts] = useState<IAnyProduct[]>([]);

  // Load tất cả goods
  useEffect(() => {
    const load = async () => {
      const list = await getAllProducts();
      if (list) setProducts(list);
    };
    load();
  }, []);

  // Add to cart
  const handleAddToCart = (product: IAnyProduct) => {
    const item: IProduct = {
        id: product.id,               
        name: product.name,           
        description: product.description,      
        price: product.price,             
        stock: product.stock,             
        weight: product.weight,            
        type: product.type,         
        active: product.active,           
        imageUrl: product.imageUrl
    };
    addToCart(item, 1);
  };

  const cartItemCount = currentOrder.products.length;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl p-12 text-center space-y-6">
        <h1 className="text-teal-600">
          Buy Physical Media – Books, Newspapers, CDs & DVDs
        </h1>

        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          Authentic media products with detailed information and fair prices
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => {
              const section = document.getElementById("products");
              section?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Shop Now
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/cart")}
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </Button>
        </div>
      </div>
      {/* Product Grid Section */}
      <div id="products" className="scroll-mt-4">
        <ProductGrid 
          products={products}
          onAddToCart={handleAddToCart} />
      </div>

    </div>
  );
}
