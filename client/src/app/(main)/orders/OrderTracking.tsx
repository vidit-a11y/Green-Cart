import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import MapplsMap from '../../../components/shared/MapplsMap';
import { orderService } from '../../../features/cart/services/orderService';
import type { Order } from '../../../types';

export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const data = await orderService.getById(orderId);
        setOrder(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch order', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading order tracking...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4">{error || 'Order not found'}</div>
        <Link to="/orders" className="text-green-600 hover:underline">
          Go back to Orders
        </Link>
      </div>
    );
  }

  const { deliveryStatus, items } = order;

  // Status mappings
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Waiting for farmer to accept your order...';
      case 'farmer_accepted': return '🌾 Farmer is preparing your fresh order!';
      case 'porter_assigned': return '🛵 Delivery partner assigned! Heading to farmer';
      case 'picked_up': return '📦 Order picked up! On the way to you';
      case 'in_transit': return `🛵 Almost there! ~${order.estimatedDeliveryTime || '15'} minutes away`;
      case 'delivered': return '🎉 Delivered! Enjoy your fresh produce';
      default: return '⏳ Processing order...';
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'farmer_accepted': return 1;
      case 'porter_assigned': return 1;
      case 'picked_up': return 2;
      case 'in_transit': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const stepIndex = getStepIndex(deliveryStatus || 'pending');

  const farmerLat = order.farmerLocation?.coordinates?.[1];
  const farmerLng = order.farmerLocation?.coordinates?.[0];
  const customerLat = order.customerLocation?.coordinates?.[1];
  const customerLng = order.customerLocation?.coordinates?.[0];

  const hasLocations = farmerLat && farmerLng && customerLat && customerLng;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Order Header */}
        <Card padding="lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Order #{order.id || order._id?.slice(-6).toUpperCase()}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {items.length} item(s) • ₹{order.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {items.map(i => `${i.productName} (${i.quantity}${i.unit})`).join(', ')}
          </div>
        </Card>

        {/* Progress Stepper */}
        <Card padding="lg">
          <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
              <div
                style={{ width: `${(stepIndex / 3) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
              ></div>
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className={stepIndex >= 0 ? 'text-green-600 dark:text-green-400' : ''}>✅ Confirmed</div>
              <div className={stepIndex >= 1 ? 'text-green-600 dark:text-green-400' : ''}>🌾 Preparing</div>
              <div className={stepIndex >= 2 ? 'text-green-600 dark:text-green-400' : ''}>🛵 Picked Up</div>
              <div className={stepIndex >= 3 ? 'text-green-600 dark:text-green-400' : ''}>🏠 Delivered</div>
            </div>
          </div>
        </Card>

        {/* Status Message */}
        <Card padding="lg" variant="nature">
          <div className="text-center py-4">
            <p className="text-xl font-medium text-gray-900 dark:text-white">
              {getStatusMessage(deliveryStatus || 'pending')}
            </p>
          </div>
        </Card>

        {/* Delivery Partner Card */}
        {(deliveryStatus === 'porter_assigned' || deliveryStatus === 'picked_up' || deliveryStatus === 'in_transit') && (
          <Card padding="md" className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-2xl">
                  🛵
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {order.deliveryPartnerName || 'Delivery Partner'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Arriving in ~{order.estimatedDeliveryTime || '25'} minutes
                  </p>
                </div>
              </div>
              {order.deliveryPartnerPhone && (
                <a
                  href={`tel:${order.deliveryPartnerPhone}`}
                  className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                >
                  📞 Call
                </a>
              )}
            </div>
          </Card>
        )}

        {/* Map */}
        {hasLocations && (
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Live Tracking</h3>
            </div>
            <MapplsMap
              farmerCoords={{ lat: farmerLat, lng: farmerLng }}
              customerCoords={{ lat: customerLat, lng: customerLng }}
              farmerName={order.farmerName || 'Farmer'}
              height="280px"
              className="rounded-none"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
