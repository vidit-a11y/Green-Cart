import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input, Select } from '../../../components/ui/Input';
import { DeliveryMap } from '../../../components/shared/DeliveryMap';
import { AddressModal } from '../../../components/shared/AddressModal';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useCart } from '../../../features/cart/context/CartContext';
import { orderService } from '../../../features/cart/services/orderService';
import type { DeliveryQuote, GeoPoint, SavedAddress } from '../../../types';
import { useToast } from '../../../utils/ToastContext';
import { mapplsService } from '../../../utils/mappls';

const MIN_ORDER_VALUE = 199;

export function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const paymentMethods = [
    { value: 'card', label: t('checkout.card') },
    { value: 'cod', label: t('checkout.cod') },
    { value: 'upi', label: t('checkout.upi') },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<GeoPoint | null>(null);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [locationError, setLocationError] = useState('');
  const [deliveryError, setDeliveryError] = useState('');
  
  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'card',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const itemPayload = useMemo(
    () =>
      items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    [items]
  );

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  // Load saved addresses on mount
  useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (data.success) {
          const addresses = data.data || [];
          setSavedAddresses(addresses);

          // Auto-select default address or first one
          const defaultAddr = addresses.find((a: SavedAddress) => a.isDefault) || addresses[0];
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
            setCustomerLocation({
              type: 'Point',
              coordinates: defaultAddr.coordinates,
            });
            
            // Set form data from selected address
            setFormData((prev) => ({
              ...prev,
              address: defaultAddr.addressLine,
              city: defaultAddr.city,
              state: defaultAddr.state,
              zipCode: defaultAddr.pincode,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
      }
    };

    loadSavedAddresses();
  }, []);

  // Fetch delivery quote when customer location changes
  useEffect(() => {
    if (customerLocation?.coordinates && customerLocation.coordinates.length === 2) {
      void checkDelivery(customerLocation);
    }
  }, [customerLocation]);

  const checkDelivery = async (location: GeoPoint) => {
    if (!location?.coordinates || location.coordinates.length !== 2) {
      setDeliveryError('Invalid location coordinates');
      return;
    }

    setIsCheckingDelivery(true);
    setDeliveryError('');
    try {
      const quote = await orderService.getDeliveryQuote({
        items: itemPayload,
        customerLocation: location,
      });

      // Override distance with Mappls distance matrix API
      const distanceMatrix = await mapplsService.getDistance(
        location.coordinates,
        quote.farmerCoordinates
      );

      if (distanceMatrix && distanceMatrix.distance) {
        const distanceKm = distanceMatrix.distance / 1000;
        const deliveryFee = distanceKm <= 7.5 ? 0 : 50; // simple fallback calc based on business rules
        setDeliveryQuote({
          ...quote,
          distanceKm,
          deliveryFee
        });
      } else {
        setDeliveryQuote(quote);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate delivery';
      setDeliveryQuote(null);
      setDeliveryError(message);
    } finally {
      setIsCheckingDelivery(false);
    }
  };

  const captureLocationAndQuote = () => {
    setIsFetchingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser');
      setIsFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: GeoPoint = {
          type: 'Point',
          coordinates: [position.coords.longitude, position.coords.latitude],
        };
        setCustomerLocation(location);

        // Reverse Geocode
        const addr = await mapplsService.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        if (addr) {
          setFormData(prev => ({
            ...prev,
            address: addr.formatted_address || addr.houseName || '',
            city: addr.city || addr.district || '',
            state: addr.state || '',
            zipCode: addr.pincode || '',
          }));
        }

        // Only call checkDelivery after location is set
        await checkDelivery(location);
        setIsFetchingLocation(false);
      },
      () => {
        setLocationError('Please allow location access to continue with delivery');
        setDeliveryQuote(null);
        setIsFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (totalPrice < MIN_ORDER_VALUE) {
      newErrors.order = `Minimum order value is Rs. ${MIN_ORDER_VALUE}`;
    }
    if (!formData.fullName.trim()) newErrors.fullName = `${t('checkout.fullName')} is required`;
    if (!formData.phone.trim()) newErrors.phone = `${t('checkout.phone')} is required`;
    if (!formData.address.trim()) newErrors.address = `${t('checkout.address')} is required`;
    if (!formData.city.trim()) newErrors.city = `${t('checkout.city')} is required`;
    if (!formData.state.trim()) newErrors.state = `${t('checkout.state')} is required`;
    if (!formData.zipCode.trim()) newErrors.zipCode = `${t('checkout.zipCode')} is required`;
    if (!customerLocation) newErrors.location = 'Current location is required for delivery';
    if (!deliveryQuote) newErrors.delivery = deliveryError || 'Delivery quote is not available yet';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSelect = (address: SavedAddress) => {
    setSelectedAddress(address);
    setCustomerLocation({
      type: 'Point',
      coordinates: address.coordinates,
    });
    setFormData((prev) => ({
      ...prev,
      address: address.addressLine,
      city: address.city,
      state: address.state,
      zipCode: address.pincode,
    }));
  };

  const handleAddNewAddress = async (newAddr: Omit<SavedAddress, '_id'>) => {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/addresses`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddr),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save address');
    const saved: SavedAddress = data.data;
    setSavedAddresses((prev) => [...prev, saved]);
    handleAddressSelect(saved);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !customerLocation || !deliveryQuote) {
      return;
    }

    setIsLoading(true);
    try {
      const deliveryAddress = `${formData.fullName}\n${formData.address}\n${formData.city}, ${formData.state} ${formData.zipCode}\nPhone: ${formData.phone}`;

      await orderService.create({
        items: itemPayload,
        deliveryAddress,
        paymentMethod: formData.paymentMethod,
        customerLocation,
      });

      showToast(t('checkout.orderSuccess') || 'Order placed successfully!', 'success');
      clearCart();
      navigate('/');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('checkout.orderFailed'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  const deliveryFee = deliveryQuote?.deliveryFee ?? 0;
  const finalTotal = deliveryQuote?.totalAmount ?? totalPrice;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          {t('checkout.title')}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <Card padding="lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('checkout.deliveryInfo')}
                </h2>

                {/* Mappls Autosuggest UI */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Address
                  </label>
                  <input
                    type="text"
                    id="mappls-search"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Search for an area, landmark or street..."
                  />
                  <p className="mt-1 text-xs text-gray-500">Powered by MapMyIndia (Mappls)</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label={t('checkout.fullName')}
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    required
                  />
                  <Input
                    label={t('checkout.phone')}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    required
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label={t('checkout.address')}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <Input
                    label={t('checkout.city')}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required
                  />
                  <Input
                    label={t('checkout.state')}
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    required
                  />
                  <Input
                    label={t('checkout.zipCode')}
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    error={errors.zipCode}
                    required
                  />
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Delivery Lookup
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      We use your current GPS location to find the farmer and calculate delivery.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void captureLocationAndQuote()}
                    isLoading={isFetchingLocation || isCheckingDelivery}
                  >
                    Refresh Location
                  </Button>
                </div>

                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                  {deliveryQuote ? (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Delivering from {deliveryQuote.farmerLocation}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {deliveryQuote.distanceKm} km away • Delivery:{' '}
                        {deliveryQuote.deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryQuote.deliveryFee}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Farmer: {deliveryQuote.farmerName}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {isFetchingLocation || isCheckingDelivery
                          ? 'Checking nearby farmer availability...'
                          : 'Waiting for your current location to calculate delivery.'}
                      </p>
                      {(locationError || deliveryError || errors.location || errors.delivery) && (
                        <p className="text-sm text-red-600 dark:text-red-300">
                          {locationError || deliveryError || errors.location || errors.delivery}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ─── Delivery Map ─── */}
                {deliveryQuote && customerLocation && (
                  <div className="mt-4">
                    <DeliveryMap
                      customerCoords={customerLocation.coordinates}
                      farmerCoords={deliveryQuote.farmerCoordinates}
                      distanceKm={deliveryQuote.distanceKm}
                      farmerLabel={deliveryQuote.farmerLocation}
                      customerLabel="Your delivery location"
                      height="280px"
                    />
                    <p className="mt-2 text-xs text-center text-gray-400 dark:text-gray-500">
                      Map data © MapMyIndia (Mappls)
                    </p>
                    
                    {/* Architecture for Future Delivery Partner Tracking */}
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Tracking Architecture Ready</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                        When enabled, a delivery partner's live coordinates can be streamed here via WebSocket and rendered in real-time onto this Mappls map instance.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                  Minimum order value: Rs. {MIN_ORDER_VALUE}
                </div>
                {errors.order && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-300">{errors.order}</p>
                )}
              </Card>

              <Card padding="lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('checkout.payment')}
                </h2>
                <Select
                  label={t('checkout.payment')}
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  options={paymentMethods}
                  required
                />

                {formData.paymentMethod === 'card' && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Card payment integration would be implemented here with a secure payment gateway like Stripe.
                    </p>
                  </div>
                )}

                {formData.paymentMethod === 'cod' && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      You will pay Rs. {finalTotal.toLocaleString('en-IN')} when your order is delivered.
                    </p>
                  </div>
                )}
              </Card>

              <div className="lg:hidden">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  disabled={
                    isFetchingLocation ||
                    isCheckingDelivery ||
                    totalPrice < MIN_ORDER_VALUE ||
                    !deliveryQuote
                  }
                >
                  Place Order - Rs. {finalTotal.toLocaleString('en-IN')}
                </Button>
              </div>
            </form>
          </div>

          <div className="w-full lg:w-1/3">
            <Card padding="lg" className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('checkout.orderSummary')}
              </h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.product.name}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {item.quantity} × Rs. {item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Rs. {(item.quantity * item.product.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.subtotal', { count: items.length })}</span>
                  <span>Rs. {totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.deliveryFee')}</span>
                  <span>
                    {deliveryQuote
                      ? deliveryFee === 0
                        ? t('cart.free')
                        : `Rs. ${deliveryFee.toLocaleString('en-IN')}`
                      : 'Calculating...'}
                  </span>
                </div>
                {deliveryQuote && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Delivering from {deliveryQuote.farmerLocation} • {deliveryQuote.distanceKm} km away
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                    <span>{t('cart.total')}</span>
                    <span>Rs. {finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block mt-6">
                <Button
                  type="submit"
                  form="checkout-form"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  disabled={
                    isFetchingLocation ||
                    isCheckingDelivery ||
                    totalPrice < MIN_ORDER_VALUE ||
                    !deliveryQuote
                  }
                >
                  {t('checkout.placeOrder')}
                </Button>
              </div>

              <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                {t('checkout.terms')}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Address selection modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        savedAddresses={savedAddresses}
        selectedAddressId={selectedAddress?._id ?? null}
        onSelect={(addr) => {
          handleAddressSelect(addr);
          setShowAddressModal(false);
        }}
        onAddNew={async (newAddr) => {
          await handleAddNewAddress(newAddr);
          setShowAddressModal(false);
        }}
      />
    </div>
  );
}
