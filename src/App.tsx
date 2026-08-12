import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { UserRole } from './types';
import { getDashboardPath } from './utils/roleMap';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import GardenListPage from './pages/public/GardenListPage';
import GardenDetailPage from './pages/public/GardenDetailPage';
import ServicesPage from './pages/public/ServicesPage';
import PricingPage from './pages/public/PricingPage';
import HowItWorksPage from './pages/public/HowItWorksPage';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyRentalsPage from './pages/customer/MyRentalsPage';
import IoTMonitoringPage from './pages/customer/IoTMonitoringPage';
import CareServicesPage from './pages/customer/CareServicesPage';
import PaymentHistoryPage from './pages/customer/PaymentHistoryPage';
import CustomerNotificationsPage from './pages/customer/CustomerNotificationsPage';
import TreePlantingRequestPage from './pages/customer/CustomerTreePlanting';

import StaffDashboard from './pages/manager/StaffDashboard';
import LocationManagement from './pages/manager/LocationManagement';
import PillarManagement from './pages/manager/PillarManagement';
import SlotManagement from './pages/manager/SlotManagement';
import ServiceManagement from './pages/manager/ServiceManagement';
import ActiveRentals from './pages/manager/ActiveRentals';
import RevenueAnalytics from './pages/manager/RevenueAnalytics';
import CustomerAnalytics from './pages/manager/CustomerAnalytics';
import AlertAnalytics from './pages/manager/AlertAnalytics';
import AlertProcessing from './pages/manager/AlertProcessing';
import AlertHistory from './pages/manager/AlertHistory';
import TaskManagement from './pages/manager/TaskManagement';
import StaffListPage from './pages/manager/StaffListPage';
import EquipmentManagement from './pages/manager/EquipmentManagement';
import TreeManagement from './pages/manager/TreeManagement';
import StaffScheduleManagement from './pages/manager/StaffScheduleManagement';
import TreePlantingManagement from './pages/manager/TreePlantingManagement';

import GardenStaffDashboard from './pages/garden-staff/GardenStaffDashboard';
import GardenStaffAlerts from './pages/garden-staff/GardenStaffAlert';
import PumpControl from './pages/garden-staff/PumpControl';
import MySchedule from './pages/garden-staff/MySchedule';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import GlobalContentPage from './pages/admin/GlobalContentPage';
import CameraDashboard from './pages/admin/CameraDashboard';

import ProfilePage from './pages/profile/ProfilePage';
import PaymentResultPage from './pages/public/PaymentResultPage';

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
      <Route path="/payment-result" element={<PaymentResultPage />} />

      {/* Profile – accessible by all authenticated users */}
      <Route path="/dashboard/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Customer */}
      <Route path="/dashboard/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/customer/rentals" element={<ProtectedRoute allowedRoles={['customer']}><MyRentalsPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/monitoring" element={<ProtectedRoute allowedRoles={['customer']}><IoTMonitoringPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/care" element={<ProtectedRoute allowedRoles={['customer']}><CareServicesPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/payments" element={<ProtectedRoute allowedRoles={['customer']}><PaymentHistoryPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/notifications" element={<ProtectedRoute allowedRoles={['customer']}><CustomerNotificationsPage /></ProtectedRoute>} />
      <Route path="/dashboard/customer/tree-planting" element={<ProtectedRoute allowedRoles={['customer']}><TreePlantingRequestPage /></ProtectedRoute>} />

      {/* Staff / Manager */}
      <Route path="/dashboard/staff" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/staff/locations" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><LocationManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/pillars" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><PillarManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/slots" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><SlotManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/services" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><ServiceManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/rentals" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><ActiveRentals /></ProtectedRoute>} />
      <Route path="/dashboard/staff/revenue" element={<ProtectedRoute allowedRoles={['manager']}><RevenueAnalytics /></ProtectedRoute>} />
      <Route path="/dashboard/staff/customer-analytics" element={<ProtectedRoute allowedRoles={['manager']}><CustomerAnalytics /></ProtectedRoute>} />
      <Route path="/dashboard/staff/alert-analytics" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><AlertAnalytics /></ProtectedRoute>} />
      <Route path="/dashboard/staff/alert-processing" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><AlertProcessing /></ProtectedRoute>} />
      <Route path="/dashboard/staff/alert-history" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><AlertHistory /></ProtectedRoute>} />
      <Route path="/dashboard/staff/tasks" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><TaskManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/staffs" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><StaffListPage /></ProtectedRoute>} />
      <Route path="/dashboard/staff/equipment" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><EquipmentManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/trees" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><TreeManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/schedules" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><StaffScheduleManagement /></ProtectedRoute>} />
      <Route path="/dashboard/staff/tree-planting" element={<ProtectedRoute allowedRoles={['manager', 'location_manager']}><TreePlantingManagement /></ProtectedRoute>} />

      {/* Garden Staff */}
      <Route path="/dashboard/garden-staff" element={<ProtectedRoute allowedRoles={['garden_staff']}><GardenStaffDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/garden-staff/schedules" element={<ProtectedRoute allowedRoles={['garden_staff']}><MySchedule /></ProtectedRoute>} />
      <Route path="/dashboard/garden-staff/alerts" element={<ProtectedRoute allowedRoles={['garden_staff']}><GardenStaffAlerts /></ProtectedRoute>} />
      <Route path="/dashboard/garden-staff/monitoring" element={<ProtectedRoute allowedRoles={['garden_staff']}><IoTMonitoringPage /></ProtectedRoute>} />
      <Route path="/dashboard/garden-staff/pump-control" element={<ProtectedRoute allowedRoles={['garden_staff']}><PumpControl /></ProtectedRoute>} />


      {/* Admin */}
      <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
      <Route path="/dashboard/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/dashboard/admin/content" element={<ProtectedRoute allowedRoles={['admin']}><GlobalContentPage /></ProtectedRoute>} />
      <Route path="/dashboard/admin/cameras" element={<ProtectedRoute allowedRoles={['admin']}><CameraDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/admin/customer-value" element={<ProtectedRoute allowedRoles={['admin']}><CustomerAnalytics /></ProtectedRoute>} />
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
