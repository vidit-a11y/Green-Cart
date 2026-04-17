import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input, Select } from '../../../components/ui/Input';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useCart } from '../../../features/cart/context/CartContext';
import { useToast } from '../../../utils/ToastContext';
import { orderService } from '../../../features/cart/services/orderService';

const paymentMethods = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'upi', label: 'UPI' },
];

export function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'card',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deliveryFee = totalPrice > 500 ? 0 : 50;
  const finalTotal = totalPrice + deliveryFee;

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Delivery address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const deliveryAddress = `${formData.fullName}\n${formData.address}\n${formData.city}, ${formData.state} ${formData.zipCode}\nPhone: ${formData.phone}`;

      await orderService.create({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        paymentMethod: formData.paymentMethod,
      });

      showToast('Order placed successfully!', 'success');
      clearCart();
      navigate('/orders');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to place order',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Information */}
              <Card padding="lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Delivery Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    required
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    required
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label="Street Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required
                  />
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    error={errors.zipCode}
                    required
                  />
                </div>
              </Card>

              {/* Payment Method */}
              <Card padding="lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Payment Method
                </h2>
                <Select
                  label="Select Payment Method"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  options={paymentMethods}
                  required
                />

                {formData.paymentMethod === 'card' && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Card payment integration would be implemented here with a secure payment gateway like Stripe.
                    </p>
                  </div>
                )}

                {formData.paymentMethod === 'cod' && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      You will pay ₹{finalTotal.toLocaleString('en-IN')} when your order is delivered.
                    </p>
                  </div>
                )}
              </Card>

              {/* Mobile Order Button */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                >
                  Place Order - ₹{finalTotal.toLocaleString('en-IN')}
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.product.name}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ₹{(item.quantity * item.product.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toLocaleString('en-IN')}`}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Desktop Order Button */}
              <div className="hidden lg:block mt-6">
                <Button
                  type="submit"
                  form="checkout-form"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  onClick={handleSubmit}
                >
                  Place Order
                </Button>
              </div>

              <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                By placing this order, you agree to our Terms of Service
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
