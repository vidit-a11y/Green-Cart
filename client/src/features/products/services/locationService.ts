/**
 * locationService.ts — Client-side wrapper for /api/location endpoints.
 * All calls go through the shared axios instance (auth header + base URL).
 */

import api from '../../../lib/api';
import type { ApiResponse } from '../../../types';

export interface NearbyFarmerResult {
  farmers: Array<{
    _id: string;
    name: string;
    location?: { coordinates: [number, number] };
  }>;
  deliveryFee: number;   // 0 if ≤7.5 km, 50 otherwise
  distanceKm: number;    // closest farmer's actual distance
  radiusUsed: number;    // km band that was matched
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export const locationService = {
  /**
   * Find farmers near the customer.
   * Returns null if no farmers are within 50 km (404 from server).
   */
  async getFarmersNear(
    lat: number,
    lng: number,
    productId?: string
  ): Promise<NearbyFarmerResult | null> {
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
      if (productId) params.append('productId', productId);
      const response = await api.get<ApiResponse<NearbyFarmerResult>>(
        `/location/farmers-near?${params}`
      );
      return response.data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  /**
   * Forward-geocode a free-text address via OSM Nominatim (proxied through server).
   * Returns null if the address could not be found.
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await api.get<ApiResponse<GeocodeResult>>(
        `/location/geocode?address=${encodeURIComponent(address)}`
      );
      return response.data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};
