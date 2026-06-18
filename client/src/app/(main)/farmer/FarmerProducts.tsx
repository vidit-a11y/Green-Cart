import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Input, Select } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useToast } from '../../../utils/ToastContext';
import { productService } from '../../../features/products/services/productService';
import type { Product, ProductFormData } from '../../../types';

const categories = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains & Pulses',
  'Spices',
  'Dry Fruits',
  'Organic Honey',
  'Fresh Herbs',
  'Pickles & Preserves',
  'Cold Pressed Oils',
  'Other',
];

const units = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'piece', label: 'Piece (pc)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'tin', label: 'Tin' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'jar', label: 'Jar' },
  { value: '250g', label: '250 Gram' },
  { value: '500g', label: '500 Gram' },
  { value: 'litre', label: 'Litre' },
  { value: 'ml', label: 'Millilitre (ml)' },
];

type ProductSubmitData = Omit<ProductFormData, 'location'> & { imageFile?: File | null };

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductSubmitData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    quantity: product?.quantity || 0,
    category: product?.category || categories[0],
    unit: product?.unit || 'kg',
    location: '', // Keep for type compatibility but not used in form
    isAvailable: product?.isAvailable ?? true,
    images: product?.images || (product?.imageUrl ? [product.imageUrl] : []),
    imageUrl: product?.imageUrl,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(product?.imageUrl || product?.images?.[0] || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('farmer.products.form.nameRequired');
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.price <= 0) newErrors.price = t('farmer.products.form.priceRequired');
    if (formData.quantity < 0) newErrors.quantity = t('farmer.products.form.quantityRequired');
    // Removed location validation - farmer location is from profile
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ ...formData, imageFile });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setImageFile(selectedFile);

    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t('farmer.products.form.productName')}
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Select
          label={t('farmer.products.form.category')}
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categories.map((c) => ({ value: c, label: c }))}
          required
        />
        <Input
          label={t('farmer.products.form.price')}
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={handleChange}
          error={errors.price}
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label={t('farmer.products.form.quantity')}
          name="quantity"
          type="number"
          min="0"
          value={formData.quantity}
          onChange={handleChange}
          error={errors.quantity}
          required
        />
        <Select
          label={t('farmer.products.form.unit')}
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          options={units}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('farmer.products.form.description')}
        </label>
        <textarea
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          placeholder={t('farmer.products.form.descriptionPlaceholder')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isAvailable"
          checked={formData.isAvailable}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <span className="text-gray-700 dark:text-gray-300">{t('farmer.products.form.available')}</span>
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('farmer.products.form.uploadImage')}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-white hover:file:bg-green-700"
        />

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-32 h-32 min-w-[100px] min-h-[100px] object-cover rounded-lg mt-2 border border-gray-200 dark:border-gray-700"
          />
        )}
      </div>
      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading}>
          {product ? t('farmer.products.form.updateBtn') : t('farmer.products.form.addBtn')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('farmer.products.form.cancel')}
        </Button>
      </div>
    </form>
  );
}

export function FarmerProducts() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await productService.getByFarmer(user.id);
      setProducts(data);
    } catch (error) {
      showToast(t('common.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCaptureFarmLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser', 'error');
      return;
    }

    setIsUpdatingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updateUser({
            location: {
              type: 'Point',
              coordinates: [
                position.coords.longitude,
                position.coords.latitude,
              ],
            },
          });
          showToast('Farm location updated successfully', 'success');
          fetchProducts();
        } catch (error) {
          showToast('Failed to save farm location', 'error');
        } finally {
          setIsUpdatingLocation(false);
        }
      },
      () => {
        showToast('Please allow location access to enable nearby delivery', 'error');
        setIsUpdatingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const toProductFormData = (
    data: ProductSubmitData,
    userData: { id: string; name: string },
  ) => {
    const payload = new FormData();
    payload.append('name', data.name);
    payload.append('description', data.description);
    payload.append('price', String(data.price));
    payload.append('quantity', String(data.quantity));
    payload.append('category', data.category);
    payload.append('unit', data.unit);
    payload.append('location', userData.name); // Use farmer name as location string
    payload.append('isAvailable', String(data.isAvailable));
    payload.append('farmerId', userData.id);
    payload.append('farmerName', userData.name);

    if (data.imageFile) {
      payload.append('image', data.imageFile);
    }

    return payload;
  };

  const handleCreate = async (data: ProductSubmitData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await productService.create(toProductFormData(data, user));
      showToast('Product added successfully', 'success');
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      showToast('Failed to add product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: ProductSubmitData) => {
    if (!editingProduct || !user) return;
    setIsSubmitting(true);
    try {
      await productService.update(editingProduct.id, toProductFormData(data, user));
      showToast('Product updated successfully', 'success');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      showToast('Failed to update product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('farmer.products.deleteConfirm'))) return;
    try {
      await productService.delete(id);
      showToast('Product deleted successfully', 'success');
      fetchProducts();
    } catch (error) {
      showToast('Failed to delete product', 'error');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading products..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('farmer.products.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('farmer.products.subtitle')}</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('farmer.products.addNew')}
          </Button>
        </div>

        {!user?.location && (
          <Card padding="md" className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Enable your farm GPS location
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Nearby customer delivery works only after we save your current farm coordinates.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCaptureFarmLocation}
                isLoading={isUpdatingLocation}
              >
                Use Current Location
              </Button>
            </div>
          </Card>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingProduct) && (
          <Card padding="lg" className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingProduct ? t('farmer.products.form.editTitle') : t('farmer.products.form.addTitle')}
            </h2>
            <ProductForm
              product={editingProduct || undefined}
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowAddForm(false);
                setEditingProduct(null);
              }}
              isLoading={isSubmitting}
            />
          </Card>
        )}

        {/* Products List */}
        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product._id ?? product.id} padding="md">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.imageUrl || product.images?.[0] ? (
                      <img
                        src={product.imageUrl || product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🥬</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      ₹{product.price.toLocaleString('en-IN')}/{product.unit}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.quantity} in stock • {product.category}
                    </p>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                      product.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {product.isAvailable ? t('farmer.products.active') : t('farmer.products.inactive')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('farmer.products.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    {t('farmer.products.delete')}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('farmer.products.noProducts')}
            description={t('farmer.products.noProductsDesc')}
            action={{
              label: t('farmer.products.addProductBtn'),
              onClick: () => setShowAddForm(true),
            }}
          />
        )}
      </div>
    </div>
  );
}


