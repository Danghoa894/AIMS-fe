import { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { ProductFilters } from './ProductFilters';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { IAnyProduct, IProductFilters } from '../types/product.types';
import { toast } from 'sonner@2.0.3';

interface ProductGridProps {
  products: IAnyProduct[];
  onAddToCart?: (product: IAnyProduct) => void;
}

/**
 * ProductGrid: Main product listing component with filters and search
 * Layout: Sidebar (filters) + Grid (4 columns)
 */
export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [filters, setFilters] = useState<IProductFilters>({
    types: [],
    priceRange: { min: 0, max: 1_000_000 },
    condition: 'All',
    searchQuery: '',
  });

  // Filter products based on active filters
  const filteredProducts = useMemo(() => {

    return products.filter((product) => {
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(product.type)) {
        return false;
      }

      // Price range filter
      if (
        product.price < filters.priceRange.min ||
        product.price > filters.priceRange.max
      ) {
        return false;
      }

      // Condition filter
      if (filters.condition !== 'All' && product.condition !== filters.condition) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          product.name,
          product.description,
          product.type,
          product.barcode,
        ]
          .join(' ')
          .toLowerCase();

        // Add category-specific searchable fields
        if ('author' in product && product.author) {
          searchableText.concat(product.author.toLowerCase());
        }
        if ('artist' in product && product.artist) {
          searchableText.concat(product.artist.toLowerCase());
        }
        if ('director' in product && product.director) {
          searchableText.concat(product.director.toLowerCase());
        }

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [products, filters]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: value,
    }));
  };

  const handleAddToCart = (product: IAnyProduct) => {
    if (product.stock === 0 || product.active === false) {
      toast.error('This product is out of stock');
      return;
    }
    onAddToCart?.(product);
    toast.success(`Added "${product.name}" to cart`);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search products by title, author, artist, director..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block">
          <ProductFilters filters={filters} onFiltersChange={setFilters} />
        </aside>

        {/* Products Grid */}
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span>{' '}
              products
            </p>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found matching your filters.</p>
              <p className="text-sm text-gray-400">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
