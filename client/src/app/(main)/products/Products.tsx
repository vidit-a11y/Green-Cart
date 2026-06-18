import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ProductCard, SkeletonCard } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Input, Select } from '../../../components/ui/Input';
import { useCart } from '../../../features/cart/context/CartContext';
import { useToast } from '../../../utils/ToastContext';
import { productService } from '../../../features/products/services/productService';
import { locationService, type NearbyFarmerResult } from '../../../features/products/services/locationService';
import { useCustomerLocation } from '../../../hooks/useCustomerLocation';
import type { Product, ProductFilters } from '../../../types';

// ─── Delivery badge helper ────────────────────────────────────────────────────

function DeliveryBadge({ distanceKm, deliveryFee }: { distanceKm: number; deliveryFee: number }) {
  const isFree = deliveryFee === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isFree ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
      }`}
    >
      📍 {distanceKm.toFixed(1)} km •{' '}
      <span className={isFree ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
        {isFree ? 'FREE delivery' : '₹50 delivery'}
      </span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Products() {
  const { t } = useTranslation();

  const sortOptions = [
    { value: 'newest', label: t('products.sortNewest') },
    { value: 'price-asc', label: t('products.sortPriceLow') },
    { value: 'price-desc', label: t('products.sortPriceHigh') },
    { value: 'name', label: t('products.sortNameAZ') },
  ];

  const categories = [
    t('products.all'),
    t('products.vegetables'),
    t('products.fruits'),
    t('products.dairy'),
    t('products.grains'),
    t('products.spices'),
    t('products.dryFruits'),
    t('products.honey'),
    t('products.herbs'),
  ];

  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { addItem } = useCart();

  // ── Location & nearby-farmer state ──────────────────────────────────────────
  const { coords, error: locationError, loading: locationLoading, captureLocation } =
    useCustomerLocation();
  const [nearbyResult, setNearbyResult] = useState<NearbyFarmerResult | null>(null);
  const [nearbyFarmerIds, setNearbyFarmerIds] = useState<Set<string>>(new Set());
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // When we get the customer's coords, look up nearby farmers
  useEffect(() => {
    if (!coords) return;
    setNearbyLoading(true);
    locationService
      .getFarmersNear(coords.lat, coords.lng)
      .then((result) => {
        setNearbyResult(result);
        if (result) {
          setNearbyFarmerIds(new Set(result.farmers.map((f) => f._id)));
        } else {
          setNearbyFarmerIds(new Set());
        }
      })
      .catch(() => {
        // Non-fatal — products still show, just without delivery info
      })
      .finally(() => setNearbyLoading(false));
  }, [coords]);

  // ── Products state ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productService.getAll(filters, currentPage, 12);
      setProducts(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error(error);
      showToast(t('common.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, showToast, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setFilters((prev) => ({ ...prev, search: search || undefined }));
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (search) newParams.set('search', search);
    else newParams.delete('search');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (category: string) => {
    const allLabel = t('products.all');
    const newCategory = category === allLabel ? undefined : category;
    setFilters((prev) => ({ ...prev, category: newCategory }));
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newCategory) newParams.set('category', newCategory);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleSortChange = (value: string) => {
    let sortBy: ProductFilters['sortBy'] = 'date';
    let sortOrder: 'asc' | 'desc' = 'desc';
    switch (value) {
      case 'newest':   sortBy = 'date';  sortOrder = 'desc'; break;
      case 'price-asc': sortBy = 'price'; sortOrder = 'asc';  break;
      case 'price-desc': sortBy = 'price'; sortOrder = 'desc'; break;
      case 'name':     sortBy = 'name';  sortOrder = 'asc';  break;
      default:         sortBy = 'date';  sortOrder = 'desc';
    }
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    showToast(`${product.name} added to cart`, 'success');
  };

  const handlePriceFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const minPrice = formData.get('minPrice') as string;
    const maxPrice = formData.get('maxPrice') as string;
    setFilters((prev) => ({
      ...prev,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    }));
    setCurrentPage(1);
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  /** Sorted products: nearby farmer products float to the top */
  const sortedProducts = nearbyFarmerIds.size > 0
    ? [
        ...products.filter((p) => nearbyFarmerIds.has(p.farmerId ?? '')),
        ...products.filter((p) => !nearbyFarmerIds.has(p.farmerId ?? '')),
      ]
    : products;

  const rangeExpanded = nearbyResult !== null && nearbyResult.radiusUsed > 7.5;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Location permission banner ─────────────────────────────────── */}
        {!locationLoading && locationError && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl
            bg-blue-50 dark:bg-blue-900/20
            border border-blue-200 dark:border-blue-700
            text-sm text-blue-800 dark:text-blue-200">
            <span className="text-base shrink-0 mt-0.5">📍</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                Allow location access to see nearby farmers and delivery estimates
              </p>
              <p className="text-blue-600 dark:text-blue-400 mt-0.5 text-xs">{locationError}</p>
            </div>
            <button
              id="retry-location-btn"
              onClick={captureLocation}
              className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-300
                hover:text-blue-900 dark:hover:text-blue-100 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Range expansion warning ────────────────────────────────────── */}
        {!nearbyLoading && rangeExpanded && (
          <div className="mb-5 px-4 py-3 rounded-xl
            bg-yellow-50 dark:bg-yellow-900/20
            border border-yellow-200 dark:border-yellow-700
            text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ No farmers within 7.5 km. Showing results within{' '}
            <strong>{nearbyResult!.radiusUsed} km</strong>.{' '}
            ₹50 delivery charge applies.
          </div>
        )}

        {/* ── No farmers at all ─────────────────────────────────────────── */}
        {!nearbyLoading && coords && nearbyResult === null && (
          <div className="mb-5 px-4 py-3 rounded-xl
            bg-orange-50 dark:bg-orange-900/20
            border border-orange-200 dark:border-orange-700
            text-sm text-orange-800 dark:text-orange-200">
            😔 No GreenCart farmers found within 50 km of your location.
            Products shown are from all regions — delivery may not be available.
          </div>
        )}

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('products.freshTitle')}
            </h1>
            {/* Location status pill */}
            {coords && !nearbyLoading && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-green-100 dark:bg-green-900/30
                border border-green-200 dark:border-green-700
                text-xs font-medium text-green-700 dark:text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Location active
              </span>
            )}
            {locationLoading && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Detecting location…
              </span>
            )}
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search}
                  placeholder={t('products.search')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            <div className="flex gap-2 shrink-0">
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                options={sortOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                className="w-36 sm:w-40"
              />
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 min-h-[40px] px-3 sm:px-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">{t('products.filter')}</span>
              </Button>
            </div>
          </div>

          {/* Category Pills — horizontal scroll on mobile */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors min-h-[36px] ${
                  (category === t('products.all') && !filters.category) || filters.category === category
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <form onSubmit={handlePriceFilter} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-end gap-3">
                <Input
                  label={t('products.minPrice')}
                  type="number"
                  name="minPrice"
                  defaultValue={filters.minPrice}
                  placeholder="0"
                  className="w-full sm:w-32"
                />
                <Input
                  label={t('products.maxPrice')}
                  type="number"
                  name="maxPrice"
                  defaultValue={filters.maxPrice}
                  placeholder="1000"
                  className="w-full sm:w-32"
                />
                <div className="flex gap-2">
                  <Button type="submit">{t('products.apply')}</Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined }));
                      setCurrentPage(1);
                    }}
                  >
                    {t('products.clear')}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

          {/* Products Grid — 1 col mobile, 2 col sm, 3 col lg, 4 col xl */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {sortedProducts.map((product) => {
                // Build a delivery badge for this card if we have location data
                const isNearby = nearbyFarmerIds.has(product.farmerId ?? '');
                const badge =
                  nearbyResult && isNearby ? (
                    <DeliveryBadge
                      distanceKm={nearbyResult.distanceKm}
                      deliveryFee={nearbyResult.deliveryFee}
                    />
                  ) : null;

                return (
                  <ProductCard
                    key={product.id}
                    {...product}
                    deliveryBadge={badge}
                    onClick={() => (window.location.href = `/products/${product.id}`)}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                );
              })}
              </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('products.previous')}
                </Button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {t('products.page', { current: currentPage, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('products.next')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={t('products.noProducts')}
            description={t('products.noProductsDesc')}
            action={{
              label: t('products.clearFilters'),
              onClick: () => {
                setFilters({});
                setSearchParams(new URLSearchParams());
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
