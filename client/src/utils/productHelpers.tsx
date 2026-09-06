/**
 * Product Helper Utilities
 * 
 * Shared utilities for handling product data consistently across the app,
 * especially for dealing with inconsistent image field names in the database.
 */

/**
 * Get the best available product image URL
 * 
 * Products in the database may have images stored in different fields:
 * - imageUrl: "https://res.cloudinary.com/..." (newer products)
 * - images: ["https://..."] (array format)
 * - image: "..." (older products)
 * 
 * This function checks all possible fields and returns the first valid URL.
 */
export function getProductImage(product: any): string | null {
  // Check imageUrl first (most common for new products)
  if (product?.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http')) {
    return product.imageUrl;
  }

  // Check images array
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
      return firstImage;
    }
  }

  // Check legacy image field
  if (product?.image && typeof product.image === 'string' && product.image.startsWith('http')) {
    return product.image;
  }

  return null;
}

/**
 * Get category-specific emoji fallback
 */
export function getCategoryEmoji(category: string | undefined): string {
  if (!category) return '🥬';

  const categoryEmojiMap: Record<string, string> = {
    'Vegetables': '🥬',
    'Fruits': '🍎',
    'Dairy': '🥛',
    'Grains & Pulses': '🌾',
    'Grains': '🌾',
    'Pulses': '🫘',
    'Spices': '🌶️',
    'Dry Fruits': '🥜',
    'Organic Honey': '🍯',
    'Honey': '🍯',
    'Fresh Herbs': '🌿',
    'Herbs': '🌿',
  };

  return categoryEmojiMap[category] || '🥬';
}

/**
 * ProductImage Component Props
 */
interface ProductImageProps {
  product: any;
  alt?: string;
  className?: string;
  containerClassName?: string;
  showFallback?: boolean;
  fallbackSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * ProductImage Component
 * 
 * A reusable component for displaying product images with automatic fallback
 * to category-specific emojis when no image is available.
 * 
 * Usage:
 * ```tsx
 * <ProductImage 
 *   product={product} 
 *   alt={product.name}
 *   className="w-full h-full object-cover"
 * />
 * ```
 */
export function ProductImage({
  product,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "",
  showFallback = true,
  fallbackSize = 'lg',
}: ProductImageProps) {
  const imageUrl = getProductImage(product);

  // Emoji sizes
  const emojiSizeClass = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }[fallbackSize];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt || product?.name || 'Product image'}
        className={className}
        onError={(e) => {
          // If image fails to load and fallback is enabled, hide the img and show fallback
          if (showFallback) {
            e.currentTarget.style.display = 'none';
            const fallbackEl = e.currentTarget.nextElementSibling;
            if (fallbackEl && fallbackEl.classList.contains('product-image-fallback')) {
              fallbackEl.classList.remove('hidden');
            }
          }
        }}
      />
    );
  }

  // No image URL available or image failed to load - show fallback
  if (!showFallback) return null;

  const emoji = getCategoryEmoji(product?.category);

  return (
    <div 
      className={`product-image-fallback w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-900/20 via-emerald-700/20 to-lime-500/20 dark:from-green-950 dark:via-emerald-900/50 dark:to-lime-900/40 ${containerClassName}`}
    >
      <span className={`${emojiSizeClass} mb-2`} role="img" aria-label={product?.category || 'Product'}>
        {emoji}
      </span>
      {product?.name && (
        <span className="text-xs text-center text-gray-600 dark:text-gray-400 px-2 line-clamp-2 max-w-full">
          {product.name}
        </span>
      )}
    </div>
  );
}
