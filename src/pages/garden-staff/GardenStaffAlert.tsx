import { ShieldAlert, ClipboardList } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import PendingAlertsPanel from '../../components/alerts/PendingAlertsPanel';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
];

// Trang "Cảnh báo IoT" cho garden_staff — dùng chung PendingAlertsPanel với trang manager/location_manager
export default function GardenStaffAlerts() {
  return (
    <DashboardLayout navItems={navItems} title="Xử lý Cảnh báo IoT">
      <PendingAlertsPanel />
    </DashboardLayout>
  );
}
