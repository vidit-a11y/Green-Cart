import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gradient' | 'earth';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  glow?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  fullWidth = false,
  rounded = 'xl',
  glow = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden group active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-green-700 to-green-600 text-white hover:from-green-800 hover:to-green-700 focus:ring-green-500 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40',
    gradient: 'bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white hover:from-green-800 hover:via-green-700 hover:to-emerald-600 focus:ring-green-500 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:transition-transform before:duration-500 hover:before:translate-x-full',
    earth: 'bg-gradient-to-r from-amber-700 to-amber-600 text-white hover:from-amber-800 hover:to-amber-700 focus:ring-amber-500 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:transition-transform before:duration-500 hover:before:translate-x-full',
    secondary: 'bg-gradient-to-r from-green-100 to-emerald-50 text-green-800 hover:from-green-200 hover:to-emerald-100 focus:ring-green-400 border border-green-200',
    outline: 'border-2 border-green-600 text-green-700 hover:bg-gradient-to-r hover:from-green-600 hover:to-green-500 hover:text-white hover:border-transparent focus:ring-green-500 bg-transparent',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 focus:ring-red-500 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40',
    ghost: 'text-gray-700 hover:bg-green-50 hover:text-green-700 focus:ring-green-400',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  const roundedStyles = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  };

  const glowStyles = glow && (variant === 'primary' || variant === 'gradient')
    ? 'animate-pulse-glow'
    : '';

  const classes = [
    baseStyles,
    variants[variant],
    sizes[size],
    roundedStyles[rounded],
    fullWidth ? 'w-full' : '',
    glowStyles,
    (disabled || isLoading) ? 'opacity-60 cursor-not-allowed before:hidden' : '',
    className,
  ].join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Ripple Effect Background */}
      <span className="absolute inset-0 overflow-hidden rounded-inherit">
        <span className="absolute inset-0 bg-white/20 scale-0 group-active:scale-150 group-active:opacity-0 transition-all duration-500 rounded-full" 
              style={{ transformOrigin: 'center' }}></span>
      </span>
      
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
