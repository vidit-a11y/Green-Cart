import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/shared/EmptyState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useToast } from '../../../utils/ToastContext';
import { orderService } from '../../../features/cart/services/orderService';
import type { Order, OrderStatus } from '../../../types';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

export function FarmerOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    try {
      const response = await orderService.getFarmerOrders(1, 50);
      setOrders(response.data);
    } catch (error) {
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      await orderService.updateStatus(orderId, newStatus);
      showToast(`Order status updated to ${newStatus}`, 'success');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      showToast('Failed to update order status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter((o) => o.status === filter);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading orders..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track customer orders</p>
        </div>

        {/* Filter Tabs */}
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
              {status}
              {status !== 'all' && (
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {orders.filter((o) => o.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} padding="md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Order #{order.id.slice(-8)}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} • ₹{order.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <>
                        {statusFlow.indexOf(order.status) < statusFlow.length - 1 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1];
                              handleUpdateStatus(order.id, nextStatus);
                            }}
                            isLoading={isUpdating}
                          >
                            Mark as {statusFlow[statusFlow.indexOf(order.status) + 1]}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No orders found"
            description={
              filter === 'all'
                ? "You haven't received any orders yet."
                : `No ${filter} orders at the moment.`
            }
          />
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card padding="lg" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Order #{selectedOrder.id.slice(-8)}
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
                {/* Status */}
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Items</h3>
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
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Address</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {selectedOrder.deliveryAddress}
                  </p>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Payment</h3>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">
                    {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : selectedOrder.paymentMethod}
                  </p>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Actions */}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <div className="flex gap-3 pt-4">
                    {statusFlow.indexOf(selectedOrder.status) < statusFlow.length - 1 && (
                      <Button
                        onClick={() => {
                          const nextStatus = statusFlow[statusFlow.indexOf(selectedOrder.status) + 1];
                          handleUpdateStatus(selectedOrder.id, nextStatus);
                        }}
                        isLoading={isUpdating}
                      >
                        Mark as {statusFlow[statusFlow.indexOf(selectedOrder.status) + 1]}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Cancel Order
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
