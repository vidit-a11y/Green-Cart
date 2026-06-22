import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { DeliveryMap } from '../../../components/shared/DeliveryMap';
import { AddressModal } from '../../../components/shared/AddressModal';
import { ProductImage } from '../../../utils/productHelpers';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useCart } from '../../../features/cart/context/CartContext';
import { orderService } from '../../../features/cart/services/orderService';
import type { DeliveryQuote, GeoPoint, SavedAddress } from '../../../types';
import { useToast } from '../../../utils/ToastContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_ORDER_VALUE = 199;
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
// "places" library needed for Geocoder (reverse geocoding API)
const GMAPS_LIBRARIES: ('places' | 'geocoding')[] = ['places'];
// Default center: Jaipur
const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 };

// ─── Component ────────────────────────────────────────────────────────────────
export function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  // ── Google Maps SDK ──────────────────────────────────────────────────────────
  // ONE useLoadScript call for the entire Checkout page.
  // GoogleTrackingMap (DeliveryMap) re-uses this loaded SDK without calling
  // useLoadScript again, eliminating the "included multiple times" error.
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useLoadScript({
    googleMapsApiKey: GMAPS_KEY,
    libraries: GMAPS_LIBRARIES,
  });

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // ── State ────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<GeoPoint | null>(null);
  // The pin position on the interactive map
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryError, setDeliveryError] = useState('');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Derived ──────────────────────────────────────────────────────────────────
  const itemPayload = useMemo(
    () => items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    [items]
  );

  // ── Redirect if cart empty ────────────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) navigate('/cart', { replace: true });
  }, [items.length, navigate]);

  // ── Initialize Geocoder when SDK loads ───────────────────────────────────────
  useEffect(() => {
    if (!mapsLoaded) return;
    geocoderRef.current = new window.google.maps.Geocoder();
  }, [mapsLoaded]);

  // ── Load saved addresses on mount ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API}/users/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          const addresses: SavedAddress[] = data.data || [];
          setSavedAddresses(addresses);
          const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
            const [lng, lat] = defaultAddr.coordinates;
            applyLocation(lat, lng, {
              address: defaultAddr.addressLine,
              city: defaultAddr.city,
              state: defaultAddr.state,
              zipCode: defaultAddr.pincode,
            });
          }
        }
      } catch {
        // silently ignore — checkout still works without saved addresses
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GPS auto-detect on mount (after SDK loads) ───────────────────────────────
  useEffect(() => {
    if (!mapsLoaded || pinCoords) return; // skip if already have a pin
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleLocationSelect(lat, lng);
        // Pan map once it mounts
        setTimeout(() => {
          mapRef.current?.panTo({ lat, lng });
          mapRef.current?.setZoom(15);
        }, 300);
      },
      () => {}, // ignore GPS denial silently
      { timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded]);

  // ── Core: coordinates → pin + form + delivery quote ─────────────────────────
  const applyLocation = useCallback(
    (
      lat: number,
      lng: number,
      overrideFields?: { address?: string; city?: string; state?: string; zipCode?: string }
    ) => {
      // 1. Update pin on map
      setPinCoords({ lat, lng });

      // 2. Update GeoPoint for order creation (GeoJSON [lng, lat])
      const geoPoint: GeoPoint = { type: 'Point', coordinates: [lng, lat] };
      setCustomerLocation(geoPoint);

      // 3. If caller provided already-known fields (e.g. from a saved address), use them
      if (overrideFields) {
        setFormData((prev) => ({
          ...prev,
          ...(overrideFields.address !== undefined && { address: overrideFields.address }),
          ...(overrideFields.city !== undefined && { city: overrideFields.city }),
          ...(overrideFields.state !== undefined && { state: overrideFields.state }),
          ...(overrideFields.zipCode !== undefined && { zipCode: overrideFields.zipCode }),
        }));
      }

      // 4. Recalculate delivery quote
      setIsCheckingDelivery(true);
      setDeliveryError('');
      setDeliveryQuote(null);
      orderService
        .getDeliveryQuote({ items: itemPayload, customerLocation: geoPoint })
        .then((quote) => setDeliveryQuote(quote))
        .catch((err) => {
          setDeliveryError(err instanceof Error ? err.message : 'Failed to calculate delivery');
        })
        .finally(() => setIsCheckingDelivery(false));
    },
    [itemPayload]
  );

  // ── Reverse geocode + call applyLocation ─────────────────────────────────────
  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      // Set pin immediately so it doesn't feel laggy
      setPinCoords({ lat, lng });
      const geoPoint: GeoPoint = { type: 'Point', coordinates: [lng, lat] };
      setCustomerLocation(geoPoint);

      // Start delivery quote fetch
      setIsCheckingDelivery(true);
      setDeliveryError('');
      setDeliveryQuote(null);
      orderService
        .getDeliveryQuote({ items: itemPayload, customerLocation: geoPoint })
        .then((quote) => setDeliveryQuote(quote))
        .catch((err) => {
          setDeliveryError(err instanceof Error ? err.message : 'Failed to calculate delivery');
        })
        .finally(() => setIsCheckingDelivery(false));

      // Reverse geocode to fill address fields
      const geocoder = geocoderRef.current ?? (mapsLoaded ? new window.google.maps.Geocoder() : null);
      if (!geocoder) return;
      geocoderRef.current = geocoder;

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const place = results[0];
          const comps = place.address_components || [];

          const get = (type: string) =>
            comps.find((c) => c.types.includes(type))?.long_name ?? '';

          const streetNumber = get('street_number');
          const route = get('route');
          const sub1 = get('sublocality_level_1') || get('sublocality');
          const locality = get('locality');
          const city = locality || get('administrative_area_level_2');
          const state = get('administrative_area_level_1');
          const pincode = get('postal_code');

          const addressLine =
            [streetNumber, route, sub1].filter(Boolean).join(', ') ||
            place.formatted_address;

          setFormData((prev) => ({
            ...prev,
            address: addressLine || prev.address,
            city: city || prev.city,
            state: state || prev.state,
            zipCode: pincode || prev.zipCode,
          }));
        }
      });
    },
    [itemPayload, mapsLoaded]
  );

  // ── GPS button click ──────────────────────────────────────────────────────────
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleLocationSelect(lat, lng);
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(15);
      },
      () => showToast('Please allow location access to continue', 'error'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [handleLocationSelect, showToast]);

  // ── Saved address selection ───────────────────────────────────────────────────
  const handleAddressSelect = (address: SavedAddress) => {
    setSelectedAddress(address);
    const [lng, lat] = address.coordinates;
    applyLocation(lat, lng, {
      address: address.addressLine,
      city: address.city,
      state: address.state,
      zipCode: address.pincode,
    });
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(15);
  };

  const handleAddNewAddress = async (newAddr: Omit<SavedAddress, '_id'>) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/users/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newAddr),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save address');
    const saved: SavedAddress = data.data;
    setSavedAddresses((prev) => [...prev, saved]);
    handleAddressSelect(saved);
  };

  // ── Form field change ─────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (totalPrice < MIN_ORDER_VALUE) newErrors.order = `Minimum order value is ₹${MIN_ORDER_VALUE}`;
    if (!formData.fullName.trim()) newErrors.fullName = `${t('checkout.fullName')} is required`;
    if (!formData.phone.trim()) newErrors.phone = `${t('checkout.phone')} is required`;
    if (!formData.address.trim()) newErrors.address = `${t('checkout.address')} is required`;
    if (!formData.city.trim()) newErrors.city = `${t('checkout.city')} is required`;
    if (!formData.state.trim()) newErrors.state = `${t('checkout.state')} is required`;
    if (!formData.zipCode.trim()) newErrors.zipCode = `${t('checkout.zipCode')} is required`;
    if (!customerLocation) newErrors.location = 'Please select a delivery location on the map';
    if (!deliveryQuote) newErrors.delivery = deliveryError || 'Delivery quote is not available yet';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !customerLocation || !deliveryQuote) return;

    console.log('🛒 ORDER SUBMISSION DEBUG:');
    console.log('customerLocation:', customerLocation);
    console.log('deliveryQuote:', deliveryQuote);
    console.log('itemPayload:', itemPayload);
    console.log('formData:', formData);

    setIsLoading(true);
    try {
      const deliveryAddress = `${formData.fullName}\n${formData.address}\n${formData.city}, ${formData.state} ${formData.zipCode}\nPhone: ${formData.phone}`;

      const orderPayload = {
        items: itemPayload,
        deliveryAddress,
        paymentMethod,
        customerLocation,
      };

      console.log('📦 Sending order payload:', JSON.stringify(orderPayload, null, 2));

      // 1. Create order in DB first
      const order = await orderService.create(orderPayload);

      console.log('✅ Order created:', order);

      const orderId: string = (order as any)._id ?? (order as any).id ?? '';

      // 2. COD — done, navigate to tracking
      if (paymentMethod === 'cod') {
        showToast(t('checkout.orderSuccess') || 'Order placed successfully!', 'success');
        clearCart();
        navigate(`/orders/${orderId}/track`);
        return;
      }

      // 3. Razorpay online payment
      const token = localStorage.getItem('token');
      const rzpRes = await fetch(`${API}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: deliveryQuote.totalAmount, orderId }),
      });
      const rzpData = await rzpRes.json();
      const rzpOrder = rzpData.data ?? rzpData;

      // Load Razorpay SDK (once)
      await new Promise<void>((resolve) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

      const rzp = new (window as any).Razorpay({
        key: RZP_KEY,
        amount: rzpOrder.amount,
        currency: 'INR',
        name: 'GreenCart',
        description: 'Fresh Farm Produce',
        order_id: rzpOrder.razorpayOrderId,
        prefill: { name: formData.fullName, contact: formData.phone },
        theme: { color: '#16a34a' },
        handler: async (response: any) => {
          try {
            await fetch(`${API}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              }),
            });
          } catch { /* non-critical — order already saved */ }
          showToast('Payment successful! 🎉', 'success');
          clearCart();
          navigate(`/orders/${orderId}/track`);
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled. Your order is saved — complete payment from My Orders.', 'error');
            clearCart();
            navigate('/orders');
          },
        },
      });
      rzp.open();
    } catch (error) {
      console.error('❌ Order submission error:', error);
      showToast(
        error instanceof Error ? error.message : t('checkout.orderFailed'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) return null;

  const deliveryFee = deliveryQuote?.deliveryFee ?? 0;
  const finalTotal = deliveryQuote?.totalAmount ?? totalPrice;

  // ── Map click handler (stable ref) ───────────────────────────────────────────
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat !== undefined && lng !== undefined) handleLocationSelect(lat, lng);
    },
    [handleLocationSelect]
  );

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat !== undefined && lng !== undefined) handleLocationSelect(lat, lng);
    },
    [handleLocationSelect]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          {t('checkout.title')}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left column ── */}
          <div className="w-full lg:w-2/3">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">

              {/* ─── Delivery Address ─── */}
              <Card padding="lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('checkout.deliveryInfo')}
                </h2>

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

              {/* ─── Interactive Delivery Map ─── */}
              <Card padding="lg">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      📍 Set Delivery Location
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Click the map or drag the pin to set your exact delivery spot. Address fields update automatically.
                    </p>
                  </div>
                  {/* Saved addresses button */}
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="shrink-0 text-xs border border-green-400 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors font-medium"
                    >
                      📋 Saved ({savedAddresses.length})
                    </button>
                  )}
                </div>

                {/* GPS Button */}
                <button
                  type="button"
                  onClick={handleGPS}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl text-sm font-medium mb-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  📍 Use My Current Location (GPS)
                </button>

                {/* Interactive Google Map */}
                {mapsLoadError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 mb-3">
                    ❌ Could not load Google Maps. Check your API key configuration.
                  </div>
                )}

                {!mapsLoaded && !mapsLoadError && (
                  <div className="w-full rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-3" style={{ height: '280px' }}>
                    <p className="text-gray-400 text-sm">🗺️ Loading map…</p>
                  </div>
                )}

                {mapsLoaded && (
                  <div className="mb-3">
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '280px', borderRadius: '12px' }}
                      center={pinCoords ?? DEFAULT_CENTER}
                      zoom={pinCoords ? 15 : 12}
                      onLoad={(map) => { mapRef.current = map; }}
                      onClick={onMapClick}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        clickableIcons: false,   // ← disables POI popups (schools, shops, etc.)
                      }}
                    >
                      {pinCoords && (
                        <Marker
                          position={pinCoords}
                          draggable
                          onDragEnd={onMarkerDragEnd}
                          title="Drag to adjust delivery location"
                        />
                      )}
                    </GoogleMap>
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1.5">
                      {pinCoords
                        ? `📍 ${pinCoords.lat.toFixed(5)}°N, ${pinCoords.lng.toFixed(5)}°E — Click map or drag pin to adjust`
                        : '👆 Click anywhere on the map to drop a pin'}
                    </p>
                  </div>
                )}

                {errors.location && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">{errors.location}</p>
                )}

                {/* Delivery quote result */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 p-4">
                  {isCheckingDelivery ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 animate-spin text-green-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Checking nearby farmer availability…
                    </div>
                  ) : deliveryQuote ? (
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        🌾 Delivering from {deliveryQuote.farmerLocation}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {deliveryQuote.distanceKm} km away • Delivery:{' '}
                        {deliveryQuote.deliveryFee === 0 ? (
                          <span className="text-green-600 font-semibold">FREE</span>
                        ) : (
                          <span className="font-semibold">₹{deliveryQuote.deliveryFee}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Farmer: {deliveryQuote.farmerName}
                      </p>
                    </div>
                  ) : deliveryError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{deliveryError}</p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {pinCoords
                        ? 'Calculating delivery…'
                        : 'Use GPS or click the map above to set your delivery location.'}
                    </p>
                  )}
                </div>

                {/* Route map (shown after quote available) */}
                {deliveryQuote && customerLocation && mapsLoaded && (
                  <div className="mt-4">
                    <DeliveryMap
                      customerCoords={customerLocation.coordinates}
                      farmerCoords={deliveryQuote.farmerCoordinates}
                      distanceKm={deliveryQuote.distanceKm}
                      farmerLabel={deliveryQuote.farmerLocation}
                      customerLabel="Your delivery location"
                      height="220px"
                    />
                    <p className="mt-2 text-xs text-center text-gray-400 dark:text-gray-500">
                      🗺️ Farmer → Your location route
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                  Minimum order value: ₹{MIN_ORDER_VALUE}
                </div>
                {errors.order && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-300">{errors.order}</p>
                )}
              </Card>

              {/* ─── Payment Method ─── */}
              <Card padding="lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  💳 Payment Method
                </h2>

                <div className="space-y-3">
                  {([
                    { id: 'razorpay', label: 'Pay Online', sublabel: 'UPI, Card, NetBanking, Wallets', icon: '💳' },
                    { id: 'cod', label: 'Cash on Delivery', sublabel: 'Pay when your order arrives', icon: '💵' },
                  ] as const).map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="accent-green-500"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{method.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{method.sublabel}</p>
                      </div>
                      {method.id === 'razorpay' && (
                        <span className="ml-auto text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                          Recommended
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                {paymentMethod === 'cod' && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                    💵 You will pay <strong>₹{finalTotal.toLocaleString('en-IN')}</strong> when your order is delivered.
                  </div>
                )}
                {paymentMethod === 'razorpay' && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-300">
                    🔒 Secured by Razorpay. Pay with UPI, Card or NetBanking.
                  </div>
                )}
              </Card>

              {/* Mobile submit */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  disabled={isCheckingDelivery || totalPrice < MIN_ORDER_VALUE || !deliveryQuote}
                >
                  Place Order — ₹{finalTotal.toLocaleString('en-IN')}
                </Button>
              </div>
            </form>
          </div>

          {/* ── Right column: order summary ── */}
          <div className="w-full lg:w-1/3">
            <Card padding="lg" className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('checkout.orderSummary')}
              </h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 text-sm">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <ProductImage
                        product={item.product}
                        className="w-full h-full object-cover"
                        fallbackSize="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{item.product.name}</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white shrink-0">
                      ₹{(item.quantity * item.product.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.subtotal', { count: items.length })}</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.deliveryFee')}</span>
                  <span>
                    {isCheckingDelivery
                      ? '…'
                      : deliveryQuote
                      ? deliveryFee === 0
                        ? t('cart.free')
                        : `₹${deliveryFee.toLocaleString('en-IN')}`
                      : 'Calculating…'}
                  </span>
                </div>
                {deliveryQuote && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {deliveryQuote.farmerLocation} • {deliveryQuote.distanceKm} km away
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                    <span>{t('cart.total')}</span>
                    <span>₹{finalTotal.toLocaleString('en-IN')}</span>
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
                  disabled={isCheckingDelivery || totalPrice < MIN_ORDER_VALUE || !deliveryQuote}
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
