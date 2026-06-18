import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { LocationPicker } from '../../../components/shared/LocationPicker';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useToast } from '../../../utils/ToastContext';
import { userService } from '../../../features/users/services/userService';

export function FarmerSettings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // The backend uses [lng, lat]
  const initialCoords = user?.location?.coordinates as [number, number] | undefined;
  const hasLocation = !!initialCoords && initialCoords.length === 2;

  const handleSaveLocation = async (coords: [number, number]) => {
    setIsSavingLocation(true);
    try {
      // Update user's location
      await userService.updateMyLocation(coords);
      
      // Also update all farmer's products with new location
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/update-locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            lat: coords[1],
            lng: coords[0],
          }),
        });
      }
      
      setShowLocationPicker(false);
      showToast('✅ Farm location saved and all products updated!', 'success');
    } catch (error) {
      console.error('Location update error:', error);
      showToast('Failed to save location. Please try again.', 'error');
    } finally {
      setIsSavingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile & Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your farm details and preferences.
          </p>
        </div>

        {/* Location Section */}
        <Card padding="lg">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                📍 Farm Location
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                Set your exact farm location using the map below. This allows customers nearby to find your fresh produce and ensures accurate delivery fee calculation.
              </p>
            </div>
            
            {!showLocationPicker && (
              <button
                onClick={() => setShowLocationPicker(true)}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {hasLocation ? 'Update Location' : 'Set My Farm Location'}
              </button>
            )}
          </div>

          {hasLocation && !showLocationPicker && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <span className="text-xl">✅</span>
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                Your farm location is set. Customers within your delivery radius can find you!
              </span>
            </div>
          )}

          {showLocationPicker && (
            <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Adjust Pin on Map
                </h3>
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
              <LocationPicker
                initialCoords={initialCoords}
                onConfirm={handleSaveLocation}
                isLoading={isSavingLocation}
              />
            </div>
          )}
        </Card>

        {/* Account Info placeholder */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Name
              </label>
              <div className="text-gray-900 dark:text-white font-medium">{user?.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <div className="text-gray-900 dark:text-white font-medium">{user?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Role
              </label>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 capitalize">
                {user?.role}
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
