/**
 * LocationPicker — Mappls (MapMyIndia) draggable-pin location selector
 *
 * Features:
 *   • Auto-centers on browser geolocation
 *   • Click anywhere on map OR drag the marker to set exact position
 *   • Displays coordinates below the map
 *   • "Confirm Location" button calls onConfirm([lng, lat])
 *
 * Usage:
 *   <LocationPicker onConfirm={(coords) => saveLocation(coords)} />
 */
import { useEffect, useRef, useState } from 'react';
import { waitForMappls } from '../../utils/mappls';

interface LocationPickerProps {
  /** Initial coordinates to center on [lng, lat]. Falls back to browser geolocation. */
  initialCoords?: [number, number];
  onConfirm: (coords: [number, number]) => void;
  isLoading?: boolean;
}

export function LocationPicker({ initialCoords, onConfirm, isLoading }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const [coords, setCoords] = useState<[number, number] | null>(initialCoords ?? null);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      if (cancelled || !containerRef.current) return;
      if (mapRef.current) return; // already initialised

      // Wait for Mappls SDK to be ready
      await waitForMappls();
      
      if (cancelled || !window.mappls) return;

      // ── CRITICAL: set explicit pixel dimensions BEFORE constructing the map.
      // Mappls reads the container size at construction time. If it measures 0px
      // the tile layer is never initialised and the map stays blank.
      const el = containerRef.current;
      el.style.position = 'relative';
      el.style.display  = 'block';
      el.style.width    = '100%';
      el.style.height   = '320px';
      // Flush layout so the browser recalculates before Map() runs
      void el.offsetHeight;

      // Default center: Jaipur (seeded default) or India centre
      const defaultLat = initialCoords ? initialCoords[1] : 26.9124;
      const defaultLng = initialCoords ? initialCoords[0] : 75.7873;
      const defaultZoom = initialCoords ? 15 : 12;

      try {
        const map = new window.mappls.Map(containerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: defaultZoom,
          search: false,
          zoomControl: true,
        });
        mapRef.current = map;

        const placeMarker = (lat: number, lng: number) => {
          const lngLat: [number, number] = [lng, lat];
          setCoords(lngLat);

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          } else {
            const m = new window.mappls.Marker({
              map,
              position: { lat, lng },
              draggable: true,
              popupHtml: '<div style="padding:4px">📍 Drag to adjust</div>',
            });

            m.on('dragend', () => {
              const pos = m.getPosition();
              if (pos) {
                setCoords([pos.lng, pos.lat]);
              }
            });

            markerRef.current = m;
          }
        };

        // Click on map to move pin
        map.on('click', (e: any) => {
          if (e.lngLat) placeMarker(e.lngLat.lat, e.lngLat.lng);
        });

        // Place marker at initialCoords if provided
        map.on('load', () => {
          if (cancelled) return;
          
          if (initialCoords) {
            placeMarker(initialCoords[1], initialCoords[0]);
          } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!cancelled) {
                  map.setCenter([pos.coords.latitude, pos.coords.longitude]);
                  map.setZoom(15);
                  placeMarker(pos.coords.latitude, pos.coords.longitude);
                }
              },
              () => setGeoError('Could not auto-detect location. Click the map to set your pin.')
            );
          }
        });
      } catch (err) {
        console.error('Mappls map init error:', err);
        setGeoError('Failed to initialize map. Please refresh the page.');
      }
    };

    // 500 ms: enough for the Card animation + React paint cycle to finish
    // before Mappls tries to measure the container
    const timer = setTimeout(() => {
      initializeMap();
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        try { mapRef.current.remove?.(); } catch { /* ignore */ }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    if (coords) onConfirm(coords);
  };

  return (
    <div className="space-y-3">
      {/* Instruction hint */}
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>
          {coords
            ? 'Drag the marker or click elsewhere to adjust. Then confirm.'
            : geoError || 'Getting your location… or click anywhere on the map to pin it.'}
        </span>
      </div>

      {/* Map — fixed-height wrapper, NO overflow-hidden (clips Mappls tiles) */}
      <div style={{ position: 'relative', width: '100%', height: '320px' }}>
        <div
          ref={containerRef}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-md cursor-crosshair"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#e8f4e8',
          }}
        />
      </div>

      {/* Coordinates display */}
      {coords && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center font-mono">
          {coords[1].toFixed(6)}°N, {coords[0].toFixed(6)}°E
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!coords || isLoading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
          flex items-center justify-center gap-2
          ${coords && !isLoading
            ? 'bg-gradient-to-r from-green-700 to-green-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 active:translate-y-0'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7" />
            </svg>
            Confirm Location
          </>
        )}
      </button>
    </div>
  );
}
