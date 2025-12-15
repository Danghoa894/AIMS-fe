import { useNavigate } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShoppingCart, Star } from 'lucide-react';
import { IAnyProduct, IBook, INewspaper, ICD, IDVD } from '../types/product.types';

interface ProductCardProps {
  product: IAnyProduct;
  onAddToCart?: (product: IAnyProduct) => void;
}

/**
 * ProductCard: Displays product information with type-specific details
 * Supports: Books, Newspapers, CDs, DVDs
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();
  const isOutOfStock = product.stock === 0 || product.active === false;

  // Format price to VND
  const formatPrice = (price: number) => {
    return `${new Intl.NumberFormat('vi-VN').format(price)} ₫`;
  };

  // Generate random rating for demo (4.0 - 5.0)
  const rating = (4.0 + Math.random()).toFixed(1);

  // Calculate old price (20-30% higher than current price)
  const oldPrice = Math.round(product.price * 1.25);

  // Get author/creator name based on type
  const getCreatorName = () => {
    switch (product.type) {
      case 'Book':
        return (product as IBook).author;
      case 'Newspaper':
        return (product as INewspaper).publisher;
      case 'CD':
        return (product as ICD).artist;
      case 'DVD':
        return (product as IDVD).director;
      default:
        return '';
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Product Image - Consistent size for all products */}
      <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-1.5 flex-1 flex flex-col">
        {/* Category Badge */}
        <Badge 
          variant="secondary"
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none w-fit text-xs"
        >
          {product.type}
        </Badge>

        {/* Title */}
        <h3 
          className="line-clamp-2 text-sm leading-tight text-gray-900"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/products/${product.id}`);
          }}
        >
          {product.name}
        </h3>

        {/* Creator/Author */}
        <p className="text-xs text-gray-600 line-clamp-1">
          {getCreatorName()}
        </p>

        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
            />
          ))}
          <span className="text-xs text-gray-600 ml-0.5">({rating})</span>
        </div>

        {/* Price and Add Button */}
        <div className="flex items-end justify-between pt-1 mt-auto">
          <div className="space-y-0.5">
            <p className="text-teal-600 text-lg font-semibold">{formatPrice(product.price)}</p>
            {/* giá cũ -- chưa giảm giá chưa gán với be */}
            {/* <p className="text-xs text-gray-400 line-through">{formatPrice(oldPrice)}</p> */}
          </div>
          
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 h-8 px-3"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}