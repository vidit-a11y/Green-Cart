/**
 * MapplsMap — Mappls (MapMyIndia) map component
 *
 * Renders:
 *   • Green marker  → farmer pickup location
 *   • Red marker    → customer delivery location
 *   • Polyline route between the two
 *
 * The Mappls SDK is loaded via a <script> tag in index.html.
 * If the SDK has not yet fired its `initMap` callback when this
 * component mounts, we register ourselves as the callback and
 * initialize the map once the SDK is ready.
 */

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    mappls: any;
    initMap: () => void;
    _mapplsPendingInits?: Array<() => void>;
  }
}

interface MapplsMapProps {
  farmerCoords: { lat: number; lng: number };
  customerCoords: { lat: number; lng: number };
  farmerName?: string;
  height?: string;
  className?: string;
  distanceKm?: number;
}

export default function MapplsMap({
  farmerCoords,
  customerCoords,
  farmerName,
  height = '300px',
  className = '',
  distanceKm,
}: MapplsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeMap = () => {
      if (cancelled || !mapRef.current || !window.mappls) return;

      // Destroy any previous instance on this element
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove?.(); } catch { /* ignore */ }
        mapInstanceRef.current = null;
      }

      const centerLat = (farmerCoords.lat + customerCoords.lat) / 2;
      const centerLng = (farmerCoords.lng + customerCoords.lng) / 2;

      const map = new window.mappls.Map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 12,
        search: false,
      });
      mapInstanceRef.current = map;

      map.on('load', () => {
        if (cancelled) return;

        // ── Farmer marker (green / pickup) ──────────────────────────────
        new window.mappls.Marker({
          map,
          position: { lat: farmerCoords.lat, lng: farmerCoords.lng },
          popupHtml: `<div style="padding:8px;font-family:sans-serif">
            <b style="color:#15803d">📦 Pickup</b><br/>
            <span style="color:#374151">${farmerName || 'Farmer'}</span>
          </div>`,
          popupOptions: { openPopup: true },
        });

        // ── Customer marker (red / delivery) ────────────────────────────
        new window.mappls.Marker({
          map,
          position: { lat: customerCoords.lat, lng: customerCoords.lng },
          popupHtml: '<div style="padding:8px;font-family:sans-serif"><b style="color:#dc2626">🏠 Your Location</b></div>',
        });

        // ── Route polyline ───────────────────────────────────────────────
        new window.mappls.Polyline({
          map,
          path: [
            { lat: farmerCoords.lat, lng: farmerCoords.lng },
            { lat: customerCoords.lat, lng: customerCoords.lng },
          ],
          strokeColor: '#16a34a',
          strokeOpacity: 0.85,
          strokeWeight: 4,
          fitbounds: true,
          fitboundOptions: { padding: 48 },
        });
      });
    };

    if (window.mappls) {
      // SDK already loaded → initialize immediately
      initializeMap();
    } else {
      // SDK not loaded yet — queue our init for when initMap fires
      if (!window._mapplsPendingInits) {
        window._mapplsPendingInits = [];
        // Override initMap so ALL pending initializers run
        window.initMap = () => {
          (window._mapplsPendingInits ?? []).forEach((fn) => fn());
          window._mapplsPendingInits = [];
        };
      }
      window._mapplsPendingInits.push(initializeMap);
    }

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove?.(); } catch { /* ignore */ }
        mapInstanceRef.current = null;
      }
    };
  // Re-initialize when coordinates change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerCoords.lat, farmerCoords.lng, customerCoords.lat, customerCoords.lng]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-md ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Distance badge */}
      {distanceKm !== undefined && (
        <div className="absolute top-3 right-3 z-10
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600
          rounded-full px-3 py-1.5 shadow-lg
          flex items-center gap-1.5 text-sm font-semibold
          text-gray-800 dark:text-gray-100 pointer-events-none"
        >
          <span>📍</span>
          <span>{distanceKm.toFixed(1)} km</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10
        bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
        border border-gray-200 dark:border-gray-600
        rounded-xl px-3 py-2 shadow-lg
        flex flex-col gap-1 text-xs pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-600 shrink-0" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Farmer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">You</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-green-600 shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Route</span>
        </div>
      </div>
    </div>
  );
}
