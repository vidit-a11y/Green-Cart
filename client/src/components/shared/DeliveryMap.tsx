/**
 * DeliveryMap — Mappls (MapMyIndia) delivery preview map
 *
 * Renders:
 *   • Green marker  → farmer / pickup location
 *   • Red marker    → customer delivery location
 *   • Dashed polyline connecting both
 *   • Distance badge in the top-right corner
 *
 * Usage:
 *   <DeliveryMap
 *     customerCoords={[lng, lat]}
 *     farmerCoords={[lng, lat]}
 *     distanceKm={3.2}
 *     farmerLabel="Ramesh's Farm"
 *   />
 *
 * Coordinates follow GeoJSON convention: [longitude, latitude].
 */
import { useEffect, useRef } from 'react';

interface DeliveryMapProps {
  customerCoords: [number, number]; // [lng, lat]
  farmerCoords: [number, number];   // [lng, lat]
  distanceKm?: number;
  farmerLabel?: string;
  customerLabel?: string;
  className?: string;
  height?: string;
}

export function DeliveryMap({
  customerCoords,
  farmerCoords,
  distanceKm,
  farmerLabel = 'Farmer location',
  customerLabel = 'Your delivery location',
  className = '',
  height = '320px',
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeMap = () => {
      if (cancelled || !containerRef.current || !window.mappls) return;

      // Destroy any previous instance
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove?.(); } catch { /* ignore */ }
        mapInstanceRef.current = null;
      }

      // Convert [lng, lat] → Mappls { lat, lng }
      const farmerLat = farmerCoords[1];
      const farmerLng = farmerCoords[0];
      const customerLat = customerCoords[1];
      const customerLng = customerCoords[0];

      const centerLat = (farmerLat + customerLat) / 2;
      const centerLng = (farmerLng + customerLng) / 2;

      const map = new window.mappls.Map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom: 12,
        search: false,
      });
      mapInstanceRef.current = map;

      map.on('load', () => {
        if (cancelled) return;

        // Farmer marker (green)
        new window.mappls.Marker({
          map,
          position: { lat: farmerLat, lng: farmerLng },
          popupHtml: `<div style="padding:8px;font-family:sans-serif"><b style="color:#ea580c">🌾 ${farmerLabel}</b></div>`,
          popupOptions: { openPopup: true },
        });

        // Customer marker (red)
        new window.mappls.Marker({
          map,
          position: { lat: customerLat, lng: customerLng },
          popupHtml: `<div style="padding:8px;font-family:sans-serif"><b style="color:#16a34a">📦 ${customerLabel}</b></div>`,
        });

        // Route polyline
        new window.mappls.Polyline({
          map,
          path: [
            { lat: farmerLat, lng: farmerLng },
            { lat: customerLat, lng: customerLng },
          ],
          strokeColor: '#16a34a',
          strokeOpacity: 0.85,
          strokeWeight: 3,
          fitbounds: true,
          fitboundOptions: { padding: 48 },
        });
      });
    };

    if (window.mappls) {
      initializeMap();
    } else {
      if (!window._mapplsPendingInits) {
        window._mapplsPendingInits = [];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customerCoords[0], customerCoords[1],
    farmerCoords[0], farmerCoords[1],
  ]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />

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
          <span className="text-gray-700 dark:text-gray-200 font-medium">You</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-600 shrink-0" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Farmer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-green-600 shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Route</span>
        </div>
      </div>
    </div>
  );
}
