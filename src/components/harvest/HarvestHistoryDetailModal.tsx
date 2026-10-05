import { useState } from 'react';
import {
  X, Sprout, Calendar, MapPin, User, Clock,
  CheckCircle2, FileText, Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import type { HarvestHistoryItem } from '../../api/harvestHistoryApi';

interface HarvestHistoryDetailModalProps {
  item: HarvestHistoryItem | null;
  onClose: () => void;
}

export default function HarvestHistoryDetailModal({ item, onClose }: HarvestHistoryDetailModalProps) {
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!item) return null;

  const images = item.evidenceImageUrl
    ? item.evidenceImageUrl.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const daysGrown = item.daysGrown ?? 0;
  const harvestDays = item.harvestDays ?? 0;
  const growthPercent = harvestDays > 0 ? Math.min(100, Math.round((daysGrown / harvestDays) * 100)) : 100;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Chi tiết đợt thu hoạch #{item.id}</h3>
                  {item.isEarlyHarvest ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Thu hoạch sớm
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Đúng chu kỳ
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thời gian: {new Date(item.harvestedAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Cây trồng & Vị trí */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-200/60">
              <div>
                <span className="text-xs font-medium text-gray-500">Giống cây trồng</span>
                <div className="text-base font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  {item.treeName || 'Chưa xác định'}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Vị trí ô đất & Cơ sở</span>
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  Ô {item.slotNumber || 'N/A'} {item.locationName ? `· ${item.locationName}` : ''}
                </div>
              </div>

              {item.pillarCodes && (
                <div className="sm:col-span-2 pt-2 border-t border-gray-200/60">
                  <span className="text-xs font-medium text-gray-500">Trụ thu hoạch</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.pillarCodes.split(',').map(s => s.trim()).filter(Boolean).map((pCode, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-200"
                      >
                        Trụ: {pCode}
                        {item.pillarHarvestCount ? ` (Thu hoạch đợt ${item.pillarHarvestCount})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tiến độ sinh trưởng & Thời gian */}
            <div className="border border-gray-200/80 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> Chu kỳ sinh trưởng
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-gray-500">Ngày gieo trồng</span>
                  <div className="font-semibold text-gray-900 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {item.plantedAt ? new Date(item.plantedAt).toLocaleDateString('vi-VN') : '—'}
                  </div>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-gray-500">Ngày thu hoạch</span>
                  <div className="font-semibold text-gray-900 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {new Date(item.harvestedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 col-span-2 sm:col-span-1">
                  <span className="text-gray-500">Thời gian nuôi trồng</span>
                  <div className="font-bold text-gray-900 mt-1">
                    {item.daysGrown != null ? `${item.daysGrown} ngày` : '—'}
                    {item.harvestDays ? ` / chuẩn ${item.harvestDays} ngày` : ''}
                  </div>
                </div>
              </div>

              {item.harvestDays ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tỷ lệ hoàn thành chu kỳ:</span>
                    <span className="font-bold text-gray-800">{growthPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.isEarlyHarvest ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${growthPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Thông tin người thực hiện */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200/80 rounded-xl p-4">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-500" /> Khách hàng
                </span>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {item.customerName || 'Khách hàng GreenSlot'}
                </div>
              </div>

              <div className="border border-gray-200/80 rounded-xl p-4">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hình thức thu hoạch
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={
                      item.harvestMethod === 'SELF'
                        ? 'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-green-100 text-green-800'
                        : 'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800'
                    }
                  >
                    {item.harvestMethod === 'SELF' ? 'Khách tự thu hoạch' : 'Nhân viên hỗ trợ thu hoạch'}
                  </span>
                  {item.harvestMethod === 'STAFF' && item.staffName && (
                    <span className="text-xs text-gray-600">({item.staffName})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            {item.staffNotes && (
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-amber-700" />
                  Ghi chú đợt thu hoạch:
                </div>
                <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
                  {item.staffNotes}
                </p>
              </div>
            )}

            {/* Ảnh bằng chứng / nghiệm thu */}
            <div className="border border-gray-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Ảnh nghiệm thu thực tế ({images.length})
                </h4>
                {images.length > 0 && (
                  <span className="text-[11px] text-gray-400">Bấm vào ảnh để phóng to</span>
                )}
              </div>

              {images.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Chưa có ảnh nghiệm thu cho đợt thu hoạch này.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setZoomImage(imgUrl)}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer shadow-2xs hover:shadow-md hover:border-emerald-500 transition-all"
                    >
                      <img
                        src={imgUrl}
                        alt={`Ảnh nghiệm thu ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/600x400?text=Lỗi+tải+ảnh';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <Maximize2 className="w-4 h-4" /> Phóng to
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition shadow-md"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="Ảnh nghiệm thu phóng to"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
