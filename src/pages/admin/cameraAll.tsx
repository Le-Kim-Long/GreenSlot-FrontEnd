import { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Wifi, ShieldAlert, CheckCircle, History, Camera } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from '../manager/staffNav';
import { customerNavItems } from '../customer/customerNavItems';

// Garden-staff không có file nav dùng chung — giữ đồng bộ với navItems cục bộ trong các trang garden-staff khác
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

  const [cameraSrc, setCameraSrc] = useState("");

  const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
  const BACKEND_URL = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  useEffect(() => {
    let currentObjectUrl = "";

    const fetchCameraFrame = async () => {
      try {
        // CHÚ Ý: Đổi 'token' thành tên key bạn đang lưu trong LocalStorage (ví dụ: 'accessToken')
        const token = localStorage.getItem('token'); 
        
        const response = await fetch(`${BACKEND_URL}/api/iot/camera/snapshot?t=${new Date().getTime()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}` // Gửi chìa khóa Token vào đây
          }
        });

        if (response.ok) {
          const imageBlob = await response.blob();
          
          // Phải xóa ảnh cũ khỏi RAM trước khi load ảnh mới để tránh bị giật lag máy
          if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
          }
          
          // Chuyển đổi dữ liệu thô thành đường link ảnh ảo trên trình duyệt
          currentObjectUrl = URL.createObjectURL(imageBlob);
          setCameraSrc(currentObjectUrl);
        } else {
          console.log("Camera đang offline hoặc Token sai.");
        }
      } catch (error) {
        // Đang chờ máy chủ phản hồi...
      }
    };

    // Tốc độ cập nhật: 300ms (0.3s/ảnh)
    const timer = setInterval(fetchCameraFrame, 300);

    // Dọn dẹp rác khi người dùng chuyển sang trang khác
    return () => {
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
          <span className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live (Polling)
          </span>
        </div>

        <div className="flex justify-center items-center bg-gray-100 rounded-lg min-h-[400px] overflow-hidden border-2 border-dashed border-gray-300 p-2">
          {cameraSrc ? (
            <img 
              src={cameraSrc} 
              alt="Luồng Camera" 
              className="w-full max-w-4xl rounded-lg object-contain"
            />
          ) : (
            <div className="text-gray-500 flex flex-col items-center gap-2">
              <Camera className="w-8 h-8 text-gray-400 animate-pulse" />
              <span>Đang kết nối luồng video...</span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}