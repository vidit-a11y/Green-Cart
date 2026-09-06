/**
 * location.service.ts
 *
 * General-purpose geospatial helpers for the /api/location routes.
 *
 * Intentional design choices:
 *  • calculateDistanceKm is the canonical Haversine impl; deliveryService.ts
 *    already has its own copy — leaving that untouched (as instructed) and
 *    exporting cleanly from here for new consumers.
 *  • findFarmersNearCustomer returns ALL matching farmers (not just one),
 *    enabling the frontend map to show multiple pins when multiple farmers
 *    are within range.
 *  • Radius expansion mirrors the same DELIVERY_BANDS used by deliveryService
 *    so fees are consistent across the system.
 */

import axios from 'axios';
import { Product } from '../models/Product.js';
import { User, type IUser } from '../models/User.js';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DELIVERY_BANDS = [
  { maxDistanceKm: 7.5,  maxDistanceM: 7500,  deliveryFee: 0  },
  { maxDistanceKm: 15,   maxDistanceM: 15000, deliveryFee: 50 },
  { maxDistanceKm: 25,   maxDistanceM: 25000, deliveryFee: 50 },
  { maxDistanceKm: 50,   maxDistanceM: 50000, deliveryFee: 50 },
] as const;

type Coordinates = [number, number]; // [longitude, latitude]

// ─── Haversine Distance ───────────────────────────────────────────────────────

/**
 * Calculate great-circle distance between two [lng, lat] coordinate pairs.
 * Returns distance in kilometres.
 */
export function calculateDistanceKm(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const EARTH_RADIUS_KM = 6371;

  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Farmer Discovery ─────────────────────────────────────────────────────────

export interface FarmerNearResult {
  farmers: IUser[];
  distanceKm: number;      // closest farmer's distance
  deliveryFee: number;     // fee applicable for the matched band
  radiusUsed: number;      // km radius that yielded results
}

/**
 * Expand search radius band-by-band until at least one farmer is found.
 *
 * @param customerCoords  Customer's [lng, lat]
 * @param productId       Optional — if provided, only farmers selling this
 *                        product are considered
 */
export async function findFarmersNearCustomer(
  customerCoords: Coordinates,
  productId?: string
): Promise<FarmerNearResult | null> {
  // If filtering by product, resolve which farmer owns it first
  let farmerIdFilter: string | undefined;
  if (productId) {
    const product = await Product.findById(productId).select('farmerId isAvailable').lean();
    if (!product || !product.isAvailable) return null;
    farmerIdFilter = product.farmerId;
  }

  const [lng, lat] = customerCoords;

  for (const band of DELIVERY_BANDS) {
    const query: Record<string, any> = {
      role: 'farmer',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: band.maxDistanceM,
        },
      },
    };

    if (farmerIdFilter) {
      query['_id'] = farmerIdFilter;
    }

    const farmers = await User.find(query)
      .select('-password')
      .limit(20)
      .lean<IUser[]>();

    if (farmers.length === 0) continue;

    // Closest farmer is first (MongoDB $near returns sorted by proximity)
    const closestCoords = farmers[0].location?.coordinates;
    const distanceKm = closestCoords
      ? calculateDistanceKm(customerCoords, closestCoords)
      : band.maxDistanceKm;

    return {
      farmers,
      distanceKm: Math.round(distanceKm * 10) / 10,
      deliveryFee: band.deliveryFee,
      radiusUsed: band.maxDistanceKm,
    };
  }

  // No farmers found within 50 km
  return null;
}

// ─── Nominatim Geocode ────────────────────────────────────────────────────────

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Forward-geocode an address string using OpenStreetMap Nominatim.
 * No API key required. Returns the best match or null if not found.
 *
 * Rate-limit: Nominatim asks for max 1 req/sec from the same IP —
 * acceptable for low-traffic use.  For production at scale, self-host
 * Nominatim or switch to a paid geocoder.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = 'https://nominatim.openstreetmap.org/search';
  const response = await axios.get<Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>>(url, {
    params: {
      q: address,
      format: 'json',
      limit: 1,
      addressdetails: 0,
    },
    headers: {
      // Nominatim requires a User-Agent identifying the application
      'User-Agent': 'GreenCart/1.0 (greencart-app)',
    },
    timeout: 8000,
  });

  const hit = response.data?.[0];
  if (!hit) return null;

  return {
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    displayName: hit.display_name,
  };
}
