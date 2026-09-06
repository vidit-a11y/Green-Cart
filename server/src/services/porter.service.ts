import axios, { AxiosError } from 'axios';
import { env } from '../env.js';

type Coordinates = [number, number];

interface PorterQuoteResponse {
  estimatedFare: number;
  etaMinutes: number;
}

interface CreatePorterOrderInput {
  orderId: string;
  pickupAddress: string;
  pickupCoords: Coordinates;
  pickupContactName: string;
  pickupContactPhone: string;
  dropAddress: string;
  dropCoords: Coordinates;
  dropContactName: string;
  dropContactPhone: string;
  itemDescription: string;
  orderValue: number;
}

interface CreatePorterOrderResponse {
  porterOrderId: string;
  trackingUrl: string;
  driverName: string;
  driverPhone: string;
  etaMinutes: number;
}

const porterClient = axios.create({
  baseURL: env.PORTER_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    ...(env.PORTER_API_KEY
      ? {
          'x-api-key': env.PORTER_API_KEY,
          Authorization: `Bearer ${env.PORTER_API_KEY}`,
        }
      : {}),
  },
});

const assertPorterConfigured = () => {
  if (!env.PORTER_API_KEY || env.PORTER_API_KEY === 'your_porter_api_key') {
    throw new Error('Porter API is not configured. Add a valid PORTER_API_KEY in server/.env');
  }
};

const getNestedValue = (source: unknown, paths: string[]) => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  for (const path of paths) {
    const value = path.split('.').reduce<unknown>((current, key) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[key];
    }, source);

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const asNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const asString = (value: unknown, fallback = '') => {
  return typeof value === 'string' && value.trim() ? value : fallback;
};

const formatGeoPayload = ([longitude, latitude]: Coordinates) => ({
  latitude,
  longitude,
});

const formatQuotePayload = (pickupCoords: Coordinates, dropCoords: Coordinates) => ({
  pickup_details: {
    coordinates: formatGeoPayload(pickupCoords),
  },
  drop_details: {
    coordinates: formatGeoPayload(dropCoords),
  },
});

const formatCreatePayload = (order: CreatePorterOrderInput) => ({
  request_id: order.orderId,
  pickup_details: {
    address: order.pickupAddress,
    coordinates: formatGeoPayload(order.pickupCoords),
    contact: {
      name: order.pickupContactName,
      phone: order.pickupContactPhone,
    },
  },
  drop_details: {
    address: order.dropAddress,
    coordinates: formatGeoPayload(order.dropCoords),
    contact: {
      name: order.dropContactName,
      phone: order.dropContactPhone,
    },
  },
  manifest: {
    description: order.itemDescription,
    value: order.orderValue,
  },
});

const toPorterError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof AxiosError) {
    const message =
      asString(getNestedValue(error.response?.data, ['message', 'error.message', 'error']), '') ||
      error.message;
    return new Error(message || fallbackMessage);
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
};

// Payload paths are intentionally centralized here because Porter’s public UAT docs
// are not fully accessible from the tool right now. If your account-specific docs
// differ, update only this adapter.
export const getPorterQuote = async (
  pickupCoords: Coordinates,
  dropCoords: Coordinates
): Promise<PorterQuoteResponse> => {
  assertPorterConfigured();

  try {
    const response = await porterClient.post('/v1/orders/quote', formatQuotePayload(pickupCoords, dropCoords));
    const payload = response.data;

    return {
      estimatedFare: asNumber(
        getNestedValue(payload, [
          'data.estimated_fare',
          'data.fare',
          'estimated_fare',
          'fare',
        ])
      ),
      etaMinutes: asNumber(
        getNestedValue(payload, [
          'data.eta_minutes',
          'data.eta',
          'eta_minutes',
          'eta',
        ])
      ),
    };
  } catch (error) {
    throw toPorterError(error, 'Failed to fetch Porter quote');
  }
};

export const createPorterOrder = async (
  order: CreatePorterOrderInput
): Promise<CreatePorterOrderResponse> => {
  assertPorterConfigured();

  try {
    const response = await porterClient.post('/v1/orders/create', formatCreatePayload(order));
    const payload = response.data;

    return {
      porterOrderId: asString(
        getNestedValue(payload, [
          'data.order_id',
          'data.id',
          'order_id',
          'id',
        ]),
        order.orderId
      ),
      trackingUrl: asString(
        getNestedValue(payload, [
          'data.tracking_url',
          'data.tracking.link',
          'tracking_url',
        ])
      ),
      driverName: asString(
        getNestedValue(payload, [
          'data.driver.name',
          'data.partner.name',
          'driver.name',
          'partner.name',
        ])
      ),
      driverPhone: asString(
        getNestedValue(payload, [
          'data.driver.phone',
          'data.partner.phone',
          'driver.phone',
          'partner.phone',
        ])
      ),
      etaMinutes: asNumber(
        getNestedValue(payload, [
          'data.eta_minutes',
          'data.eta',
          'eta_minutes',
          'eta',
        ])
      ),
    };
  } catch (error) {
    throw toPorterError(error, 'Failed to create Porter order');
  }
};
