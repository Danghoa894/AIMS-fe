import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

import { useProduct } from "../../hooks/useProduct";
import { useCheckout } from "../../context/CheckoutContext";

import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Card } from "../../components/ui/card";
import { ProductCard } from "../../components/ProductCard";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import type { IProduct } from "../../types/checkout.types";
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Ruler,
  Weight,
  CheckCircle,
  XCircle,
  Star,
  Barcode,
} from "lucide-react";

import { toast } from "sonner";
import { IBook, ICD, IDVD, INewspaper, IAnyProduct } from "../../types/product.types";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCheckout();

  const {getProductById, loading,error } = useProduct();
  const [product, setProduct] = useState<any>(null);
  // const [details, setDetails] = useState<any>(null);
  // const [reviews, setReviews] = useState<any[]>([]);
  // const [related, setRelated] = useState<any[]>([]);

  const [quantity, setQuantity] = useState(1);

  // Load product, details, reviews
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const p = await getProductById(id);
      setProduct(p);

      // if (p?.type) {
      //   const rel = await searchByCategory(p.type);
      //   setRelated(rel?.filter((x: any) => x.id !== p.id).slice(0, 4));
      // }
    };

    load();
  }, [id]);

  if (loading)
    return <div className="text-center py-20 text-gray-500">Loading...</div>;

  if (!product || error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl mb-4">Product Not Found</h2>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    const productForCart: IProduct = {
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

    addToCart(productForCart, quantity);
    toast.success("Added to cart");
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(p);
  // Render category-specific details
  const renderCategoryDetails = () => {
    switch (product.type) {
      case 'Book': {
        const book = product as IBook;
        return (
          <div className="space-y-4">
            <h3 className="text-teal-600">Book Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Author(s)</p>
                <p>{book.author}</p>
              </div>
              <div>
                <p className="text-gray-500">Publisher</p>
                <p>{book.publisher}</p>
              </div>
              <div>
                <p className="text-gray-500">Cover Type</p>
                <p>{book.coverType}</p>
              </div>
              <div>
                <p className="text-gray-500">Publication Date</p>
                <p>
                  {new Date(book.publicationDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {book.pages && (
                <div>
                  <p className="text-gray-500">Pages</p>
                  <p>{book.pages}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <p className="text-gray-500">Language</p>
                  <p>{book.language}</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'Newspaper': {
        const newspaper = product as INewspaper;
        return (
          <div className="space-y-4">
            <h3 className="text-teal-600">Newspaper Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Editor-in-Chief</p>
                <p>{newspaper.editorInChief}</p>
              </div>
              <div>
                <p className="text-gray-500">Publisher</p>
                <p>{newspaper.publisher}</p>
              </div>
              <div>
                <p className="text-gray-500">Publication Date</p>
                <p>
                  {new Date(newspaper.publicationDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {newspaper.issueNumber && (
                <div>
                  <p className="text-gray-500">Issue Number</p>
                  <p>{newspaper.issueNumber}</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'CD': {
        const cd = product as ICD;
        return (
          <div className="space-y-4">
            <h3 className="text-teal-600">CD Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-500">Artist(s)</p>
                <p>{cd.artist}</p>
              </div>
              <div>
                <p className="text-gray-500">Record Label</p>
                <p>{cd.recordLabel}</p>
              </div>
              <div>
                <p className="text-gray-500">Release Date</p>
                <p>
                  {new Date(cd.releaseDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {cd.genre && (
                <div>
                  <p className="text-gray-500">Genre</p>
                  <p>{cd.genre}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-gray-500 mb-2">Track List</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {cd.trackList.map((track, index) => (
                  <li key={index}>{track}</li>
                ))}
              </ol>
            </div>
          </div>
        );
      }

      case 'DVD': {
        const dvd = product as IDVD;
        return (
          <div className="space-y-4">
            <h3 className="text-teal-600">DVD Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Disc Type</p>
                <p>{dvd.discType}</p>
              </div>
              <div>
                <p className="text-gray-500">Director</p>
                <p>{dvd.director}</p>
              </div>
              <div>
                <p className="text-gray-500">Runtime</p>
                <p>{dvd.runtime} minutes</p>
              </div>
              <div>
                <p className="text-gray-500">Release Date</p>
                <p>
                  {new Date(dvd.releaseDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {dvd.studio && (
                <div>
                  <p className="text-gray-500">Studio</p>
                  <p>{dvd.studio}</p>
                </div>
              )}
              {dvd.genre && (
                <div>
                  <p className="text-gray-500">Genre</p>
                  <p>{dvd.genre}</p>
                </div>
              )}
              {dvd.language && (
                <div>
                  <p className="text-gray-500">Language</p>
                  <p>{dvd.language}</p>
                </div>
              )}
              {dvd.subtitles && dvd.subtitles.length > 0 && (
                <div>
                  <p className="text-gray-500">Subtitles</p>
                  <p>{dvd.subtitles.join(', ')}</p>
                </div>
              )}
            </div>
            {dvd.cast && dvd.cast.length > 0 && (
              <div>
                <p className="text-gray-500 mb-2">Cast</p>
                <p className="text-sm">{dvd.cast.join(', ')}</p>
              </div>
            )}
          </div>
        );
      }
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="text-teal-600 hover:text-teal-700"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Products
      </Button>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Image & Physical Attributes */}
        <div className="space-y-6">
          {/* Image */}
          <Card className="border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-50">
              <ImageWithFallback
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </Card>
                    {/* Physical Attributes */}
                    <Card className="p-6 border-gray-200">
                      <h3 className="mb-4 text-teal-600">Physical Attributes</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 text-sm">
                          <Barcode className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-gray-500">Barcode</p>
                            <p className="font-mono">barcode của sản phẩm</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-start gap-3 text-sm">
                          <Ruler className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-gray-500">Dimensions (H × W × L)</p>
                            <p>
                              {'example'} × {'example'} ×{' '}
                              {'example'} cm
                            </p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-start gap-3 text-sm">
                          <Weight className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-gray-500">Weight</p>
                            <p>{product.weight} kg</p>
                          </div>
                        </div>
                      </div>
                    </Card>
        </div>


        {/* Info */}
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-teal-600">{product.type}</Badge>

            {isOutOfStock ? (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" /> Out of Stock
              </Badge>
            ) : (
              <Badge variant="outline" className="border-green-600 text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                In Stock ({product.stock})
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Rating (demo, backend chưa có) */}
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
            {/* <span className="text-gray-500 text-sm">{reviews.length} reviews</span> */}
          </div>

          <p className="text-gray-700">{product.description}</p>

          {/* Price */}
          <Card className="p-6 bg-teal-50 border-gray-200">
            <p className="text-sm text-gray-600">Price</p>
            <p className="text-2xl font-semibold text-teal-700">
              {formatPrice(product.price)}
            </p>
          </Card>

          {/* Quantity + Add to cart */}
          <div className="space-y-4">
            <label className="text-sm">Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
              >
                -
              </Button>

              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20 text-center border rounded-md"
              />

              <Button
                variant="outline"
                size="icon"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </Button>
            </div>

            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="lg"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
            <p className="text-gray-500">No reviews yet.</p>
            <p>Chưa có review trong BE</p>
        {/* {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r, index) => (
              <Card key={index} className="p-4 border-gray-200">
                <p className="font-semibold">{r.reviewer}</p>
                <p className="text-sm text-gray-600">{r.comment}</p>
              </Card>
            ))}
          </div>
        )} */}
      </section>

      {/* Related products */}
      <section>
          <h2 className="text-xl font-semibold mb-4">Related Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard key={product.id} product={product} />
            <p>Các sản phẩm liên quan</p>
          </div>
        </section>
      {/* {related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Related Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard key={product.id} product={product} />
            <p>Các sản phẩm liên quan</p>
          </div>
        </section>
      )} */}
    </div>
  );
}
