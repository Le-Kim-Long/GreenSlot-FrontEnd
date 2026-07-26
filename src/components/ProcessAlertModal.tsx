import React, { useState } from 'react';
import { ShieldAlert, Upload, X, CheckCircle2, Loader2, Image as ImageIcon, MessageSquare, Activity } from 'lucide-react';
import clsx from 'clsx';
import { alertApi, ProcessAlertPayload } from '../api/alertApi';
// 👉 Reuse lại 2 hàm upload & xóa rác Firebase tuyệt vời của chúng ta
import { uploadTreeImage, deleteTreeImage } from '../utils/firebaseUpload';

interface ProcessAlertModalProps {
  alertId: number;
  alertTitle?: string; // Tên cảnh báo (VD: "Độ ẩm đất quá thấp - Slot A1")
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Hàm gọi lại để refresh danh sách cảnh báo sau khi xử lý xong
}

export default function ProcessAlertModal({ alertId, alertTitle = `Cảnh báo #${alertId}`, isOpen, onClose, onSuccess }: ProcessAlertModalProps) {
  const [status, setStatus] = useState<'RESOLVED' | 'IN_PROGRESS' | 'IGNORED'>('RESOLVED');
  const [comment, setComment] = useState('');
  const [evidenceImageUrl, setEvidenceImageUrl] = useState<string>('');
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // 💥 HÀM THÔNG MINH: Xóa ảnh tạm khỏi Firebase nếu người dùng chọn ảnh khác hoặc bấm Hủy
  const removeTempImage = async (urlToRemove?: string) => {
    if (!urlToRemove) return;
    await deleteTreeImage(urlToRemove);
  };

  // Xử lý khi chọn ảnh bằng chứng từ máy
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
    try {
      // 1. Dọn rác nếu trước đó đã lỡ tải 1 ảnh khác lên
      await removeTempImage(evidenceImageUrl);

      // 2. Tải ảnh mới lên Firebase
      const firebaseUrl = await uploadTreeImage(file);
      setEvidenceImageUrl(firebaseUrl);
    } catch (err) {
      console.error('Lỗi upload ảnh bằng chứng:', err);
      alert('Tải ảnh lên Firebase thất bại. Vui lòng thử lại!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Xử lý khi bấm nút "Hủy" hoặc tắt Modal -> Xóa ảnh tạm trên Cloud
  const handleCancel = async () => {
    await removeTempImage(evidenceImageUrl);
    onClose();
  };

  // Gửi form xử lý lên Backend (POST /api/alerts/process)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Vui lòng nhập lời bình / ghi chú cách xử lý!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ProcessAlertPayload = {
        alertId,
        status,
        comment: comment.trim(),
        evidenceImageUrl: evidenceImageUrl || undefined,
      };

      await alertApi.processAlert(payload);
      alert('🎉 Đã cập nhật xử lý cảnh báo thành công!');
      onSuccess(); // Refresh danh sách bên ngoài
      onClose();   // Đóng modal (Không xóa ảnh trên Firebase vì đã lưu thành công vào DB)
    } catch (err) {
      console.error('Lỗi xử lý cảnh báo:', err);
      alert('Có lỗi xảy ra khi gửi dữ liệu xử lý. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto border border-gray-100">
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Xử lý Cảnh báo IoT</h2>
            <p className="text-xs text-gray-500 font-medium truncate max-w-[280px]" title={alertTitle}>
              {alertTitle} (ID: #{alertId})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* 1. Chọn trạng thái xử lý */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-green-600" /> Cập nhật trạng thái
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { val: 'RESOLVED', label: 'Đã giải quyết', cls: 'border-green-500 bg-green-50 text-green-700' },
                { val: 'IN_PROGRESS', label: 'Đang xử lý', cls: 'border-blue-500 bg-blue-50 text-blue-700' },
                { val: 'IGNORED', label: 'Bỏ qua (Giả)', cls: 'border-gray-400 bg-gray-100 text-gray-700' },
              ].map((opt) => {
                const isSelected = status === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setStatus(opt.val as any)}
                    className={clsx(
                      "py-2.5 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1 select-none",
                      isSelected ? `${opt.cls} ring-2 ring-offset-1 ring-current font-bold shadow-sm` : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Ghi chú / Cách xử lý */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-green-600" /> Ghi chú / Lời bình cách giải quyết <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="VD: Đã tiến hành bật hệ thống tưới bù thủ công 15 phút, độ ẩm đất đã tăng trở lại mức an toàn..."
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-gray-800"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* 3. Tải ảnh bằng chứng (Evidence Image Upload) */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-green-600" /> Hình ảnh bằng chứng <span className="text-gray-400 font-normal">(Tùy chọn)</span>
            </label>
            
            <div className="flex items-center gap-4 mt-2">
              {/* Box Preview */}
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                ) : evidenceImageUrl ? (
                  <>
                    <img src={evidenceImageUrl} alt="Evidence" className="w-full h-full object-cover" />
                    {/* Nút xóa nhanh ảnh bằng chứng */}
                    <button
                      type="button"
                      onClick={async () => {
                        await removeTempImage(evidenceImageUrl);
                        setEvidenceImageUrl('');
                      }}
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

              {/* Button Upload */}
              <div className="flex-1">
                <label className={clsx(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer shadow-sm transition",
                  isUploadingImage && "opacity-50 pointer-events-none"
                )}>
                  <Upload className="w-4 h-4 text-green-600" />
                  <span>{isUploadingImage ? 'Đang tải lên Firebase...' : 'Chọn ảnh chụp thực tế...'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  Chụp lại ảnh cây trồng hoặc hệ thống tưới sau khi đã xử lý xong để làm bằng chứng cho khách hàng xem.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-md shadow-green-600/20 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Lưu kết quả xử lý</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}