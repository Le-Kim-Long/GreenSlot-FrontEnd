import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Wifi, 
  ShieldAlert, 
  CheckCircle, 
  History, 
  Camera as CameraIcon, 
  Loader2,
  Video,
  WifiOff,
  RefreshCw,
  X,
  Eye,
  ChevronRight
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { staffNavItems } from '../manager/staffNav';
import { customerNavItems } from '../customer/customerNavItems';
import apiClient from '../../api/axiosConfig';

export interface CameraDTO {
  cam_id: string;
  name: string;
  ip: string;
  stream_url: string;
  capture_url: string;
}

const gardenStaffNavItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <CameraIcon className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> },
];

export default function CameraAllPage() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const navItems = path.startsWith('/dashboard/customer')
    ? customerNavItems
    : path.startsWith('/dashboard/garden-staff')
    ? gardenStaffNavItems
    : staffNavItems;

  const [cameras, setCameras] = useState<CameraDTO[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCamera, setSelectedCamera] = useState<CameraDTO | null>(null);
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const intervalRef = useRef<number | null>(null);

  const loadCameras = useCallback(async () => {
    try {
      const response = await apiClient.get('/cameras');
      setCameras(response.data);
    } catch (err: any) {
      console.error('Lỗi tải danh sách camera:', err);
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  const handleRefreshList = () => {
    setRefreshing(true);
    loadCameras();
  };

  // Làm mới ảnh im lặng bằng cách cập nhật timestamp
  const refreshSnapshot = useCallback((captureUrl: string) => {
    setSnapshotUri(`${captureUrl}?t=${Date.now()}`);
  }, []);

  // Vòng lặp ngầm: Lấy khung hình mới mỗi 3 giây
  const startAutoRefresh = useCallback((captureUrl: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      refreshSnapshot(captureUrl);
    }, 3000);
  }, [refreshSnapshot]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) { 
      clearInterval(intervalRef.current); 
      intervalRef.current = null; 
    }
  }, []);

  const handleViewCamera = (camera: CameraDTO) => {
    setSelectedCamera(camera);
    setModalVisible(true);
    if (camera.capture_url) {
      refreshSnapshot(camera.capture_url);
      startAutoRefresh(camera.capture_url);
    } else {
      setSnapshotUri(null);
    }
  };

  const handleCloseModal = () => {
    stopAutoRefresh();
    setModalVisible(false);
    setSelectedCamera(null);
    setSnapshotUri(null);
  };

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return (
    <DashboardLayout navItems={navItems} title="Giám Sát Camera">
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <CameraIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Camera giám sát</h2>
            <p className="text-gray-500 text-sm mt-1">
              {cameras.length > 0 ? `${cameras.length} camera đang hoạt động` : 'Không có camera nào'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleRefreshList}
          className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
          title="Làm mới danh sách"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loadingList ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-green-600" />
          <p className="text-gray-500">Đang tải camera...</p>
        </div>
      ) : cameras.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 flex flex-col items-center justify-center gap-4 shadow-sm">
          <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
            <WifiOff size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-600">Chưa có camera nào</h3>
          <p className="text-gray-400 text-center max-w-md">
            Hệ thống chưa ghi nhận camera nào đang hoạt động.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((cam) => (
            <div 
              key={cam.cam_id}
              onClick={() => handleViewCamera(cam)}
              className="bg-white rounded-2xl overflow-hidden border border-green-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group"
            >
              <div className="relative h-48 bg-[#0f1923] flex items-center justify-center overflow-hidden">
                {cam.capture_url ? (
                  <img
                    src={cam.capture_url}
                    alt={cam.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Signal';
                    }}
                  />
                ) : (
                  <Video size={32} className="text-green-400 opacity-50" />
                )}
                
                <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1.5 tracking-wider backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 truncate flex-1 pr-2">{cam.name}</h4>
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                    <Wifi size={10} className="text-green-600" />
                    <span className="text-[11px] font-medium text-green-700">Online</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">IP: {cam.ip}</p>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-green-600 group-hover:text-green-700">
                  <div className="flex items-center gap-1.5">
                    <Eye size={14} />
                    <span className="text-sm font-medium">Xem trực tiếp</span>
                  </div>
                  <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={handleCloseModal}
          ></div>

          <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto flex flex-col animate-in fade-in zoom-in duration-200">
            
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 px-6 bg-white border-b border-green-100">
              <div className="flex items-center gap-3">
                <CameraIcon size={20} className="text-green-600" />
                <h3 className="font-bold text-lg text-gray-900 truncate">
                  {selectedCamera?.name || 'Camera'}
                </h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              
              <div className="w-full bg-[#0f1923] rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative min-h-[250px] sm:min-h-[400px]">
                {snapshotUri ? (
                  <img 
                    src={snapshotUri} 
                    alt="Camera Live Stream" 
                    className="w-full h-full object-contain transition-opacity duration-300"
                    onError={() => setSnapshotUri(null)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Video size={48} className="text-green-300 opacity-50" />
                    <p className="text-sm">
                      {selectedCamera?.capture_url 
                        ? 'Đang tải luồng hình ảnh...' 
                        : 'Camera này không hỗ trợ xem trực tiếp'}
                    </p>
                  </div>
                )}
                
                <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-2 tracking-widest backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
                <h4 className="text-green-800 font-bold mb-4">Thông tin chi tiết</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm min-w-[90px]">Tên</span>
                    <span className="text-gray-900 text-sm font-medium text-right">{selectedCamera?.name}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm min-w-[90px]">Camera ID</span>
                    <span className="text-gray-900 text-sm font-medium text-right">{selectedCamera?.cam_id}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm min-w-[90px]">Địa chỉ IP</span>
                    <span className="text-gray-900 text-sm font-medium text-right">{selectedCamera?.ip}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm min-w-[90px]">Capture URL</span>
                    <span className="text-gray-600 text-[11px] font-mono break-all text-right max-w-[70%]">
                      {selectedCamera?.capture_url || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-green-800 text-sm font-medium">Camera đang hoạt động và kết nối ổn định</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}