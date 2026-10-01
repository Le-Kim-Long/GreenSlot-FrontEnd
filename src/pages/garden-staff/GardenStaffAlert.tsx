import DashboardLayout from '../../components/common/DashboardLayout';
import PendingAlertsPanel from '../../components/alerts/PendingAlertsPanel';
import { gardenStaffNavItems } from './gardenStaffNav';

// Trang "Cảnh báo IoT" cho garden_staff — dùng chung PendingAlertsPanel với trang manager/location_manager
export default function GardenStaffAlerts() {
  return (
    <DashboardLayout navItems={gardenStaffNavItems} title="Xử lý Cảnh báo IoT">
      <PendingAlertsPanel />
    </DashboardLayout>
  );
}
