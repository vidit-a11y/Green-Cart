/**
 * MapplsMap — legacy name kept for backward compatibility.
 * Delegates to GoogleTrackingMap.
 */
import { GoogleTrackingMap } from './GoogleTrackingMap';

interface MapplsMapProps {
  farmerCoords: { lat: number; lng: number };
  customerCoords: { lat: number; lng: number };
  /** Optional: live rider position. Passed through to GoogleTrackingMap. */
  riderCoords?: { lat: number; lng: number };
  farmerName?: string;
  height?: string;
  className?: string;
  distanceKm?: number;
}

export default function MapplsMap({
  farmerCoords,
  customerCoords,
  riderCoords,
  farmerName,
  height = '300px',
  className = '',
  distanceKm,
}: MapplsMapProps) {
  return (
    <GoogleTrackingMap
      farmerCoords={farmerCoords}
      customerCoords={customerCoords}
      riderCoords={riderCoords}
      farmerName={farmerName}
      distanceKm={distanceKm}
      height={height}
      className={className}
    />
  );
}
