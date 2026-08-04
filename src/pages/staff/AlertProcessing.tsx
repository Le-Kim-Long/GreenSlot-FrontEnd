import DashboardLayout from '../../components/common/DashboardLayout';
import PendingAlertsPanel from '../../components/alerts/PendingAlertsPanel';
import { staffNavItems } from './staffNav';

// Trang "Xử lý Cảnh báo" cho manager/location_manager — dùng chung PendingAlertsPanel với trang garden-staff
export default function AlertProcessing() {
  return (
    <DashboardLayout navItems={staffNavItems} title="Xử lý Cảnh báo">
      <PendingAlertsPanel />
    </DashboardLayout>
  );
}
