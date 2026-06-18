import type { ValidationResult } from './auth.validation.js';

export const validateProductInput = (body: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  const { name, price, quantity, category, unit, location } = body;

  if (!name || typeof name !== 'string' || (name as string).trim().length === 0) {
    errors.push('Product name is required');
  }

  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    errors.push('Valid price is required (must be >= 0)');
  }

  if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) < 0) {
    errors.push('Valid quantity is required (must be >= 0)');
  }

  if (!category || typeof category !== 'string') {
    errors.push('Category is required');
  }

  if (!unit || typeof unit !== 'string') {
    errors.push('Unit is required');
  }

  if (!location || typeof location !== 'string') {
    errors.push('Location is required');
  }

  return { valid: errors.length === 0, errors };
};

export const validateOrderInput = (body: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  const { items, deliveryAddress, paymentMethod, customerLocation, customerLat, customerLng } = body;

  if (!items || !Array.isArray(items) || (items as unknown[]).length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    (items as Array<Record<string, unknown>>).forEach((item, i) => {
      if (!item.productId) errors.push(`Item ${i + 1}: productId is required`);
      if (!item.quantity || Number(item.quantity) < 1) {
        errors.push(`Item ${i + 1}: quantity must be at least 1`);
      }
    });
  }

  if (!deliveryAddress || typeof deliveryAddress !== 'string') {
    errors.push('Delivery address is required');
  }

  if (!paymentMethod || typeof paymentMethod !== 'string') {
    errors.push('Payment method is required');
  }

  // Accept GeoJSON { customerLocation: { coordinates: [lng, lat] } }
  //    OR flat    { customerLat, customerLng }
  const hasGeoPoint = (() => {
    const coords = (customerLocation as { coordinates?: unknown } | undefined)?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) return false;
    return coords.every((v) => Number.isFinite(Number(v)));
  })();

  const hasFlatCoords = (() => {
    if (customerLat === undefined || customerLng === undefined) return false;
    return Number.isFinite(Number(customerLat)) && Number.isFinite(Number(customerLng));
  })();

  if (!hasGeoPoint && !hasFlatCoords) {
    errors.push(
      'Customer GPS location is required — send customerLocation: { coordinates: [lng, lat] } or customerLat + customerLng'
    );
  }

  return { valid: errors.length === 0, errors };
};
