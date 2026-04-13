import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { productService } from '../services/productService';
import type { Product } from '../types';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addItem, isInCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const productData = await productService.getById(id);
        setProduct(productData);
        
        // Fetch related products from same category
        const related = await productService.getAll({
          category: productData.category,
        }, 1, 4);
        setRelatedProducts(related.data.filter((p) => p.id !== id));
      } catch (error) {
        showToast('Failed to load product details', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, showToast]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    showToast(`${quantity} × ${product.name} added to cart`, 'success');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading product..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <EmptyState
          title="Product not found"
          description="The product you're looking for doesn't exist or has been removed."
          action={{
            label: "Browse Products",
            onClick: () => navigate('/products'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-green-600">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/products')} className="hover:text-green-600">Products</button>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
                  {product.category}
                </span>
                {product.isAvailable ? (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
                    In Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(product.rating!) ? 'fill-current' : 'text-gray-300'}`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{product.rating}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({product.reviewsCount || 0} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-gray-500 dark:text-gray-400">per {product.unit}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {product.quantity} {product.unit}s available
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-900 dark:text-white">Quantity:</span>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium text-gray-900 dark:text-white min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!product.isAvailable || isInCart(product.id)}
              >
                {isInCart(product.id) ? 'Added to Cart' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleBuyNow}
                disabled={!product.isAvailable}
              >
                Buy Now
              </Button>
            </div>

            {/* Farmer Info */}
            <Card padding="md" shadow="sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl">👨‍🌾</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {product.farmerName || 'Local Farmer'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {product.location}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Products
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <Card key={related.id} className="p-4" hover>
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/products/${related.id}`)}
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-4xl">🥬</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {related.name}
                    </h3>
                    <p className="text-green-600 dark:text-green-400 font-bold">
                      ₹{related.price.toLocaleString('en-IN')}/{related.unit}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
