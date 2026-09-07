import { Order } from '../models/Order.js';

interface SimulatedRider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleNumber: string;
  rating: number;
  photo: string;
}

export enum DeliveryStatus {
  FarmerAccepted = 'farmer_accepted',
  PickedUp = 'picked_up',
  InTransit = 'in_transit',
  Delivered = 'delivered',
}

interface GeoPoint {
  coordinates: [number, number]; // [longitude, latitude]
}

interface SimulatableOrder {
  distanceKm?: number;
  deliveryDistanceKm?: number;
  farmerLocation?: GeoPoint;
  customerLocation?: GeoPoint;

  assignedRider?: string;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  riderVehicleNumber?: string;
  riderRating?: number;
  riderPhoto?: string;

  simulationStartTime?: Date;
  estimatedMinutes?: number;
  estimatedDeliveryTime?: Date;
  deliveryStatus?: DeliveryStatus | string;

  save: () => Promise<unknown>;
}

interface RiderLocationResult {
  coordinates: [number, number];
  progress: number;
  deliveryStatus: DeliveryStatus | string;
  rider: {
    id?: string;
    name?: string;
    phone?: string;
    vehicle?: string;
    vehicleNumber?: string;
    rating?: number;
    photo?: string;
  };
  estimatedDeliveryTime?: Date;
}

const SIMULATION_CONFIG = {
  averageSpeedKmh: 20,
  minEstimatedMinutes: 5,
  fallbackDistanceKm: 5,
  fallbackEstimatedMinutes: 30,

  pickedUpAt: 0.05,
  inTransitAt: 0.65,
} as const;

export const SIMULATED_RIDERS: SimulatedRider[] = [
  {
    id: 'rider-001',
    name: 'Amit Sharma',
    phone: '+91 98765 43210',
    vehicle: 'Honda Activa',
    vehicleNumber: 'DL 01 AB 1234',
    rating: 4.8,
    photo: '',
  },
  {
    id: 'rider-002',
    name: 'Rahul Kumar',
    phone: '+91 98765 12345',
    vehicle: 'TVS Jupiter',
    vehicleNumber: 'DL 02 CD 5678',
    rating: 4.7,
    photo: '',
  },
  {
    id: 'rider-003',
    name: 'Vikas Singh',
    phone: '+91 99887 66554',
    vehicle: 'Hero Splendor',
    vehicleNumber: 'DL 03 EF 9012',
    rating: 4.9,
    photo: '',
  },
];

function haversineDistanceKm(start: [number, number], end: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lon1, lat1] = start;
  const [lon2, lat2] = end;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveDistanceKm(order: SimulatableOrder): number {
  if (typeof order.distanceKm === 'number') return order.distanceKm;
  if (typeof order.deliveryDistanceKm === 'number') return order.deliveryDistanceKm;

  const start = order.farmerLocation?.coordinates;
  const end = order.customerLocation?.coordinates;
  if (start && end) return haversineDistanceKm(start, end);

  return SIMULATION_CONFIG.fallbackDistanceKm;
}

function pickRandomRider(): SimulatedRider {
  const index = Math.floor(Math.random() * SIMULATED_RIDERS.length);
  return SIMULATED_RIDERS[index];
}

function statusForProgress(progress: number): DeliveryStatus {
  if (progress >= 1) return DeliveryStatus.Delivered;
  if (progress >= SIMULATION_CONFIG.inTransitAt) return DeliveryStatus.InTransit;
  if (progress >= SIMULATION_CONFIG.pickedUpAt) return DeliveryStatus.PickedUp;
  return DeliveryStatus.FarmerAccepted;
}


export const assignSimulatedRider = async (
  order: SimulatableOrder
): Promise<SimulatableOrder> => {
  const rider = pickRandomRider();
  const distanceKm = resolveDistanceKm(order);

  const estimatedMinutes = Math.max(
    SIMULATION_CONFIG.minEstimatedMinutes,
    Math.ceil((distanceKm / SIMULATION_CONFIG.averageSpeedKmh) * 60)
  );

  const simulationStartTime = new Date();

  order.assignedRider = rider.id;
  order.riderName = rider.name;
  order.riderPhone = rider.phone;
  order.riderVehicle = rider.vehicle;
  order.riderVehicleNumber = rider.vehicleNumber;
  order.riderRating = rider.rating;
  order.riderPhoto = rider.photo;
  order.simulationStartTime = simulationStartTime;
  order.estimatedMinutes = estimatedMinutes;
  order.estimatedDeliveryTime = new Date(
    simulationStartTime.getTime() + estimatedMinutes * 60 * 1000
  );
  order.deliveryStatus = DeliveryStatus.FarmerAccepted;

  try {
    await order.save();
  } catch (err) {
    throw new Error(
      `Failed to persist simulated rider assignment: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  return order;
};

export const getSimulatedRiderLocation = async (
  order: SimulatableOrder,
  options: { persist?: boolean } = {}
): Promise<RiderLocationResult> => {
  const start = order.farmerLocation?.coordinates;
  const end = order.customerLocation?.coordinates;

  if (!start || !end) {
    throw new Error('Delivery locations are missing');
  }

  const startTime = order.simulationStartTime
    ? new Date(order.simulationStartTime).getTime()
    : Date.now();

  const estimatedMinutes =
    order.estimatedMinutes ?? SIMULATION_CONFIG.fallbackEstimatedMinutes;

  const elapsedMinutes = Math.max(0, (Date.now() - startTime) / 60000);
  const progress = Math.min(1, elapsedMinutes / estimatedMinutes);

  const longitude = start[0] + (end[0] - start[0]) * progress;
  const latitude = start[1] + (end[1] - start[1]) * progress;

  const deliveryStatus = statusForProgress(progress);

  if (options.persist && deliveryStatus !== order.deliveryStatus) {
    order.deliveryStatus = deliveryStatus;
    try {
      await order.save();
    } catch (err) {

      console.error('Failed to persist simulated delivery status:', err);
    }
  }

  return {
    coordinates: [longitude, latitude],
    progress,
    deliveryStatus,
    rider: {
      id: order.assignedRider,
      name: order.riderName,
      phone: order.riderPhone,
      vehicle: order.riderVehicle,
      vehicleNumber: order.riderVehicleNumber,
      rating: order.riderRating,
      photo: order.riderPhoto,
    },
    estimatedDeliveryTime: order.estimatedDeliveryTime,
  };
};