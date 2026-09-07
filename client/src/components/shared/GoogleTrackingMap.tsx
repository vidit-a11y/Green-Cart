/**
 * GoogleTrackingMap
 * Farmer pickup (🌾) + optional rider (🛵) + customer delivery (🏠) markers.
 * Used by DeliveryMap (checkout) and order tracking.
 *
 * NOTE: Does NOT call useLoadScript — the parent component is responsible for
 * loading the Google Maps SDK exactly once. This component checks window.google
 * to decide whether to render.
 */
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';

interface GoogleTrackingMapProps {
  farmerCoords: { lat: number; lng: number };
  customerCoords: { lat: number; lng: number };
  /** Optional: live rider position. When provided, a rider marker is shown. */
  riderCoords?: { lat: number; lng: number };
  farmerName?: string;
  farmerLabel?: string;
  customerLabel?: string;
  distanceKm?: number;
  height?: string;
  className?: string;
}

export function GoogleTrackingMap({
  farmerCoords,
  customerCoords,
  riderCoords,
  farmerName,
  distanceKm,
  farmerLabel = 'Farmer location',
  customerLabel = 'Your delivery location',
  height = '300px',
  className = '',
}: GoogleTrackingMapProps) {
  // Bail early if SDK not yet loaded — parent handles the loading state
  if (typeof window === 'undefined' || !(window as any).google?.maps) {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">🗺️ Loading map…</p>
      </div>
    );
  }

  // Center on rider if present, otherwise midpoint of farmer ↔ customer
  const center = riderCoords ?? {
    lat: (farmerCoords.lat + customerCoords.lat) / 2,
    lng: (farmerCoords.lng + customerCoords.lng) / 2,
  };

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-md ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={12}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        }}
      >
        {/* 🌾 Farmer marker — green dot */}
        <Marker
          position={farmerCoords}
          title={farmerName || farmerLabel}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
          }}
        />

        {/* 🏠 Customer marker — blue dot */}
        <Marker
          position={customerCoords}
          title={customerLabel}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
          }}
        />

        {/* 🛵 Simulated rider marker — yellow/orange dot */}
        {riderCoords && (
          <Marker
            position={riderCoords}
            title="Delivery rider"
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
              scaledSize: new window.google.maps.Size(44, 44),
            }}
            zIndex={10}
          />
        )}

        {/* Route polyline: farmer → rider (dashed) → customer (solid) */}
        {riderCoords ? (
          <>
            {/* Farmer → Rider: already-covered segment */}
            <Polyline
              path={[farmerCoords, riderCoords]}
              options={{
                strokeColor: '#16a34a',
                strokeOpacity: 0.5,
                strokeWeight: 3,
                geodesic: true,
              }}
            />
            {/* Rider → Customer: remaining segment */}
            <Polyline
              path={[riderCoords, customerCoords]}
              options={{
                strokeColor: '#f97316',
                strokeOpacity: 0.85,
                strokeWeight: 4,
                geodesic: true,
              }}
            />
          </>
        ) : (
          <Polyline
            path={[farmerCoords, customerCoords]}
            options={{
              strokeColor: '#16a34a',
              strokeOpacity: 0.85,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>

      {/* Distance badge */}
      {distanceKm !== undefined && (
        <div className="absolute top-3 right-3 z-10 bg-white dark:bg-gray-800 border border-gray-200 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-sm font-semibold text-gray-800 pointer-events-none">
          <span>📍</span>
          <span>{distanceKm.toFixed(1)} km</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-lg flex flex-col gap-1 text-xs pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-600 shrink-0" />
          <span className="text-gray-700 font-medium">Farmer</span>
        </div>
        {riderCoords && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
            <span className="text-gray-700 font-medium">Rider</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <span className="text-gray-700 font-medium">You</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-green-600 shrink-0" />
          <span className="text-gray-500">Route</span>
        </div>
      </div>
    </div>
  );
}
