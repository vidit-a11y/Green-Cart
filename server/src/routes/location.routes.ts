/**
 * location.routes.ts
 *
 * Public-facing geolocation endpoints.  No auth required — these are read-only
 * discovery APIs that the checkout flow calls before any account action.
 *
 * Routes:
 *   GET /api/location/farmers-near?lat=XX&lng=YY[&productId=ZZ]
 *   GET /api/location/geocode?address=Jaipur+MI+Road
 */

import express, { type Request, type Response } from 'express';
import {
  findFarmersNearCustomer,
  geocodeAddress,
} from '../services/location.service.js';
import { sendError, sendSuccess } from '../utils/response.utils.js';

const router = express.Router();

// ─── GET /api/location/farmers-near ──────────────────────────────────────────
/**
 * Find farmers within delivery range of a customer coordinate.
 *
 * Query params:
 *   lat       {number}  Customer latitude   (required)
 *   lng       {number}  Customer longitude  (required)
 *   productId {string}  Filter to the farmer selling this product (optional)
 *
 * Response:
 *   { farmers, deliveryFee, distanceKm, radiusUsed }
 *   or 404 if no farmers found within 50 km
 */
router.get('/farmers-near', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const productId = (req.query.productId as string) || undefined;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      sendError(res, 'lat and lng must be valid numbers', 400);
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      sendError(res, 'lat/lng values out of valid range', 400);
      return;
    }

    const result = await findFarmersNearCustomer([lng, lat], productId);

    if (!result || result.farmers.length === 0) {
      sendError(res, 'No farmers available in your area within 50 km', 404);
      return;
    }

    sendSuccess(res, {
      farmers: result.farmers,
      deliveryFee: result.deliveryFee,
      distanceKm: result.distanceKm,
      radiusUsed: result.radiusUsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error finding nearby farmers';
    sendError(res, message, 500);
  }
});

// ─── GET /api/location/geocode ────────────────────────────────────────────────
/**
 * Forward-geocode a free-text address using OpenStreetMap Nominatim.
 *
 * Query params:
 *   address {string}  The address to geocode (required)
 *
 * Response:
 *   { lat, lng, displayName }
 */
router.get('/geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const address = (req.query.address as string)?.trim();

    if (!address) {
      sendError(res, 'address query parameter is required', 400);
      return;
    }
    if (address.length > 300) {
      sendError(res, 'address is too long (max 300 characters)', 400);
      return;
    }

    const result = await geocodeAddress(address);

    if (!result) {
      sendError(res, `No location found for address: "${address}"`, 404);
      return;
    }

    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Geocoding failed';
    sendError(res, message, 500);
  }
});

export default router;
