import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/shared/EmptyState';
import { useCart } from '../../../features/cart/context/CartContext';
import { useToast } from '../../../utils/ToastContext';

export function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { showToast } = useToast();

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast(t('cart.empty'), 'warning');
      return;
    }
    navigate('/checkout');
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('cart.shoppingTitle', { count: totalItems })}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.product.id} padding="md" className="flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-3xl">🥬</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {t('cart.by')} {item.product.farmerName || t('cart.localFarmer')}
                  </p>
                  <p className="text-green-600 dark:text-green-400 font-semibold">
                    ₹{item.product.price.toLocaleString('en-IN')}/{item.product.unit}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-medium text-gray-900 dark:text-white min-w-[2.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="text-right min-w-[80px]">
                  <p className="font-bold text-gray-900 dark:text-white">
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </Card>
            ))}

            {/* Clear Cart */}
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

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('cart.orderSummary')}
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.subtotal', { count: totalItems })}</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('cart.deliveryFee')}</span>
                  <span>{totalPrice > 500 ? t('cart.free') : '₹50'}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>{t('cart.total')}</span>
                    <span>₹{(totalPrice + (totalPrice > 500 ? 0 : 50)).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('cart.taxNote')}
                  </p>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleCheckout}
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

              {/* Free Delivery Progress */}
              {totalPrice < 500 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                    {t('cart.addMoreForFreeDelivery', { amount: (500 - totalPrice).toLocaleString('en-IN') })}
                  </p>
                  <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(totalPrice / 500) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

