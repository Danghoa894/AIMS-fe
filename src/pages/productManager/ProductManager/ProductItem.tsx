import React from "react";
import { Card } from "../../../components/ui/card";
import { ProductDTO } from "../../../types/product.types";
import { Button } from "../../../components/ui/button";
import { Pencil, Trash2, ImageIcon } from "lucide-react";

// Format giá
const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

interface Props {
  product: ProductDTO;
  onEdit: (product: ProductDTO) => void;
  onDelete: (id: string) => void;
}

const ProductItem: React.FC<Props> = ({ product, onEdit, onDelete }) => {
  return (
    <Card className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* IMAGE */}
        <div className="flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                // Fallback nếu ảnh lỗi
                e.currentTarget.src = "https://via.placeholder.com/96?text=No+Image";
              }}
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                {product.name}
                {/* Trạng thái (Soft Delete) */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    product.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.active ? "Active" : "Deleted"}
                </span>
              </h3>

              <div className="mt-2 text-gray-600 space-y-1 text-sm">
                <p className="line-clamp-1">{product.description}</p>
                <p>
                  <strong>Type:</strong> {product.type}
                </p>
                <p>
                  <strong>Price:</strong> {formatPrice(product.price)}
                </p>
                <p>
                  <strong>Stock:</strong> {product.stock}
                </p>
                <p>
                  <strong>Artist:</strong> {product.artist}
                </p>
                <p>
                  <strong>Genre:</strong> {product.genre}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last modified: {new Date(product.lastModifiedDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 ml-4">
              <Button
                variant="outline"
                size="icon"
                title="Edit"
                onClick={() => onEdit(product)}
                disabled={!product.active}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                onClick={() => onDelete(product.id)}
                disabled={!product.active}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductItem;