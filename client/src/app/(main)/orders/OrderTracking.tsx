import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MapplsMap from '../../../components/shared/MapplsMap';
import { Card } from '../../../components/ui/Card';
import { orderService, type RiderInfo } from '../../../features/cart/services/orderService';
import type { Order } from '../../../types';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: 'pending',         label: 'Order Placed',   icon: '🕐' },
  { key: 'farmer_accepted', label: 'Farmer Accepted', icon: '🌾' },
  { key: 'picked_up',       label: 'Picked Up',       icon: '📦' },
  { key: 'in_transit',      label: 'In Transit',      icon: '🛵' },
  { key: 'delivered',       label: 'Delivered',        icon: '🏠' },
];

const STEP_INDEX: Record<string, number> = {
  pending:         0,
  farmer_accepted: 1,
  picked_up:       2,
  in_transit:      3,
  delivered:       4,
};

const STATUS_MESSAGE: Record<string, string> = {
  pending:         '⏳ Waiting for farmer to accept your order…',
  farmer_accepted: '🌾 Farmer has accepted! Rider is being assigned…',
  picked_up:       '📦 Order picked up! Rider is on the way to you.',
  in_transit:      '🛵 Almost there! Your delivery is close.',
  delivered:       '🎉 Delivered! Enjoy your fresh produce.',
};

function formatETA(iso?: string): string {
  if (!iso) return '';
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder]           = useState<Order | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Rider live tracking state
  const [riderCoords, setRiderCoords]   = useState<{ lat: number; lng: number } | undefined>();
  const [riderInfo, setRiderInfo]       = useState<RiderInfo | undefined>();
  const [liveStatus, setLiveStatus]     = useState<Order['deliveryStatus'] | undefined>();
  const [riderETA, setRiderETA]         = useState<string | undefined>();
  const [riderProgress, setRiderProgress] = useState<number>(0);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch order once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const data = await orderService.getById(orderId);
        if (!cancelled) {
          setOrder(data);
          setLiveStatus(data.deliveryStatus);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch order', err);
        if (!cancelled) setError('Failed to load order details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  // ── Rider location polling ────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId || !order) return;

    // Only poll when a rider has been assigned and delivery is not yet complete
    const shouldPoll =
      order.assignedRider &&
      order.deliveryStatus !== 'delivered';

    if (!shouldPoll) return;

    const pollRiderLocation = async () => {
      try {
        const data = await orderService.getRiderLocation(orderId);

        if (!data.success) return;

        // [longitude, latitude] → { lat, lng }
        const [lng, lat] = data.coordinates;
        setRiderCoords({ lat, lng });
        setRiderInfo(data.rider);
        setLiveStatus(data.deliveryStatus);
        setRiderETA(data.estimatedDeliveryTime);
        setRiderProgress(data.progress);

        // Stop polling when delivered
        if (data.deliveryStatus === 'delivered' && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        // Non-fatal: silently ignore transient network errors
        console.warn('Rider location poll failed:', err);
      }
    };

    // Fetch immediately, then every 3 s
    pollRiderLocation();
    pollingRef.current = setInterval(pollRiderLocation, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [orderId, order?.assignedRider, order?.deliveryStatus]);

  // ── Render: loading / error ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">🗺️</div>
          <p className="text-gray-500 dark:text-gray-400">Loading order tracking…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 gap-4">
        <div className="text-red-500">{error || 'Order not found'}</div>
        <Link to="/orders" className="text-green-600 hover:underline">← Back to Orders</Link>
      </div>
    );
  }

  const deliveryStatus = liveStatus ?? order.deliveryStatus ?? 'pending';
  const stepIndex = STEP_INDEX[deliveryStatus] ?? 0;
  const progressPct = (stepIndex / (STATUS_STEPS.length - 1)) * 100;

  const farmerLat  = order.farmerLocation?.coordinates?.[1];
  const farmerLng  = order.farmerLocation?.coordinates?.[0];
  const customerLat = order.customerLocation?.coordinates?.[1];
  const customerLng = order.customerLocation?.coordinates?.[0];
  const hasLocations = farmerLat && farmerLng && customerLat && customerLng;

  const rider = riderInfo;
  const hasRider = !!(rider?.name || order.riderName);
  const riderName  = rider?.name  ?? order.riderName;
  const riderPhone = rider?.phone ?? order.riderPhone;
  const riderVehicle = rider?.vehicle ?? order.riderVehicle;
  const riderVehicleNumber = rider?.vehicleNumber ?? order.riderVehicleNumber;
  const riderRating = rider?.rating ?? order.riderRating;
  const eta = riderETA ?? order.estimatedDeliveryTime;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

        {/* ── Order Header ───────────────────────────────────────────────── */}
        <Card padding="lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Order #{order.id || order._id?.slice(-6).toUpperCase()}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {order.items.length} item(s) • ₹{order.totalAmount.toLocaleString('en-IN')}
                {order.farmerName && ` • from ${order.farmerName}`}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              {order.status.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {order.items.map(i => `${i.productName} (${i.quantity} ${i.unit})`).join(' • ')}
          </div>
        </Card>

        {/* ── 5-step Progress Stepper ─────────────────────────────────────── */}
        <Card padding="lg">
          {/* Progress bar */}
          <div className="overflow-hidden h-2 mb-6 rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full rounded-full bg-green-500 transition-all duration-700 ease-in-out"
            />
          </div>

          {/* Steps */}
          <div className="flex justify-between">
            {STATUS_STEPS.map((step, i) => {
              const isActive   = i === stepIndex;
              const isComplete = i < stepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-2 ring-green-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isComplete ? '✓' : step.icon}
                  </div>
                  <span
                    className={`text-center text-[10px] sm:text-xs font-medium leading-tight ${
                      isActive   ? 'text-green-600 dark:text-green-400' :
                      isComplete ? 'text-gray-600 dark:text-gray-400'  :
                                   'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Status Message ──────────────────────────────────────────────── */}
        <Card padding="lg" variant="nature">
          <p className="text-center text-lg font-medium text-gray-900 dark:text-white py-2">
            {STATUS_MESSAGE[deliveryStatus] ?? STATUS_MESSAGE['pending']}
          </p>
          {eta && deliveryStatus !== 'delivered' && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              Estimated delivery by <strong>{formatETA(eta)}</strong>
            </p>
          )}
          {riderProgress > 0 && deliveryStatus !== 'delivered' && (
            <div className="mt-3 mx-auto max-w-xs">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>🌾 Farmer</span>
                <span>{Math.round(riderProgress * 100)}%</span>
                <span>🏠 You</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  style={{ width: `${riderProgress * 100}%` }}
                  className="h-full rounded-full bg-orange-400 transition-all duration-500"
                />
              </div>
            </div>
          )}
        </Card>

        {/* ── Rider Info Card ─────────────────────────────────────────────── */}
        {hasRider && deliveryStatus !== 'pending' && (
          <Card padding="md" className="border-l-4 border-l-orange-400">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-3">
              🛵 Delivery Partner
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-2xl shrink-0">
                  🛵
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{riderName}</p>
                  {riderVehicle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {riderVehicle}
                      {riderVehicleNumber && ` • ${riderVehicleNumber}`}
                    </p>
                  )}
                  {riderRating !== undefined && (
                    <p className="text-xs text-yellow-500 font-medium mt-0.5">
                      ⭐ {riderRating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
              {riderPhone && (
                <a
                  href={`tel:${riderPhone}`}
                  className="shrink-0 px-4 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl font-medium text-sm hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                >
                  📞 Call
                </a>
              )}
            </div>
          </Card>
        )}

        {/* ── Live Tracking Map ───────────────────────────────────────────── */}
        {hasLocations && (
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Live Tracking
              </h3>
              {hasRider && deliveryStatus !== 'delivered' && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <MapplsMap
              farmerCoords={{ lat: farmerLat!, lng: farmerLng! }}
              customerCoords={{ lat: customerLat!, lng: customerLng! }}
              riderCoords={riderCoords}
              farmerName={order.farmerName || 'Farmer'}
              distanceKm={order.distanceKm ?? order.deliveryDistanceKm}
              height="320px"
              className="rounded-none"
            />
          </Card>
        )}

        {/* ── Back link ───────────────────────────────────────────────────── */}
        <div className="text-center pb-4">
          <Link
            to="/orders"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            ← Back to My Orders
          </Link>
        </div>

      </div>
    </div>
  );
}
