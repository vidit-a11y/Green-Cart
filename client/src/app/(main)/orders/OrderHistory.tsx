import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
}

interface Order {
  _id: string;
  id: string;
  farmerName?: string;
  items: OrderItem[];
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryStatus: string;
  status: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

/* ─────────────────────────────────────────────────────────
   PDF Bill Download (jspdf, loaded lazily)
───────────────────────────────────────────────────────── */
const downloadBill = async (order: Order) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // ── Header ──────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74);
  doc.text('GreenCart', 20, 22);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Farm to Home — Fresh Indian Produce', 20, 30);

  // ── Order Info ──────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(0);
  const shortId = (order._id || order.id || '').slice(-8).toUpperCase();
  doc.text(`Order ID: #${shortId}`, 20, 46);
  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    20,
    54
  );
  if (order.farmerName) doc.text(`Farmer: ${order.farmerName}`, 20, 62);

  // divider
  doc.setDrawColor(200);
  doc.line(20, 70, 190, 70);

  // ── Items Table Header ───────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(60);
  doc.text('Item', 20, 80);
  doc.text('Qty', 118, 80);
  doc.text('Rate', 145, 80);
  doc.text('Total', 172, 80);
  doc.line(20, 84, 190, 84);

  let y = 93;
  order.items.forEach((item) => {
    doc.setFontSize(10);
    doc.setTextColor(0);
    const name = item.productName || 'Product';
    doc.text(name.length > 35 ? name.slice(0, 33) + '…' : name, 20, y);
    doc.text(`${item.quantity} ${item.unit}`, 118, y);
    doc.text(`₹${item.price}`, 145, y);
    doc.text(`₹${item.price * item.quantity}`, 172, y);
    y += 10;
  });

  doc.setDrawColor(180);
  doc.line(20, y, 190, y);
  y += 8;

  // ── Totals ───────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('Subtotal:', 128, y);
  doc.text(`₹${order.subtotalAmount ?? order.totalAmount - (order.deliveryFee ?? 0)}`, 172, y);
  y += 8;

  doc.text('Delivery:', 128, y);
  doc.text(
    order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`,
    172,
    y
  );
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Total:', 128, y);
  doc.text(`₹${order.totalAmount}`, 172, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(
    `Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Paid)'}`,
    128,
    y
  );
  y += 8;
  doc.text(
    `Status: ${order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}`,
    128,
    y
  );

  // ── Delivery Address ─────────────────────────────────────
  y += 16;
  doc.setTextColor(60);
  doc.setFontSize(10);
  doc.text('Delivered to:', 20, y);
  y += 7;
  doc.setTextColor(0);
  const addrLines = (order.deliveryAddress || '').split('\n');
  addrLines.forEach((line) => {
    doc.text(line, 20, y);
    y += 7;
  });

  // ── Footer ───────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Thank you for supporting Indian farmers! 🌾', 20, 278);
  doc.text('GreenCart — Farm to Home | greencart.in', 20, 284);

  doc.save(`GreenCart-Order-${shortId}.pdf`);
};

/* ─────────────────────────────────────────────────────────
   Status helpers
───────────────────────────────────────────────────────── */
const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    pending: '🕐 Pending',
    farmer_accepted: '✅ Accepted',
    picked_up: '📦 Picked Up',
    in_transit: '🚚 In Transit',
    delivered: '✅ Delivered',
    cancelled: '❌ Cancelled',
  };
  return map[s] ?? s;
};


const statusColors = (s: string) => {
  if (s === 'delivered') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (s === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
};

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
export function OrderHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/my-orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success !== false) {
          setOrders(Array.isArray(data) ? data : data.data ?? []);
        } else {
          setError(data.message || 'Failed to load orders');
        }
      } catch {
        setError('Could not connect to server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (isLoading) return <LoadingSpinner fullScreen text="Loading your orders…" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📦 My Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hello {user?.name?.split(' ')[0]}! Here are all your past orders.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {orders.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No orders yet</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Start shopping fresh produce directly from farmers!
            </p>
            <button
              onClick={() => navigate('/products')}
              className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
            >
              Browse Products
            </button>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => {
            const orderId = order._id || order.id;
            const shortId = orderId.slice(-8).toUpperCase();
            const firstItem = order.items[0];
            const extraCount = order.items.length - 1;
            const isDelivered = order.deliveryStatus === 'delivered';

            return (
              <div
                key={orderId}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* ─── Order Header ─── */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Product thumbnail placeholder */}
                      <div className="w-14 h-14 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-2xl shrink-0 border border-green-100 dark:border-green-800">
                        🌾
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {firstItem?.productName ?? 'Order'}
                          {extraCount > 0 && (
                            <span className="text-gray-500 dark:text-gray-400 font-normal">
                              {' '}+{extraCount} more
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {order.farmerName ? `from ${order.farmerName}` : 'GreenCart Order'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          #{shortId}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors(order.deliveryStatus)}`}
                    >
                      {statusLabel(order.deliveryStatus)}
                    </span>
                  </div>
                </div>

                {/* ─── Order Details ─── */}
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span>
                      📅{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="space-y-1 mb-4">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity}× {item.productName} ({item.unit}) —{' '}
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </p>
                    ))}
                  </div>

                  {/* Delivery fee row */}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Delivery: {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`} •{' '}
                    Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
                    {order.paymentStatus === 'paid' && (
                      <span className="ml-1 text-green-600 dark:text-green-400 font-medium">✓ Paid</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {!isDelivered && (
                      <button
                        onClick={() => navigate(`/orders/${orderId}/track`)}
                        className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        🗺️ Track Order
                      </button>
                    )}

                    <button
                      onClick={() => downloadBill(order)}
                      className="flex-1 min-w-[100px] border border-green-500 text-green-600 dark:text-green-400 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      🧾 Bill PDF
                    </button>

                    {isDelivered && (
                      <button
                        onClick={() => navigate('/products')}
                        className="flex-1 min-w-[100px] border border-orange-300 text-orange-600 dark:text-orange-400 dark:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        🔄 Shop Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
