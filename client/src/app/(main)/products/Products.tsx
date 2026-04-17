import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ProductCard, SkeletonCard } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Input, Select } from '../../../components/ui/Input';
import { useCart } from '../../../features/cart/context/CartContext';
import { useToast } from '../../../utils/ToastContext';
import { productService } from '../../../features/products/services/productService';
import type { Product, ProductFilters } from '../../../types';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

const categories = [
  'All',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains & Pulses',
  'Spices',
  'Dry Fruits',
  'Organic Honey',
  'Fresh Herbs',
];

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { addItem } = useCart();

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
      showToast('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    const newCategory = category === 'All' ? undefined : category;
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
      case 'price-asc':
        sortBy = 'price';
        sortOrder = 'asc';
        break;
      case 'price-desc':
        sortBy = 'price';
        sortOrder = 'desc';
        break;
      case 'name':
        sortBy = 'name';
        sortOrder = 'asc';
        break;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Fresh Products
          </h1>
          
          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={filters.search}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
            
            <div className="flex gap-3">
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                options={sortOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                className="w-40"
              />
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (category === 'All' && !filters.category) || filters.category === category
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
              <div className="flex items-end gap-4">
                <Input
                  label="Min Price"
                  type="number"
                  name="minPrice"
                  defaultValue={filters.minPrice}
                  placeholder="0"
                  className="w-32"
                />
                <Input
                  label="Max Price"
                  type="number"
                  name="maxPrice"
                  defaultValue={filters.maxPrice}
                  placeholder="1000"
                  className="w-32"
                />
                <Button type="submit">Apply</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined }));
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => window.location.href = `/products/${product.id}`}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No products found"
            description="Try adjusting your filters or search for something else"
            action={{
              label: "Clear Filters",
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
