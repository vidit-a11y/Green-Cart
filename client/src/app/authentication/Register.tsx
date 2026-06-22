import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useAuth } from '../../features/auth/context/AuthContext';
import type { GeoPoint, UserRole } from '../../types';
import { useToast } from '../../utils/ToastContext';
import { GoogleLocationPicker } from '../../components/shared/GoogleLocationPicker';

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'consumer' as UserRole,
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [geoError, setGeoError] = useState('');
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [locationSet, setLocationSet] = useState(false);

  const [farmerPayment, setFarmerPayment] = useState({
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: '',
    aadhaarNumber: '',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('auth.register.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('auth.register.nameMin');
    }
    if (!formData.email) {
      newErrors.email = t('auth.register.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.register.emailInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('auth.register.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.register.passwordMin');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.register.passwordMismatch');
    }
    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = t('auth.register.phoneInvalid');
    }
    if (formData.role === 'farmer' && (!location || !location.coordinates || location.coordinates.length !== 2)) {
      newErrors.location = 'Please set your farm location to continue';
      setGeoError('Please set your farm location to continue');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setGeoError('');
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.phone || undefined,
        formData.address || undefined,
        formData.role === 'farmer' ? location || undefined : undefined,
      );
      showToast(t('auth.register.success'), 'success');
      navigate('/');
    } catch (error) {
      if (error instanceof Error && formData.role === 'farmer') {
        setGeoError(error.message);
      }
      showToast(
        error instanceof Error ? error.message : t('auth.register.failed'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (name === 'role' && value !== 'farmer') {
      setLocation(null);
      setLocationSet(false);
      setGeoError('');
    }
  };

  const handleFarmerPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFarmerPayment((prev) => ({ ...prev, [name]: value }));
  };

  // Called by GoogleLocationPicker with [lng, lat]
  const handleLocationConfirm = (coords: [number, number]) => {
    setLocation({ type: 'Point', coordinates: coords });
    setLocationSet(true);
    setGeoError('');
  };

  const roleOptions = [
    { value: 'consumer', label: t('auth.register.consumerRole') },
    { value: 'farmer', label: t('auth.register.farmerRole') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('auth.register.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('auth.register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('auth.register.name')}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('auth.register.namePlaceholder')}
              error={errors.name}
              required
            />

            <Input
              label={t('auth.register.email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.register.emailPlaceholder')}
              error={errors.email}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('auth.register.password')}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('auth.register.passwordPlaceholder')}
                error={errors.password}
                required
              />
              <Input
                label={t('auth.register.confirmPassword')}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                error={errors.confirmPassword}
                required
              />
            </div>

            <Select
              label={t('auth.register.role')}
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              required
            />

            <Input
              label={t('auth.register.phone')}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('auth.register.phonePlaceholder')}
              error={errors.phone}
            />

            <Input
              label={t('auth.register.address')}
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t('auth.register.addressPlaceholder')}
            />

            {formData.role === 'farmer' && (
              <>
                {/* Farm Location */}
                <div className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
                  <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">📍 Farm Location (Required)</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    This helps customers find you for delivery
                  </p>

                  {!locationSet ? (
                    <GoogleLocationPicker
                      onConfirm={handleLocationConfirm}
                      height="220px"
                    />
                  ) : (
                    <div className="flex items-center justify-between gap-2 text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-300 dark:border-green-700">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <div>
                          <p className="font-medium">Location confirmed!</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {location?.coordinates[1].toFixed(4)}°N, {location?.coordinates[0].toFixed(4)}°E
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setLocationSet(false); setLocation(null); }}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {geoError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{geoError}</p>
                  )}
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.location}</p>
                  )}
                </div>

                {/* Payment Details for Receiving Payments */}
                <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">💰 Payment Details</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    For receiving payments from customer orders (optional but recommended)
                  </p>

                  <div className="space-y-3">
                    <input
                      name="upiId"
                      placeholder="UPI ID (e.g. yourname@upi)"
                      value={farmerPayment.upiId}
                      onChange={handleFarmerPaymentChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        name="accountNumber"
                        placeholder="Account Number"
                        value={farmerPayment.accountNumber}
                        onChange={handleFarmerPaymentChange}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        name="ifscCode"
                        placeholder="IFSC Code"
                        value={farmerPayment.ifscCode}
                        onChange={handleFarmerPaymentChange}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <input
                      name="accountHolderName"
                      placeholder="Account Holder Name"
                      value={farmerPayment.accountHolderName}
                      onChange={handleFarmerPaymentChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />

                    <input
                      name="bankName"
                      placeholder="Bank Name (e.g. SBI, HDFC)"
                      value={farmerPayment.bankName}
                      onChange={handleFarmerPaymentChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />

                    <input
                      name="aadhaarNumber"
                      placeholder="Aadhaar Number (for verification)"
                      maxLength={12}
                      value={farmerPayment.aadhaarNumber}
                      onChange={handleFarmerPaymentChange}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      🔒 Your payment details are encrypted and secure.
                      Payments will be transferred within 24 hours of delivery.
                    </p>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              {t('auth.register.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" className="text-green-600 dark:text-green-400 font-medium hover:text-green-700">
                {t('auth.register.signIn')}
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {t('auth.register.terms')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
