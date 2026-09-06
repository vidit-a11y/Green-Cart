/**
 * LocationPicker — thin wrapper around GoogleLocationPicker.
 * Preserves the onConfirm([lng, lat]) interface so FarmerSettings
 * and Register.tsx need no changes.
 */
import { GoogleLocationPicker } from './GoogleLocationPicker';

interface LocationPickerProps {
  initialCoords?: [number, number]; // [lng, lat]
  onConfirm: (coords: [number, number]) => void;
  isLoading?: boolean;
}

export function LocationPicker({ initialCoords, onConfirm, isLoading }: LocationPickerProps) {
  return (
    <GoogleLocationPicker
      initialCoords={initialCoords}
      onConfirm={onConfirm}
      isLoading={isLoading}
      height="320px"
    />
  );
}
