/**
 * useCustomerLocation
 *
 * A thin wrapper around the browser Geolocation API that exposes the
 * customer's current position as a simple { lat, lng } object.
 *
 * Design decisions:
 *  - Returns { lat, lng } (not GeoJSON [lng, lat]) — matches the flat param
 *    convention used in Step 3's order API (customerLat / customerLng).
 *  - `loading` starts true so callers can show a spinner immediately.
 *  - Uses `enableHighAccuracy: true` for the best GPS fix available.
 *  - One-shot — watches position once on mount. Re-request by remounting
 *    or by calling captureLocation() manually (returned from the hook).
 *
 * Usage:
 *   const { coords, loading, error, captureLocation } = useCustomerLocation()
 *   // coords === null while loading or on error
 *   // coords === { lat: 18.52, lng: 73.85 } on success
 */

import { useCallback, useEffect, useState } from 'react';

export interface CustomerCoords {
  lat: number;
  lng: number;
}

export interface UseCustomerLocationResult {
  coords: CustomerCoords | null;
  loading: boolean;
  error: string | null;
  /** Manually re-trigger the geolocation request (e.g. on button click). */
  captureLocation: () => void;
}

export function useCustomerLocation(): UseCustomerLocationResult {
  const [coords, setCoords] = useState<CustomerCoords | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied — please allow access and try again',
          2: 'Location unavailable — check your device GPS settings',
          3: 'Location request timed out — please try again',
        };
        setError(messages[err.code] ?? 'Could not determine your location');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  // Auto-capture on mount
  useEffect(() => {
    captureLocation();
  }, [captureLocation]);

  return { coords, loading, error, captureLocation };
}
