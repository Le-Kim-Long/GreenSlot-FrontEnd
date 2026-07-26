import React, { useState } from 'react';
import { ShieldAlert, Upload, X, CheckCircle2, Loader2, Image as ImageIcon, MessageSquare, Activity, ClipboardList, Send } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { alertApi, ProcessAlertPayload } from '../../api/alertApi';
import { uploadTreeImage, deleteTreeImage } from '../../utils/firebaseUpload';
import clsx from 'clsx';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
];

export default function GardenStaffAlerts() {
  const [alertId, setAlertId] = useState<number | ''>('');
  
  // 👉 Chỉ giữ lại các trạng thái mà backend hỗ trợ thực tế (ví dụ: RESOLVED, FAILED, IN_PROGRESS)
  const [status, setStatus] = useState<'RESOLVED' | 'IN_PROGRESS' | 'FAILED'>('RESOLVED');
  const [comment, setComment] = useState('');
  const [evidenceImageUrl, setEvidenceImageUrl] = useState('');

  // Trạng thái loading & thông báo
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const removeTempImage = async (urlToRemove?: string) => {
    if (!urlToRemove) return;
    await deleteTreeImage(urlToRemove);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn file hình ảnh (JPG, PNG, WEBP...).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setIsUploadingImage(true);
    setSuccessMsg('');
    try {
      await removeTempImage(evidenceImageUrl);
      const firebaseUrl = await uploadTreeImage(file);
      setEvidenceImageUrl(firebaseUrl);
    } catch (err) {
      console.error('Lỗi upload ảnh bằng chứng:', err);
      alert('Tải ảnh lên Firebase thất bại. Vui lòng thử lại!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    await removeTempImage(evidenceImageUrl);
    setEvidenceImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (alertId === '' || isNaN(Number(alertId))) {
      alert('Vui lòng nhập ID cảnh báo hợp lệ!');
      return;
    }

    if (!comment.trim()) {
      alert('Vui lòng nhập cách xử lý / lời bình!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ProcessAlertPayload & { alertId: number } = {
        alertId: Number(alertId),
        status,
        comment: comment.trim(),
        evidenceImageUrl: evidenceImageUrl || undefined,
      };

      await alertApi.processAlert(payload);
      
      setSuccessMsg('🎉 Đã gửi báo cáo xử lý sự cố ngoài vườn thành công!');
      setComment('');
      setEvidenceImageUrl('');
      setAlertId('');
      setStatus('RESOLVED');
    } catch (err) {
      console.error('Lỗi gửi báo cáo:', err);
      alert('Gửi báo cáo thất bại! Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ Quản lý.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Báo cáo Xử lý Cảnh báo IoT">
      <div className="max-w-xl mx-auto p-2 sm:p-6">
        
        {/* Banner Giới thiệu */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-6 text-white mb-6 shadow-md shadow-green-600/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">Cập nhật khắc phục sự cố</h2>
          </div>
          <p className="text-green-100 text-xs leading-relaxed">
            Nhập ID cảnh báo, chọn kết quả giải quyết, ghi lại các công việc khắc phục và tải ảnh thực tế lên hệ thống để quản lý nghiệm thu.
          </p>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 mb-6 text-sm font-medium flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5 text-sm">
          
          {/* ID Cảnh báo */}
          <div>
            <label className="block font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-green-600" /> ID Cảnh báo (Alert ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              required
              placeholder="VD: 1"
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-gray-800 font-semibold"
              value={alertId}
              onChange={(e) => setAlertId(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          {/* Trạng thái xử lý (Đã loại bỏ PENDING để tránh lỗi Enum) */}
          <div>
            <label className="block font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-green-600" /> Trạng thái xử lý (Status)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'RESOLVED', label: 'Đã hoàn thành', cls: 'border-green-500 bg-green-50 text-green-700' },
                { val: 'IN_PROGRESS', label: 'Đang xử lý', cls: 'border-blue-500 bg-blue-50 text-blue-700' },
                { val: 'FAILED', label: 'Thất bại', cls: 'border-red-500 bg-red-50 text-red-700' },
              ].map((opt) => {
                const isSelected = status === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setStatus(opt.val as any)}
                    className={clsx(
                      "py-2.5 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 select-none",
                      isSelected ? `${opt.cls} ring-2 ring-offset-1 ring-current shadow-sm` : "border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lời bình */}
          <div>
            <label className="block font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-green-600" /> Ghi chú cách khắc phục <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="VD: Đã kiểm tra cảm biến ô vườn A1, tiến hành tưới bổ sung 15 phút..."
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-gray-800"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Ảnh bằng chứng */}
          <div>
            <label className="block font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-green-600" /> Ảnh chụp ngoài hiện trường <span className="text-gray-400 font-normal">(Tùy chọn)</span>
            </label>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                ) : evidenceImageUrl ? (
                  <>
                    <img src={evidenceImageUrl} alt="Evidence" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa ảnh"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <label className={clsx(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer shadow-sm transition",
                  isUploadingImage && "opacity-50 pointer-events-none"
                )}>
                  <Upload className="w-4 h-4 text-green-600" />
                  <span>{isUploadingImage ? 'Đang tải lên Firebase...' : 'Chọn hoặc chụp ảnh...'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  Hỗ trợ JPG, PNG, WEBP. Ảnh sẽ được gửi kèm báo cáo để quản lý nghiệm thu.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi báo cáo...</>
              ) : (
                <><Send className="w-4 h-4" /> Gửi báo cáo xử lý ngay</>
              )}
            </button>
          </div>
        </form>

      </div>
    </DashboardLayout>
  );
}