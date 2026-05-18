import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useAuth } from '../../features/auth/context/AuthContext';
import type { UserRole } from '../../types';
import { useToast } from '../../utils/ToastContext';

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.phone || undefined,
        formData.address || undefined
      );
      showToast(t('auth.register.success'), 'success');
      navigate('/');
    } catch (error) {
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
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.register.subtitle')}
            </p>
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

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
            >
              {t('auth.register.submit')}
            </Button>

          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.register.hasAccount')}{' '}
              <Link
                to="/login"
                className="text-green-600 dark:text-green-400 font-medium hover:text-green-700"
              >
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
