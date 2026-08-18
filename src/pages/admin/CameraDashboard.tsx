import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Video, Camera as CameraIcon } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { CameraDTO, getActiveCameras } from '../../api/cameraApi';
import { staffNavItems } from '../manager/staffNav';

export default function CameraDashboard() {
  const [cameras, setCameras] = useState<CameraDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveCameras();
      setCameras(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Không thể kết nối đến máy chủ Backend để lấy dữ liệu Camera.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 30000); // Tự động làm mới mỗi 30s
    return () => clearInterval(interval);
  }, []);

  const handleCapture = (cam: CameraDTO) => {
    const captureUrlWithTime = `${cam.capture_url}?t=${new Date().getTime()}`;
    const link = document.createElement('a');
    link.href = captureUrlWithTime;
    link.download = `${cam.cam_id}_Capture_${new Date().toISOString().slice(0, 10)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout navItems={staffNavItems} title="Hệ thống Camera IoT">
      {/* Tiêu đề trang tương tự Audit Logs */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Giám sát Camera trực tuyến</h2>
          <p className="text-gray-500 text-sm mt-1">Xem trực tiếp luồng video và điều khiển chụp ảnh từ các khu vực vườn</p>
        </div>
        <button
          onClick={fetchCameras}
          disabled={loading}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-5 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trạng thái đang tải */}
      {loading && cameras.length === 0 ? (
        <div className="card text-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Đang quét tìm kiếm camera trong mạng...</p>
        </div>
      ) : cameras.length === 0 && !error ? (
        /* Trạng thái chưa có camera nào ping lên */
        <div className="card text-center py-16">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-700">Chưa có Camera nào kết nối</h3>
          <p className="text-gray-400 text-sm mt-1">Hãy đảm bảo mạch ESP32-CAM đã được cấp nguồn và kết nối cùng mạng LAN.</p>
        </div>
      ) : (
        /* Lưới hiển thị danh sách Camera dạng Card */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cameras.map((cam) => (
            <div key={cam.cam_id} className="card overflow-hidden p-0 flex flex-col">
              {/* Header của từng Card Camera */}
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold text-gray-900 text-sm">{cam.name}</span>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono">{cam.cam_id}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">IP: {cam.ip}</span>
              </div>

              {/* Khung chứa Video Stream trực tiếp */}
              <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                <img
                  src={cam.stream_url}
                  alt={cam.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                  }}
                />
              </div>

              {/* Footer điều khiển Card */}
              <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 mt-auto">
                <a
                  href={cam.stream_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors"
                >
                  Mở tab riêng
                </a>
                <button
                  onClick={() => handleCapture(cam)}
                  className="btn-primary flex items-center gap-2 text-xs py-2"
                >
                  <CameraIcon className="w-4 h-4" />
                  Chụp & Lưu Ảnh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}