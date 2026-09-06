import { Product } from '../models/Product.js';
import { User, type IGeoPoint, type IUser } from '../models/User.js';

export const MIN_ORDER_VALUE = 199;
export const MAX_DELIVERY_DISTANCE_METERS = 50000;

const DELIVERY_BANDS = [
  { maxDistance: 7500, deliveryFee: 0 },
  { maxDistance: 15000, deliveryFee: 50 },
  { maxDistance: 25000, deliveryFee: 50 },
  { maxDistance: 50000, deliveryFee: 50 },
] as const;

type Coordinates = [number, number];

export interface DeliveryQuoteItemInput {
  productId: string;
  quantity: number;
}

export interface DeliveryQuote {
  farmerId: string;
  farmerName: string;
  farmerLocation: string;
  farmerCoordinates: Coordinates;
  distanceKm: number;
  deliveryFee: number;
  subtotalAmount: number;
  totalAmount: number;
  minimumOrderMet: boolean;
  withinServiceArea: boolean;
}

export const toGeoPoint = (coordinates: Coordinates): IGeoPoint => ({
  type: 'Point',
  coordinates,
});

export const normalizeCoordinates = (value: unknown): Coordinates | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const coordinates = (value as { coordinates?: unknown }).coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [longitude, latitude] = coordinates.map(Number);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return [longitude, latitude];
};

const toRadians = (value: number) => (value * Math.PI) / 180;

export const calculateDistanceKm = (
  [customerLng, customerLat]: Coordinates,
  [farmerLng, farmerLat]: Coordinates
) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(farmerLat - customerLat);
  const deltaLng = toRadians(farmerLng - customerLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(customerLat)) *
      Math.cos(toRadians(farmerLat)) *
      Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const findFarmerInRange = async (
  farmerId: string,
  customerCoords: Coordinates,
  maxDistance: number
) => {
  return User.findOne({
    _id: farmerId,
    role: 'farmer',
    location: {
      $near: {
        $geometry: toGeoPoint(customerCoords),
        $maxDistance: maxDistance,
      },
    },
  });
};

const getLocationLabel = (farmer: IUser | null, productLocation?: string) =>
  productLocation || farmer?.address || 'Farmer location';

export const findFarmersNearCustomer = async (
  customerCoords: Coordinates,
  productId: string
) => {
  const product = await Product.findById(productId);
  if (!product || !product.isAvailable) {
    return null;
  }

  for (const band of DELIVERY_BANDS) {
    const farmer = await findFarmerInRange(product.farmerId, customerCoords, band.maxDistance);
    if (!farmer?.location?.coordinates) {
      continue;
    }

    const distanceKm = calculateDistanceKm(customerCoords, farmer.location.coordinates);
    return {
      farmer,
      product,
      distanceKm,
      deliveryFee: band.deliveryFee,
      farmerLocation: getLocationLabel(farmer, product.location),
    };
  }

  return null;
};

export const buildDeliveryQuote = async (
  customerCoords: Coordinates,
  items: DeliveryQuoteItemInput[]
): Promise<DeliveryQuote> => {
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== items.length) {
    throw new Error('One or more products not found');
  }

  const farmerIds = new Set(products.map((product) => product.farmerId));
  if (farmerIds.size !== 1) {
    throw new Error('Please place an order from one farmer at a time');
  }

  const subtotalAmount = items.reduce((sum, item) => {
    const product = products.find((entry) => entry._id?.toString() === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (!product.isAvailable) {
      throw new Error(`${product.name} is not available`);
    }
    return sum + product.price * item.quantity;
  }, 0);

  if (subtotalAmount < MIN_ORDER_VALUE) {
    throw new Error(`Minimum order value is Rs. ${MIN_ORDER_VALUE}`);
  }

  const nearbyFarmer = await findFarmersNearCustomer(customerCoords, items[0].productId);
  if (!nearbyFarmer || !nearbyFarmer.farmer.location?.coordinates) {
    throw new Error('Product not available in your area');
  }

  return {
    farmerId: nearbyFarmer.farmer._id!.toString(),
    farmerName: nearbyFarmer.product.farmerName || nearbyFarmer.farmer.name,
    farmerLocation: nearbyFarmer.farmerLocation,
    farmerCoordinates: nearbyFarmer.farmer.location.coordinates,
    distanceKm: Number(nearbyFarmer.distanceKm.toFixed(1)),
    deliveryFee: nearbyFarmer.deliveryFee,
    subtotalAmount,
    totalAmount: subtotalAmount + nearbyFarmer.deliveryFee,
    minimumOrderMet: subtotalAmount >= MIN_ORDER_VALUE,
    withinServiceArea: nearbyFarmer.distanceKm * 1000 <= MAX_DELIVERY_DISTANCE_METERS,
  };
};
