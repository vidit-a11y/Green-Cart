/**
 * MapplsMap — legacy name kept so OrderTracking.tsx compiles without changes.
 * Delegates to GoogleTrackingMap.
 */
import { GoogleTrackingMap } from './GoogleTrackingMap';

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
  return (
    <GoogleTrackingMap
      farmerCoords={farmerCoords}
      customerCoords={customerCoords}
      farmerName={farmerName}
      distanceKm={distanceKm}
      height={height}
      className={className}
    />
  );
}
