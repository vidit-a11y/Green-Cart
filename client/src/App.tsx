import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from './components/shared/Footer';
import { Navbar } from './components/shared/Navbar';
import { ProtectedRoute, PublicOnlyRoute } from './components/shared/ProtectedRoute';
import { AdminDashboard } from './app/(main)/admin/AdminDashboard';
import { AdminProducts } from './app/(main)/admin/AdminProducts';
import { AdminUsers } from './app/(main)/admin/AdminUsers';
import { Cart } from './app/(main)/cart/Cart';
import { Checkout } from './app/(main)/cart/Checkout';
import { FarmerDashboard } from './app/(main)/farmer/FarmerDashboard';
import { FarmerOrders } from './app/(main)/farmer/FarmerOrders';
import { FarmerProducts } from './app/(main)/farmer/FarmerProducts';
import { Home } from './app/(main)/Home';
import { Login } from './app/authentication/Login';
import { ProductDetails } from './app/(main)/products/ProductDetails';
import { Products } from './app/(main)/products/Products';
import { Register } from './app/authentication/Register';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />

            {/* Auth Routes - Public Only */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />

            {/* Consumer Routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={['consumer', 'admin']}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={['consumer', 'admin']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            {/* Farmer Routes */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/products"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/products/add"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/orders"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerOrders />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
