import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { UserRole } from './types';
import { getDashboardPath } from './utils/roleMap';

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

import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyRentalsPage from './pages/customer/MyRentalsPage';
import IoTMonitoringPage from './pages/customer/IoTMonitoringPage';
import CareServicesPage from './pages/customer/CareServicesPage';
import PaymentHistoryPage from './pages/customer/PaymentHistoryPage';
import CustomerNotificationsPage from './pages/customer/CustomerNotificationsPage';

import StaffDashboard from './pages/staff/StaffDashboard';
import LocationManagement from './pages/staff/LocationManagement';
import PillarManagement from './pages/staff/PillarManagement';
import SlotManagement from './pages/staff/SlotManagement';
import ServiceManagement from './pages/staff/ServiceManagement';
import ActiveRentals from './pages/staff/ActiveRentals';
import RevenueAnalytics from './pages/staff/RevenueAnalytics';

import GardenStaffDashboard from './pages/garden-staff/GardenStaffDashboard';

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
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
      <Route path="/gardens" element={<GardenListPage />} />
      <Route path="/gardens/:id" element={<GardenDetailPage />} />
      <Route path="/gardens/slot/:id" element={<GardenDetailPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />

      {/* Customer */}
      <Route path="/dashboard/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/customer/rentals" element={<ProtectedRoute allowedRoles={['customer']}><MyRentalsPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/monitoring" element={<ProtectedRoute allowedRoles={['customer']}><IoTMonitoringPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/care" element={<ProtectedRoute allowedRoles={['customer']}><CareServicesPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/payments" element={<ProtectedRoute allowedRoles={['customer']}><PaymentHistoryPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/notifications" element={<ProtectedRoute allowedRoles={['customer']}><CustomerNotificationsPage /></ProtectedRoute>} />

      {/* Staff / Manager */}
      <Route path="/dashboard/staff" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/staff/locations" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><LocationManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/pillars" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><PillarManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/slots" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><SlotManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/services" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><ServiceManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/rentals" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><ActiveRentals /></ProtectedRoute>} />
      <Route path="/dashboard/staff/revenue" element={<ProtectedRoute allowedRoles={['manager']}><RevenueAnalytics /></ProtectedRoute>} />

      {/* Garden Staff */}
      <Route path="/dashboard/garden-staff" element={<ProtectedRoute allowedRoles={['garden_staff']}><GardenStaffDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/garden-staff/monitoring" element={<ProtectedRoute allowedRoles={['garden_staff']}><IoTMonitoringPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />

      {/* Legacy owner routes → redirect */}
      <Route path="/dashboard/owner/*" element={<Navigate to="/gardens" replace />} />

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
