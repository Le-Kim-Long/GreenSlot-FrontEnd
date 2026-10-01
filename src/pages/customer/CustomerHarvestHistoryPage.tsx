import { useState, useEffect, useMemo } from 'react';
import { Sprout, Calendar, MapPin, User, Loader2, History, Image as ImageIcon, X, FileText } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { customerNavItems as navItems } from './customerNavItems';
import { harvestHistoryApi, HarvestHistoryItem } from '../../api/harvestHistoryApi';

export default function CustomerHarvestHistoryPage() {
  const [items, setItems] = useState<HarvestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    harvestHistoryApi.getMyHistory()
      .then(data => {
        const sorted = (data || []).sort((a: HarvestHistoryItem, b: HarvestHistoryItem) => {
          const timeA = new Date(a.harvestedAt || a.plantedAt || 0).getTime();
          const timeB = new Date(b.harvestedAt || b.plantedAt || 0).getTime();
          if (timeA !== timeB) return timeB - timeA;
          return b.id - a.id;
        });
        setItems(sorted);
      })
      .catch(() => setError('Không thể tải lịch sử thu hoạch'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return (
    <DashboardLayout navItems={navItems} title="Lịch sử thu hoạch">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Lịch sử thu hoạch</h2>
        <p className="text-gray-500 text-sm mt-1">Các lần thu hoạch đã hoàn tất trên các ô đất bạn từng thuê.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">Bạn chưa có lần thu hoạch nào được ghi nhận.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {paginatedItems.map(item => {
              const images = item.evidenceImageUrl
                ? item.evidenceImageUrl.split(',').map(s => s.trim()).filter(Boolean)
                : [];

              return (
                <div key={item.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-green-600" /> {item.treeName || 'Không rõ giống cây'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Ô {item.slotNumber} {item.locationName ? `· ${item.locationName}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isEarlyHarvest && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
                          🌱 Thu hoạch sớm {item.daysGrown != null && item.harvestDays ? `(${item.daysGrown}/${item.harvestDays} ngày)` : ''}
                        </span>
                      )}
                      <span className={
                        item.harvestMethod === 'SELF'
                          ? 'badge-green'
                          : 'badge-blue'
                      }>
                        {item.harvestMethod === 'SELF' ? 'Tự thu hoạch' : 'Nhân viên thu hoạch'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                    {item.pillarCodes && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {item.pillarCodes.split(',').map(s => s.trim()).filter(Boolean).map((pCode, idx) => (
                          <span key={idx} className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            🏷️ Trụ: {pCode} {item.pillarHarvestCount ? `(Thu hoạch lần ${item.pillarHarvestCount})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.plantedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Ngày gieo trồng: {new Date(item.plantedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Ngày thu hoạch: {new Date(item.harvestedAt).toLocaleDateString('vi-VN')}
                    </span>
                    {item.daysGrown != null && (
                      <span className="text-gray-600 font-medium">
                        ⏱️ Thời gian sinh trưởng: <strong className="text-gray-900">{item.daysGrown} ngày</strong> {item.harvestDays ? `(Chu kỳ chuẩn: ${item.harvestDays} ngày)` : ''}
                      </span>
                    )}
                    {item.harvestMethod === 'STAFF' && item.staffName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Nhân viên: {item.staffName}
                      </span>
                    )}
                  </div>

                  {/* ẢNH BẰNG CHỨNG THU HOẠCH TỪ NHÂN VIÊN */}
                  {images.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        Ảnh nghiệm thu thực tế của nhân viên:
                      </div>
                      <div className="flex flex-wrap gap-2.5 items-center">
                        {images.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setZoomImage(imgUrl)}
                            className="relative group cursor-pointer w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-xs hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20 transition-all"
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img
                              src={imgUrl}
                              alt={`Nghiệm thu ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                              Phóng to
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GHI CHÚ TỪ NHÂN VIÊN */}
                  {item.staffNotes && (
                    <div className="mt-2.5 bg-gray-50 rounded-xl p-2.5 text-xs text-gray-600 border border-gray-200/80 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-700">Ghi chú từ nhân viên: </span>
                        {item.staffNotes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={items.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
            itemName="lần thu hoạch"
          />
        </div>
      )}

      {/* POPUP PHÓNG TO ẢNH NGHIỆM THU */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="Ảnh nghiệm thu phóng to"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
