/**
 * GoogleLocationPicker
 * Draggable-pin map with Places Autocomplete + GPS button.
 * Calls onConfirm([lng, lat]) — GeoJSON coordinate order, matching the
 * existing [lng, lat] convention used throughout this app.
 */
import { Autocomplete, GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useCallback, useRef, useState } from 'react';

const LIBRARIES: 'places'[] = ['places'];

interface GoogleLocationPickerProps {
  /** Initial coordinates [lng, lat] — GeoJSON order */
  initialCoords?: [number, number];
  onConfirm: (coords: [number, number]) => void;
  isLoading?: boolean;
  height?: string;
}

export function GoogleLocationPicker({
  initialCoords,
  onConfirm,
  isLoading,
  height = '320px',
}: GoogleLocationPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  // Convert [lng, lat] → { lat, lng } for Google Maps
  const defaultLat = initialCoords ? initialCoords[1] : 26.9124;
  const defaultLng = initialCoords ? initialCoords[0] : 75.7873;

  const [position, setPosition] = useState({ lat: defaultLat, lng: defaultLng });
  const [geoError, setGeoError] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat !== undefined && lng !== undefined) setPosition({ lat, lng });
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat !== undefined && lng !== undefined) setPosition({ lat, lng });
  }, []);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setPosition({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(16);
    }
  };

  const handleUseGPS = () => {
    setGeoError('');
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(16);
      },
      () => setGeoError('Could not get location. Please allow access.')
    );
  };

  // Return [lng, lat] to match GeoJSON convention
  const handleConfirm = () => onConfirm([position.lng, position.lat]);

  if (loadError) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
        ❌ Failed to load Google Maps. Check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">🗺️ Loading map…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instruction */}
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Drag the marker or click anywhere on the map to set location.</span>
      </div>

      {/* Search */}
      <Autocomplete
        onLoad={(ref) => { autocompleteRef.current = ref; }}
        onPlaceChanged={handlePlaceChanged}
        options={{ componentRestrictions: { country: 'in' } }}
      >
        <input
          type="text"
          placeholder="🔍 Search area, landmark, city…"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </Autocomplete>

      {/* GPS button */}
      <button
        type="button"
        onClick={handleUseGPS}
        className="w-full flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors"
      >
        📍 Use My Current Location
      </button>

      {geoError && <p className="text-xs text-red-500">{geoError}</p>}

      {/* Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height, borderRadius: '12px', border: '1px solid #e5e7eb' }}
        center={position}
        zoom={15}
        onClick={handleMapClick}
        onLoad={(map) => { mapRef.current = map; }}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        <Marker position={position} draggable onDragEnd={handleMarkerDragEnd} />
      </GoogleMap>

      {/* Coordinates */}
      <p className="text-center text-xs text-gray-400 font-mono">
        📍 {position.lat.toFixed(6)}°N, {position.lng.toFixed(6)}°E
        <span className="ml-2 text-green-500"> · Click map or drag pin to adjust</span>
      </p>

      {/* Confirm */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
          ${!isLoading
            ? 'bg-gradient-to-r from-green-700 to-green-500 text-white shadow-lg hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Saving…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirm Location
          </>
        )}
      </button>
    </div>
  );
}
