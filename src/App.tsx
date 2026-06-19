import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { UserRole } from './types';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import GardenListPage from './pages/gardens/GardenListPage';
import GardenDetailPage from './pages/gardens/GardenDetailPage';
import ServicesPage from './pages/ServicesPage';
import PricingPage from './pages/PricingPage';
import HowItWorksPage from './pages/HowItWorksPage';

// Customer
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyRentalsPage from './pages/customer/MyRentalsPage';
import IoTMonitoringPage from './pages/customer/IoTMonitoringPage';
import CareServicesPage from './pages/customer/CareServicesPage';

// Owner
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AddGardenPage from './pages/owner/AddGardenPage';

// Staff
import StaffDashboard from './pages/staff/StaffDashboard';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';


interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    const paths: Record<string, string> = {
      customer: '/dashboard/customer',
      owner: '/dashboard/owner',
      staff: '/dashboard/staff',
      admin: '/dashboard/admin',
    };
    return <Navigate to={paths[user.role] || '/'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
      <Route path="/gardens" element={<GardenListPage />} />
      <Route path="/gardens/:id" element={<GardenDetailPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />

      {/* Customer */}
      <Route path="/dashboard/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/customer/rentals" element={<ProtectedRoute allowedRoles={['customer']}><MyRentalsPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/monitoring" element={<ProtectedRoute allowedRoles={['customer']}><IoTMonitoringPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/care" element={<ProtectedRoute allowedRoles={['customer']}><CareServicesPage /></ProtectedRoute>} />

      {/* Owner */}
      <Route path="/dashboard/owner" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/owner/gardens/add" element={<ProtectedRoute allowedRoles={['owner']}><AddGardenPage /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/dashboard/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
