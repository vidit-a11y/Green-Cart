import { useCallback, useRef, useState } from 'react';
import { Autocomplete, GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import type { SavedAddress } from '../../types';

const LIBRARIES: 'places'[] = ['places'];

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  onSelect: (address: SavedAddress) => void;
  onAddNew: (address: Omit<SavedAddress, '_id'>) => Promise<void>;
}

export function AddressModal({
  isOpen,
  onClose,
  savedAddresses,
  selectedAddressId,
  onSelect,
  onAddNew,
}: AddressModalProps) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home' as 'Home' | 'Work' | 'Other',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    coordinates: [0, 0] as [number, number],
    isDefault: false,
  });
  const [mapCenter, setMapCenter] = useState({ lat: 26.9124, lng: 75.7873 });
  const [isSaving, setIsSaving] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat !== undefined && lng !== undefined) {
      setMapCenter({ lat, lng });
      setNewAddress((prev) => ({ ...prev, coordinates: [lng, lat] }));
    }
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat !== undefined && lng !== undefined) {
      setMapCenter({ lat, lng });
      setNewAddress((prev) => ({ ...prev, coordinates: [lng, lat] }));
    }
  }, []);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMapCenter({ lat, lng });
      mapInstanceRef.current?.panTo({ lat, lng });
      mapInstanceRef.current?.setZoom(16);
      const components = place.address_components || [];
      const get = (type: string) =>
        components.find((c) => c.types.includes(type))?.long_name || '';
      setNewAddress((prev) => ({
        ...prev,
        addressLine: place.formatted_address || place.name || '',
        city: get('locality') || get('administrative_area_level_2'),
        state: get('administrative_area_level_1'),
        pincode: get('postal_code'),
        coordinates: [lng, lat],
      }));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        onSelect({ label: 'Other', addressLine: 'Current Location', city: '', state: '', pincode: '', coordinates: coords, isDefault: false });
        onClose();
      },
      () => alert('Please allow location access')
    );
  };

  const handleSaveNewAddress = async () => {
    if (!newAddress.addressLine || !newAddress.city || newAddress.coordinates[0] === 0) {
      alert('Please fill in all required fields and set location on map');
      return;
    }
    setIsSaving(true);
    try {
      await onAddNew(newAddress);
      setShowAddNew(false);
      setNewAddress({ label: 'Home', addressLine: '', city: '', state: '', pincode: '', coordinates: [0, 0], isDefault: false });
    } catch (err) {
      console.error('Save address error:', err);
      alert('Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Choose Delivery Location</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {!showAddNew ? (
            <>
              {/* GPS */}
              <button
                onClick={handleUseCurrentLocation}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-xl">📍</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">Use Current Location</span>
              </button>

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Saved Addresses</h3>
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id}
                        onClick={() => { onSelect(addr); onClose(); }}
                        className={`w-full text-left px-4 py-3 border rounded-xl transition-all ${
                          selectedAddressId === addr._id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <span>{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}</span>
                            <span className="text-gray-700 dark:text-gray-300">{addr.label}</span>
                          </span>
                          {selectedAddressId === addr._id && <span className="text-green-600">✓</span>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {addr.addressLine}, {addr.city}, {addr.state} {addr.pincode}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowAddNew(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl text-green-600 dark:text-green-400 font-medium hover:bg-green-50 transition-colors"
              >
                <span className="text-xl">+</span>
                <span>Add New Address</span>
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowAddNew(false)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Back
              </button>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address Type</label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setNewAddress((prev) => ({ ...prev, label }))}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        newAddress.label === label
                          ? 'bg-green-500 text-white border-green-500'
                          : 'border-gray-300 text-gray-600 hover:border-green-300'
                      }`}
                    >
                      {label === 'Home' ? '🏠' : label === 'Work' ? '💼' : '📍'} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Location</label>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(ref) => { autocompleteRef.current = ref; }}
                    onPlaceChanged={handlePlaceChanged}
                    options={{ componentRestrictions: { country: 'in' } }}
                  >
                    <input
                      type="text"
                      placeholder="Search for area, street, landmark…"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </Autocomplete>
                ) : (
                  <input type="text" placeholder="Loading search…" disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400" />
                )}
              </div>

              {/* Mini map */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm on Map</label>
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '180px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    center={mapCenter}
                    zoom={14}
                    onClick={handleMapClick}
                    onLoad={(map) => { mapInstanceRef.current = map; }}
                    options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                  >
                    <Marker position={mapCenter} draggable onDragEnd={handleMarkerDragEnd} />
                  </GoogleMap>
                ) : (
                  <div className="w-full h-[180px] rounded-lg bg-gray-100 flex items-center justify-center">
                    <p className="text-sm text-gray-400">Loading map…</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Drag marker or click to set location</p>
              </div>

              {/* Manual fields */}
              <input
                placeholder="Flat/House No, Street"
                value={newAddress.addressLine}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <input placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress((p) => ({ ...p, pincode: e.target.value }))} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress((p) => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Set as default address</span>
              </label>

              <button
                onClick={handleSaveNewAddress}
                disabled={isSaving}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
