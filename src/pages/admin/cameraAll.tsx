import { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Wifi, ShieldAlert, CheckCircle, History, Camera, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from '../manager/staffNav';
import { customerNavItems } from '../customer/customerNavItems';
import apiClient from '../../api/axiosConfig';

const gardenStaffNavItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <Camera className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> },
];

export default function CameraAllPage() {
  const path = window.location.pathname;
  const navItems = path.startsWith('/dashboard/customer')
    ? customerNavItems
    : path.startsWith('/dashboard/garden-staff')
    ? gardenStaffNavItems
    : staffNavItems;

  const [cameraSrc, setCameraSrc] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("Đang kết nối luồng video...");

  useEffect(() => {
    let currentObjectUrl = "";
    let isMounted = true;

    const fetchCameraFrame = async () => {
      try {
        // Dùng apiClient lấy ảnh thô (blob) thay vì fetch thủ công
        // Nó sẽ tự động lấy Token từ cấu hình của bạn gắn vào Header
        const response = await apiClient.get(`/iot/camera/snapshot?t=${new Date().getTime()}`, {
          responseType: 'blob'
        });

        if (isMounted) {
          // Xóa ảnh cũ khỏi RAM trước khi load ảnh mới để tránh giật lag máy
          if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
          }
          
          // Chuyển đổi dữ liệu thô thành đường link ảnh ảo trên trình duyệt
          currentObjectUrl = URL.createObjectURL(response.data);
          setCameraSrc(currentObjectUrl);
          setStatusMsg("");
        }
      } catch (error) {
        if (isMounted) {
          setStatusMsg("Camera đang offline hoặc lỗi kết nối.");
        }
      }
    };

    // Gọi lần đầu ngay khi mở trang
    fetchCameraFrame();

    // Tốc độ cập nhật: 300ms (0.3s/ảnh) để tạo luồng video mượt mà
    const timer = setInterval(fetchCameraFrame, 300);

    // Dọn dẹp rác bộ nhớ (RAM) khi người dùng chuyển sang trang khác
    return () => {
      isMounted = false;
      clearInterval(timer);
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, []);

  return (
    <DashboardLayout navItems={navItems} title="Giám Sát Camera IoT">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-xl font-bold mb-1">Hệ thống Camera Tổng</h2>
        <p className="text-slate-300 text-sm">Giám sát trực tiếp thời gian thực toàn bộ nhà kính</p>
      </div>

      <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🌿 Bảng Điều Khiển Nhà Kính
          </h3>
          <span className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live (Polling)
          </span>
        </div>

        <div className="flex justify-center items-center bg-gray-900 rounded-lg min-h-[450px] overflow-hidden border-2 border-gray-800 p-1 relative">
          
          {/* Nếu đang tìm IP hoặc có lỗi thì hiện thông báo */}
          {statusMsg && !cameraSrc ? (
            <div className="text-gray-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <span className="font-medium text-sm">{statusMsg}</span>
            </div>
          ) : (
            // Thẻ <img> sẽ tự động cập nhật src mỗi 300ms tạo hiệu ứng Video
            <img 
              src={cameraSrc} 
              alt="Luồng Camera" 
              className="w-full h-full max-h-[600px] rounded-md object-contain bg-black"
            />
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}