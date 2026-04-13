import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'nature' | 'earth';
  hover?: boolean;
  animate?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'none';
  delay?: number;
}

export function GlassCard({
  children,
  className = '',
  variant = 'light',
  hover = true,
  animate = 'none',
  delay = 0,
}: GlassCardProps) {
  const baseStyles = 'rounded-2xl backdrop-blur-md border transition-all duration-500';
  
  const variants = {
    light: 'bg-white/70 border-white/40 shadow-xl shadow-green-900/5',
    dark: 'bg-green-900/40 border-green-500/20 shadow-xl shadow-black/20',
    nature: 'bg-gradient-to-br from-white/80 to-green-50/60 border-green-200/50 shadow-xl shadow-green-900/10',
    earth: 'bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-amber-200/50 shadow-xl shadow-amber-900/10',
  };

  const hoverStyles = hover
    ? 'hover:translate-y-[-8px] hover:shadow-2xl hover:shadow-green-900/15 hover:border-green-300/50'
    : '';

  const animationStyles = {
    'fade-up': 'animate-fade-in-up',
    'fade-in': 'animate-fade-in',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    'none': '',
  };

  const delayStyle = delay > 0 ? { animationDelay: `${delay}s`, opacity: animate !== 'none' ? 0 : 1 } : {};

  const classes = [
    baseStyles,
    variants[variant],
    hoverStyles,
    animationStyles[animate],
    className,
  ].join(' ');

  return (
    <div className={classes} style={delayStyle}>
      {/* Inner shine effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  variant?: 'light' | 'dark';
  delay?: number;
}

export function FeatureCard({
  icon,
  title,
  description,
  variant = 'light',
  delay = 0,
}: FeatureCardProps) {
  return (
    <GlassCard
      variant={variant}
      hover={true}
      animate="fade-up"
      delay={delay}
      className="p-6 text-center group relative overflow-hidden"
    >
      {/* Icon Container */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white shadow-lg shadow-green-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
        {icon}
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        {description}
      </p>
      
      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full group-hover:w-1/2 transition-all duration-500" />
    </GlassCard>
  );
}

// Stat Card Component
interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  trend?: string;
  variant?: 'green' | 'earth' | 'blue';
}

export function StatCard({
  value,
  label,
  icon,
  trend,
  variant = 'green',
}: StatCardProps) {
  const gradients = {
    green: 'from-green-500 to-emerald-600',
    earth: 'from-amber-500 to-orange-600',
    blue: 'from-blue-500 to-cyan-600',
  };

  return (
    <GlassCard
      variant="light"
      hover={true}
      className="p-5 relative overflow-hidden"
    >
      {/* Background gradient blob */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradients[variant]} opacity-10 blur-2xl`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          {icon && (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[variant]} flex items-center justify-center text-white shadow-lg`}>
              {icon}
            </div>
          )}
          {trend && (
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        
        <div className="text-3xl font-bold text-gray-800 mb-1">
          {value}
        </div>
        <div className="text-sm text-gray-600">
          {label}
        </div>
      </div>
    </GlassCard>
  );
}
