import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/shared/EmptyState';
import { DeliveryMap } from '../../../components/shared/DeliveryMap';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { orderService } from '../../../features/cart/services/orderService';
import type { Order, OrderStatus } from '../../../types';
import { useToast } from '../../../utils/ToastContext';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

const deliveryStatusLabels: Record<Order['deliveryStatus'], string> = {
  pending: 'Pending',
  farmer_accepted: 'Rider assigned',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
};

export function FarmerOrders() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await orderService.getFarmerOrders(1, 50);
      setOrders(response?.data ?? []);
    } catch (error) {
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
    const intervalId = window.setInterval(fetchOrders, 30000);
    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  const getNextStatus = (order: Order) => {
    const currentIndex = statusFlow.indexOf(order.status);
    return currentIndex >= 0 && currentIndex < statusFlow.length - 1
      ? statusFlow[currentIndex + 1]
      : null;
  };

  const getPrimaryActionLabel = (order: Order) => {
    const nextStatus = getNextStatus(order);
    if (!nextStatus) return '';
    if (order.status === 'pending') return 'Accept Order';
    if (nextStatus === 'shipped') return 'Mark In Transit';
    if (nextStatus === 'delivered') return 'Mark Delivered';
    return t('farmer.orders.markAs', { status: nextStatus });
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const updatedOrder = await orderService.updateStatus(orderId, newStatus);

      if (newStatus === 'confirmed') {
        showToast('Order accepted! Simulated rider assigned.', 'success');
      } else {
        showToast(`Order status updated to ${newStatus}`, 'success');
      }

      await fetchOrders();
      setSelectedOrder(updatedOrder);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to update order status',
        'error'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading orders..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('farmer.orders.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('farmer.orders.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {status === 'all'
                ? t('farmer.orders.all')
                : status === 'pending'
                  ? t('farmer.orders.pending')
                  : status === 'confirmed'
                    ? t('farmer.orders.confirmed')
                    : status === 'shipped'
                      ? t('farmer.orders.shipped')
                      : status === 'delivered'
                        ? t('farmer.orders.delivered')
                        : t('farmer.orders.cancelled')}
              {status !== 'all' && (
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {orders.filter((order) => order.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const nextStatus = getNextStatus(order);

              return (
                <Card key={order.id} padding="md">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Order #{(order.id ?? order._id)?.toString().slice(-8) ?? 'N/A'}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {deliveryStatusLabels[order.deliveryStatus]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''} • Rs. {order.totalAmount.toLocaleString('en-IN')}
                      </p>
                      {(order.distanceKm || order.deliveryDistanceKm) && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Delivery: {order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`} •{' '}
                          {(order.distanceKm ?? order.deliveryDistanceKm)?.toFixed(1)} km
                        </p>
                      )}
                      {order.riderName && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          🛵 {order.riderName}
                          {order.riderPhone ? ` • ${order.riderPhone}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {order.status !== 'cancelled' && order.status !== 'delivered' && nextStatus && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, nextStatus)}
                          isLoading={isUpdating}
                        >
                          {getPrimaryActionLabel(order)}
                        </Button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        {t('farmer.orders.viewDetails')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={t('farmer.orders.noOrders')}
            description={
              filter === 'all'
                ? t('farmer.orders.noOrdersYet')
                : t('farmer.orders.noStatusOrders', { status: filter })
            }
          />
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card padding="lg" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Order #{(selectedOrder.id ?? selectedOrder._id)?.toString().slice(-8) ?? 'N/A'}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {deliveryStatusLabels[selectedOrder.deliveryStatus]}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('farmer.orders.items')}</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.productName} × {item.quantity} {item.unit}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Rs. {(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery tracking</h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      Distance: {(selectedOrder.distanceKm ?? selectedOrder.deliveryDistanceKm ?? 0).toFixed(1)} km
                    </p>
                    <p>Delivery fee: {selectedOrder.deliveryFee === 0 ? 'FREE' : `Rs. ${selectedOrder.deliveryFee}`}</p>
                    <p>Minimum order met: {selectedOrder.minimumOrderMet ? 'Yes' : 'No'}</p>
                    {selectedOrder.riderName && (
                      <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">🛵 Delivery Rider</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{selectedOrder.riderName}</p>
                        {selectedOrder.riderVehicle && (
                          <p className="text-sm">
                            {selectedOrder.riderVehicle}
                            {selectedOrder.riderVehicleNumber ? ` • ${selectedOrder.riderVehicleNumber}` : ''}
                          </p>
                        )}
                        {selectedOrder.riderRating !== undefined && (
                          <p className="text-xs text-yellow-500 font-medium">⭐ {selectedOrder.riderRating.toFixed(1)}</p>
                        )}
                        {selectedOrder.riderPhone && (
                          <a href={`tel:${selectedOrder.riderPhone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            📞 {selectedOrder.riderPhone}
                          </a>
                        )}
                      </div>
                    )}
                    {selectedOrder.estimatedDeliveryTime && (
                      <p>ETA: {new Date(selectedOrder.estimatedDeliveryTime).toLocaleString()}</p>
                    )}
                  </div>

                  {/* Delivery Route Map */}
                  {selectedOrder.farmerLocation?.coordinates && selectedOrder.customerLocation?.coordinates && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Route</p>
                      <DeliveryMap
                        farmerCoords={selectedOrder.farmerLocation.coordinates}
                        customerCoords={selectedOrder.customerLocation.coordinates}
                        distanceKm={selectedOrder.distanceKm ?? selectedOrder.deliveryDistanceKm}
                        farmerLabel={selectedOrder.farmerLocationLabel || 'Pickup location'}
                        customerLabel="Customer delivery address"
                        height="260px"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('farmer.orders.deliveryAddress')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {selectedOrder.deliveryAddress}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('farmer.orders.payment')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">
                    {selectedOrder.paymentMethod === 'cod' ? t('farmer.orders.cod') : selectedOrder.paymentMethod}
                  </p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>{t('farmer.orders.total')}</span>
                    <span>Rs. {selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && getNextStatus(selectedOrder) && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleUpdateStatus(selectedOrder.id, getNextStatus(selectedOrder)!)}
                      isLoading={isUpdating}
                    >
                      {getPrimaryActionLabel(selectedOrder)}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      {t('farmer.orders.cancelOrder')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
