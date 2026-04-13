import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ProductCard } from '../components/Card';
import { FeatureCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';

const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'Fresh Alphonso Mangoes',
    description: 'Premium Ratnagiri Alphonso mangoes, naturally ripened',
    price: 450,
    quantity: 50,
    category: 'Fruits',
    unit: 'dozen',
    images: [],
    farmerId: 'f1',
    farmerName: 'Patil Farms',
    location: 'Ratnagiri, Maharashtra',
    isAvailable: true,
    rating: 4.9,
    reviewsCount: 156,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Organic Palak (Spinach)',
    description: 'Fresh organic spinach, pesticide-free',
    price: 40,
    quantity: 100,
    category: 'Vegetables',
    unit: 'bunch',
    images: [],
    farmerId: 'f2',
    farmerName: 'Krishna Organic Farms',
    location: 'Bangalore, Karnataka',
    isAvailable: true,
    rating: 4.7,
    reviewsCount: 89,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    name: 'Fresh Paneer',
    description: 'Farm-fresh homemade paneer, no preservatives',
    price: 280,
    quantity: 40,
    category: 'Dairy',
    unit: 'kg',
    images: [],
    farmerId: 'f3',
    farmerName: 'Dairy Fresh Co-operative',
    location: 'Indore, Madhya Pradesh',
    isAvailable: true,
    rating: 4.8,
    reviewsCount: 124,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '4',
    name: 'Desi Tomatoes',
    description: 'Farm-grown desi tomatoes, naturally ripened',
    price: 60,
    quantity: 150,
    category: 'Vegetables',
    unit: 'kg',
    images: [],
    farmerId: 'f4',
    farmerName: 'Sharma Vegetable Farms',
    location: 'Nashik, Maharashtra',
    isAvailable: true,
    rating: 4.5,
    reviewsCount: 78,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const categories = [
  { name: 'Vegetables', icon: '🥬', count: 85, color: 'from-green-500 to-emerald-600' },
  { name: 'Fruits', icon: '🥭', count: 52, color: 'from-amber-500 to-orange-600' },
  { name: 'Dairy', icon: '🥛', count: 28, color: 'from-blue-500 to-cyan-600' },
  { name: 'Grains', icon: '🌾', count: 35, color: 'from-yellow-500 to-amber-600' },
  { name: 'Spices', icon: '🌶️', count: 42, color: 'from-red-500 to-rose-600' },
  { name: 'Dry Fruits', icon: '🥜', count: 24, color: 'from-amber-600 to-yellow-700' },
  { name: 'Honey', icon: '🍯', count: 15, color: 'from-yellow-400 to-amber-500' },
  { name: 'Herbs', icon: '🌿', count: 18, color: 'from-emerald-500 to-green-600' },
];

const features = [
  {
    title: 'Fresh & Local',
    description: 'Get farm-fresh produce delivered straight from local farmers to your doorstep.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Support Farmers',
    description: 'Every purchase directly supports local farming communities and sustainable agriculture.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Quality Assured',
    description: 'We ensure the highest quality standards with every product on our platform.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, hasRole } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Nature Inspired Split Layout */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with nature gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#4CAF50]" />
        
        {/* Organic blob decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl organic-blob" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl organic-blob animate-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-green-300/15 rounded-full blur-2xl animate-float" />
        
        {/* Leaf pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="leaf-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#leaf-pattern)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="animate-fade-in-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {t('app.tagline')}
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight text-shadow-lg">
                {t('home.hero.title')}
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-green-100/90 mb-10 max-w-xl leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="animate-fade-in-up stagger-1">
                  <Button 
                    size="lg" 
                    variant="gradient" 
                    rounded="xl"
                    className="bg-white text-green-700 hover:bg-gray-100 shadow-2xl shadow-black/20"
                  >
                    {t('home.hero.shopNow')}
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/register" className="animate-fade-in-up stagger-2">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      rounded="xl"
                      className="border-2 border-white/50 text-white hover:bg-white/10 hover:border-white"
                    >
                      {t('home.hero.joinAsFarmer')}
                    </Button>
                  </Link>
                )}
                {isAuthenticated && hasRole(['farmer']) && (
                  <Link to="/farmer" className="animate-fade-in-up stagger-2">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      rounded="xl"
                      className="border-2 border-white/50 text-white hover:bg-white/10"
                    >
                      {t('nav.farmerDashboard')}
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-8 mt-12 animate-fade-in-up stagger-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-white font-semibold">10,000+ Happy Customers</p>
                  <p className="text-green-200 text-sm">Across India</p>
                </div>
              </div>
            </div>
            
            {/* Right Visual - Decorative Grid */}
            <div className="hidden lg:block relative animate-slide-in-right">
              {/* Main visual grid */}
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-3xl blur-3xl" />
                
                {/* Card grid */}
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="space-y-4 mt-8">
                    <div className="glass bg-white/10 backdrop-blur-lg rounded-3xl p-6 aspect-square flex items-center justify-center hover:scale-105 transition-transform duration-500 cursor-pointer group">
                      <span className="text-7xl group-hover:scale-110 transition-transform duration-300">🥭</span>
                    </div>
                    <div className="glass bg-white/10 backdrop-blur-lg rounded-3xl p-6 aspect-square flex items-center justify-center hover:scale-105 transition-transform duration-500 cursor-pointer group">
                      <span className="text-7xl group-hover:scale-110 transition-transform duration-300">🍅</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="glass bg-white/10 backdrop-blur-lg rounded-3xl p-6 aspect-square flex items-center justify-center hover:scale-105 transition-transform duration-500 cursor-pointer group">
                      <span className="text-7xl group-hover:scale-110 transition-transform duration-300">🥬</span>
                    </div>
                    <div className="glass bg-white/10 backdrop-blur-lg rounded-3xl p-6 aspect-square flex items-center justify-center hover:scale-105 transition-transform duration-500 cursor-pointer group">
                      <span className="text-7xl group-hover:scale-110 transition-transform duration-300">🧅</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 glass bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">100% Organic</p>
                      <p className="text-sm text-gray-600">Certified Products</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F8FAF5"/>
          </svg>
        </div>
      </section>

      {/* Features Section - Glassmorphism Cards */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 nature-bg" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-bl from-green-200/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-72 h-72 bg-gradient-to-tr from-emerald-200/30 to-transparent rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
              Why Choose Us
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.15}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section - Nature Cards */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
              Explore Categories
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              {t('home.categories.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.categories.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category, index) => (
              <Link
                key={category.name}
                to={`/products?category=${category.name}`}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative bg-white rounded-3xl p-5 text-center shadow-lg shadow-green-900/5 border border-green-100/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-900/10 hover:-translate-y-2 group-hover:border-green-200 overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-green-700 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {category.count} items
                    </p>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${category.color} rounded-full group-hover:w-1/2 transition-all duration-500`} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 nature-bg" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div className="animate-fade-in-up">
              <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
                Trending Now
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
                {t('home.featured.title')}
              </h2>
              <p className="text-xl text-gray-600">
                {t('home.featured.subtitle')}
              </p>
            </div>
            <Link
              to="/products"
              className="group flex items-center gap-2 text-green-700 font-semibold hover:text-green-800 transition-colors animate-fade-in-up stagger-1"
            >
              {t('home.featured.viewAll')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProductCard
                  {...product}
                  onClick={() => window.location.href = `/products/${product.id}`}
                  onAddToCart={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Earth Tones */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#8D6E63]" />
        
        {/* Organic blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6 border border-white/20">
              Join The Movement
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Start Your<br />
              <span className="text-green-200">Healthy Journey?</span>
            </h2>
            <p className="text-xl text-green-100/90 mb-10 max-w-2xl mx-auto">
              Join thousands of happy customers enjoying fresh, local produce delivered to their door. Support Indian farmers while eating healthy!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/products">
                <Button 
                  size="lg" 
                  variant="gradient"
                  rounded="xl"
                  className="bg-white text-green-700 hover:bg-gray-100"
                >
                  Start Shopping
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link to="/register">
                <Button 
                  size="lg" 
                  variant="outline"
                  rounded="xl"
                  className="border-2 border-white/50 text-white hover:bg-white/10"
                >
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in-up stagger-1">
            {[
              { value: '10K+', label: 'Active Customers' },
              { value: '500+', label: 'Local Farmers' },
              { value: '50K+', label: 'Orders Delivered' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-green-200/80 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
