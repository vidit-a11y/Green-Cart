/**
 * DeliveryMap — delivery preview map (checkout)
 * Thin wrapper around GoogleTrackingMap.
 * Accepts [lng, lat] arrays (GeoJSON order) — all callers are unchanged.
 */
import { GoogleTrackingMap } from './GoogleTrackingMap';

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
  farmerLabel,
  customerLabel,
  className,
  height = '320px',
}: DeliveryMapProps) {
  return (
    <GoogleTrackingMap
      farmerCoords={{ lat: farmerCoords[1], lng: farmerCoords[0] }}
      customerCoords={{ lat: customerCoords[1], lng: customerCoords[0] }}
      distanceKm={distanceKm}
      farmerLabel={farmerLabel}
      customerLabel={customerLabel}
      height={height}
      className={className}
    />
  );
}
