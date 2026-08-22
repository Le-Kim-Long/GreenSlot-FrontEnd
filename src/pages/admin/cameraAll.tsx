import { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Wifi, ShieldAlert, CheckCircle, History, Camera, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from '../manager/staffNav';
import { customerNavItems } from '../customer/customerNavItems';
import apiClient from '../../api/axiosConfig'; // Tận dụng axiosInstance của dự án

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

  const [cameraStreamUrl, setCameraStreamUrl] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("Đang tìm địa chỉ IP của Camera...");

  useEffect(() => {
    // Hàm gọi lên Backend (Render) để hỏi URL trực tiếp của Camera
    const fetchCameraInfo = async () => {
      try {
        // LƯU Ý: Thay '/cameras' bằng đúng API GET thông tin Camera của bạn
        // (API mà trả về cái json có chứa "stream_url" mà ESP32 vừa gửi lên)
        const response = await apiClient.get('/cameras'); 
        
        // Giả sử backend trả về 1 mảng camera, ta lấy cái đầu tiên
        const cameraData = Array.isArray(response.data) ? response.data[0] : response.data;

        if (cameraData && (cameraData.streamUrl || cameraData.stream_url)) {
          const url = cameraData.streamUrl || cameraData.stream_url;
          setCameraStreamUrl(url); // VD: http://192.168.1.14:81/stream
          setStatusMsg("");
        } else {
          setStatusMsg("Server chưa nhận được IP. Vui lòng kiểm tra nguồn ESP32-CAM.");
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin Camera:", error);
        setStatusMsg("Không thể kết nối đến máy chủ Backend.");
      }
    };

    // Gọi lần đầu tiên khi vào trang
    fetchCameraInfo();

    // Cứ mỗi 10 giây hỏi lại Backend 1 lần, đề phòng cục WiFi nhà bạn cấp lại IP mới cho ESP32
    const interval = setInterval(fetchCameraInfo, 10000);

    return () => clearInterval(interval);
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
            Live Stream (Direct)
          </span>
        </div>

        <div className="flex justify-center items-center bg-gray-900 rounded-lg min-h-[450px] overflow-hidden border-2 border-gray-800 p-1 relative">
          
          {/* Nếu đang tìm IP hoặc có lỗi thì hiện thông báo */}
          {statusMsg ? (
            <div className="text-gray-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <span className="font-medium text-sm">{statusMsg}</span>
            </div>
          ) : (
            // Nếu có URL rồi thì thẻ <img> sẽ tự động render luồng video liên tục của ESP32
            <img 
              src={cameraStreamUrl} 
              alt="Luồng Camera" 
              className="w-full h-full max-h-[600px] rounded-md object-contain bg-black"
              onError={() => {
                setStatusMsg("Không thể tải Video! Đảm bảo Laptop của bạn và Camera đang dùng chung 1 mạng WiFi.");
                setCameraStreamUrl("");
              }}
            />
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}