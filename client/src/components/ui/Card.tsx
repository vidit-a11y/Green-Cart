import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  variant?: 'default' | 'glass' | 'nature' | 'elevated';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export function Card({
  children,
  padding = 'md',
  shadow = 'md',
  hover = false,
  variant = 'default',
  rounded = 'xl',
  className = '',
  ...props
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg shadow-green-900/5',
    lg: 'shadow-xl shadow-green-900/10',
  };

  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-green-100/50 dark:border-gray-700',
    glass: 'glass bg-white/70 dark:bg-gray-800/70 border-white/40 dark:border-gray-700/50',
    nature: 'bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-gray-800/80 border-green-200/50 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 border-0 shadow-2xl shadow-green-900/10',
  };

  const roundedStyles = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[2rem]',
    '3xl': 'rounded-[2.5rem]',
  };

  const hoverStyles = hover
    ? 'hover:shadow-2xl hover:shadow-green-900/15 hover:-translate-y-2 hover:border-green-200 transition-all duration-500 cursor-pointer group'
    : '';

  const classes = [
    variants[variant],
    paddings[padding],
    shadows[shadow],
    roundedStyles[rounded],
    hoverStyles,
    'relative overflow-hidden',
    className,
  ].join(' ');

  return (
    <div className={classes} {...props}>
      {/* Subtle gradient overlay for nature variant */}
      {variant === 'nature' && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  farmerName?: string;
  location?: string;
  rating?: number;
  reviewsCount?: number;
  onAddToCart?: () => void;
  onClick?: () => void;
}

export function ProductCard({
  name,
  price,
  unit,
  image,
  farmerName,
  location,
  rating,
  reviewsCount,
  onAddToCart,
  onClick,
}: ProductCardProps) {
  return (
    <Card 
      hover={!!onClick} 
      variant="nature" 
      rounded="2xl" 
      className="h-full flex flex-col group"
    >
      {/* Image Container with gradient border effect */}
      <div 
        className="relative aspect-square mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 cursor-pointer"
        onClick={onClick}
      >
        {/* Gradient border overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-200/50 to-emerald-200/50 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Hover overlay with icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-4">
          <span className="text-white text-sm font-medium">Click to view</span>
        </div>
        
        {/* Top badge - optional organic tag */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur text-xs font-semibold text-green-700 dark:text-green-400 shadow-sm">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Organic
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col" onClick={onClick}>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
          {name}
        </h3>
        
        {farmerName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {farmerName}
          </p>
        )}
        
        {location && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </p>
        )}
        
        {rating !== undefined && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(rating) ? 'fill-current' : 'text-gray-200 dark:text-gray-700'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {rating.toFixed(1)}
            </span>
            {reviewsCount !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({reviewsCount})
              </span>
            )}
          </div>
        )}
        
        {/* Price and Action */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-green-100/50 dark:border-gray-700/50">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Price</span>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ₹{price.toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">/{unit}</span>
          </div>
          
          {onAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function SkeletonCard() {
  return (
    <Card variant="nature" rounded="2xl" className="h-full">
      <div className="aspect-square mb-5 rounded-2xl bg-gradient-to-br from-green-100/50 to-emerald-100/50 dark:from-gray-700/50 dark:to-gray-600/50 animate-pulse shimmer" />
      <div className="space-y-3">
        <div className="h-6 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse w-3/4" />
        <div className="h-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg animate-pulse w-1/2" />
        <div className="flex justify-between items-center pt-3 border-t border-green-100/30">
          <div className="h-8 bg-gradient-to-r from-green-200/50 to-emerald-200/50 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse w-1/3" />
          <div className="h-10 w-24 bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
