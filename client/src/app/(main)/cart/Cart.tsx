import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useCart } from '../../../features/cart/context/CartContext';
import { useToast } from '../../../utils/ToastContext';
import { locationService } from '../../../features/products/services/locationService';
import { useCustomerLocation } from '../../../hooks/useCustomerLocation';
import { ProductImage } from '../../../utils/productHelpers';

const MIN_ORDER_VALUE = 199;

export function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { showToast } = useToast();

  // ── Delivery fee resolution ────────────────────────────────────────────────
  const { coords } = useCustomerLocation();
  const [deliveryFee, setDeliveryFee]     = useState<number | null>(null);
  const [feeLoading, setFeeLoading]       = useState(false);

  useEffect(() => {
    if (!coords) return;
    setFeeLoading(true);
    locationService
      .getFarmersNear(coords.lat, coords.lng)
      .then((result) => setDeliveryFee(result ? result.deliveryFee : null))
      .catch(() => setDeliveryFee(null))
      .finally(() => setFeeLoading(false));
  }, [coords]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const subtotal      = totalPrice;
  const knownFee      = deliveryFee !== null;
  const displayFee    = knownFee ? deliveryFee : 0;   // 0 shown while resolving
  const grandTotal    = subtotal + displayFee;
  const belowMinimum  = subtotal < MIN_ORDER_VALUE;
  const amountNeeded  = MIN_ORDER_VALUE - subtotal;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (items.length === 0) {
      showToast(t('cart.empty'), 'warning');
      return;
    }
    if (belowMinimum) {
      showToast(`Minimum order value is ₹${MIN_ORDER_VALUE}`, 'warning');
      return;
    }
    navigate('/checkout');
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState
            title={t('cart.empty')}
            description={t('cart.emptyDesc')}
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            action={{
              label: t('cart.browseProducts'),
              onClick: () => navigate('/products'),
            }}
          />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 md:mb-10">
          {t('cart.shoppingTitle', { count: totalItems })}
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* ── Cart Items ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-2/3 space-y-4 md:space-y-6">
            {items.map((item) => (
              <Card key={item.product.id} padding="md" className="flex gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden">
                  <ProductImage
                    product={item.product}
                    className="w-full h-full object-cover rounded-lg"
                    fallbackSize="sm"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {t('cart.by')} {item.product.farmerName || t('cart.localFarmer')}
                  </p>
                  <p className="text-green-600 dark:text-green-400 font-semibold text-sm sm:text-base">
                    ₹{item.product.price.toLocaleString('en-IN')}/{item.product.unit}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 sm:px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 min-h-[36px] min-w-[30px] flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="px-2 sm:px-3 py-1 font-medium text-gray-900 dark:text-white min-w-[2rem] sm:min-w-[2.5rem] text-center text-sm sm:text-base">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 sm:px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 min-h-[36px] min-w-[30px] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-right mt-1 text-sm sm:text-base">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}


            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('cart.clearCart')}
              </button>
            </div>
          </div>

          {/* ── Order Summary ──────────────────────────────────────────── */}
          <div className="w-full lg:w-1/3">
            <Card padding="lg" className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('cart.orderSummary')}
              </h2>

              {/* ── Line items ─────────────────────────────────────────── */}
              <div className="space-y-3 mb-6">

                {/* Subtotal */}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.subtotal', { count: totalItems })}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Delivery */}
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>{t('cart.deliveryFee')}</span>
                  {feeLoading ? (
                    <span className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Checking…
                    </span>
                  ) : knownFee ? (
                    deliveryFee === 0 ? (
                      <span className="font-semibold text-green-600 dark:text-green-400">FREE</span>
                    ) : (
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        ₹{deliveryFee}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Set at checkout
                    </span>
                  )}
                </div>

                {/* Helper text when fee is resolved */}
                {knownFee && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    {deliveryFee === 0
                      ? '🎉 You qualify for free delivery (within 7.5 km)'
                      : '📍 Farmer is 7.5–50 km away — ₹50 flat delivery applies'}
                  </p>
                )}

                {/* Divider + Grand Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-1">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>{t('cart.total')}</span>
                    <span>
                      ₹{(knownFee ? grandTotal : subtotal).toLocaleString('en-IN')}
                      {!knownFee && (
                        <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
                          + delivery
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('cart.taxNote')}
                  </p>
                </div>
              </div>

              {/* ── Minimum order warning bar ──────────────────────────── */}
              {belowMinimum && (
                <div
                  id="min-order-warning"
                  className="mb-4 flex items-start gap-2 px-3 py-3 rounded-xl
                    bg-amber-50 dark:bg-amber-900/20
                    border border-amber-200 dark:border-amber-700
                    text-sm text-amber-800 dark:text-amber-200"
                >
                  <span className="text-base shrink-0">🛒</span>
                  <span>
                    Add{' '}
                    <strong className="font-bold">₹{amountNeeded.toFixed(0)}</strong>{' '}
                    more to meet the minimum order requirement (₹{MIN_ORDER_VALUE})
                  </span>
                </div>
              )}

              {/* ── Checkout button ────────────────────────────────────── */}
              <Button
                id="proceed-to-checkout-btn"
                fullWidth
                size="lg"
                onClick={handleCheckout}
                disabled={belowMinimum}
                className={belowMinimum ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {t('cart.checkout')}
              </Button>

              <div className="mt-4 text-center">
                <Link
                  to="/products"
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700"
                >
                  {t('cart.continueShopping')}
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
