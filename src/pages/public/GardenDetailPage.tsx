import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Grid3X3, ChevronLeft, Calendar, Loader2, Sprout, Layers, Maximize2, MapPin, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { bookingApi, type AvailableSlot } from '../../api/bookingApi';
import { treeApi, type Tree } from '../../api/treeApi';
import { cacheSlotId } from '../../utils/slotCache';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export default function GardenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);
  const [selectedPillarIds, setSelectedPillarIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bookingMonths, setBookingMonths] = useState(1);
  const [monthsInput, setMonthsInput] = useState('1');
  const [monthsError, setMonthsError] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const handleMonthsChange = (rawVal: string) => {
    const cleaned = rawVal.replace(/\D/g, '');
    setMonthsInput(cleaned);

    if (!cleaned) {
      setBookingMonths(0);
      setMonthsError('Vui lòng nhập số tháng thuê (tối thiểu 1 tháng).');
      return;
    }

    const num = parseInt(cleaned, 10);
    if (isNaN(num) || num < 1) {
      setBookingMonths(0);
      setMonthsError('Số tháng thuê phải là số tự nhiên dương (tối thiểu 1 tháng).');
      return;
    }

    if (num > 120) {
      setBookingMonths(num);
      setMonthsError('Số tháng thuê tối đa là 120 tháng (10 năm).');
      return;
    }

    setBookingMonths(num);
    setMonthsError('');
    setBookingError('');
  };

  useEffect(() => {
    Promise.all([
      bookingApi.getAvailableSlots(),
      treeApi.getTrees().catch(() => []),
    ])
      .then(([slotsData, treesData]) => {
        const list = Array.isArray(slotsData) ? slotsData : [];
        const found = list.find(s => s.id === Number(id));
        if (found) {
          setSlot(found);
          const activeTrees = Array.isArray(treesData) ? treesData.filter(t => t.isActive) : [];
          setTrees(activeTrees);

          // Select all available (unrented) pillars by default
          const availablePillars = (found.pillars || []).filter(p => !p.isRented && p.status !== 'RENTED');
          setSelectedPillarIds(availablePillars.map(p => p.id));

          // Check if default tree is set on first available pillar
          const firstDefaultTreeId = availablePillars.find(p => p.defaultTreeId)?.defaultTreeId;
          if (firstDefaultTreeId) {
            setSelectedTreeId(firstDefaultTreeId);
          } else if (activeTrees.length > 0) {
            setSelectedTreeId(activeTrees[0].id);
          }
        } else {
          setError('Không tìm thấy ô vườn này hoặc ô vườn không khả dụng');
        }
      })
      .catch(() => setError('Không thể tải thông tin ô vườn'))
      .finally(() => setLoading(false));
  }, [id]);

  const togglePillar = (pillarId: number) => {
    setSelectedPillarIds(prev =>
      prev.includes(pillarId) ? prev.filter(pId => pId !== pillarId) : [...prev, pillarId]
    );
    setBookingError('');
  };

  const selectedTree = trees.find(t => t.id === selectedTreeId) || null;
  const allSlotPillars = slot?.pillars || [];
  const chosenPillars = allSlotPillars.filter(p => selectedPillarIds.includes(p.id));
  const chosenPillarCount = chosenPillars.length;

  // Monthly pillar rent = sum of selected pillars' monthly prices (Slot has no base fee)
  const pillarsMonthlyPrice = chosenPillars.reduce((acc, p) => acc + (p.price || 0), 0);
  const slotRentTotal = pillarsMonthlyPrice * bookingMonths;

  // Tree cost scaled by hole capacity (Option 1: price * holes / 24.0)
  const treeTotal = chosenPillars.reduce((acc, p) => {
    if (!selectedTree || !selectedTree.price) return acc;
    const scale = (p.capacityHoles || 24) / 24.0;
    return acc + (selectedTree.price * scale);
  }, 0);

  const finalPrice = slotRentTotal + treeTotal;

  const totalHoles = chosenPillars.reduce((acc, p) => acc + (p.capacityHoles || 36), 0);

  const handleBook = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (chosenPillarCount === 0) {
      setBookingError('Vui lòng tích chọn ít nhất 1 trụ canh tác còn trống để thuê.');
      return;
    }
    if (!startDate) { setBookingError('Vui lòng chọn ngày bắt đầu'); return; }
    const chosenDate = new Date(`${startDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(chosenDate.getTime()) || chosenDate < today) {
      setBookingError('Ngày bắt đầu không hợp lệ: Không được chọn ngày trong quá khứ.');
      return;
    }
    if (!bookingMonths || bookingMonths < 1 || !Number.isInteger(bookingMonths)) {
      setBookingError('Số tháng thuê không hợp lệ: Vui lòng nhập số tự nhiên dương (tối thiểu 1 tháng).');
      return;
    }
    if (bookingMonths > 120) {
      setBookingError('Số tháng thuê không được vượt quá 120 tháng (10 năm).');
      return;
    }
    setBookingError('');
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!slot) return;
    setBooking(true);
    setBookingError('');
    try {
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      const isToday = startDate === todayStr;
      const startTimeIso = isToday ? now.toISOString() : new Date(`${startDate}T00:00:00`).toISOString();

      const result = await bookingApi.bookSlot({
        slotId: slot.id,
        durationInMonths: bookingMonths,
        startTime: startTimeIso,
        treeId: selectedTreeId || undefined,
        pillarIds: selectedPillarIds,
      });
      cacheSlotId(slot.slotNumber, slot.id);
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        navigate('/dashboard/customer/rentals');
      }
    } catch (err: any) {
      setBookingError(err?.response?.data?.message || 'Đặt thuê thất bại. Vui lòng thử lại.');
      setShowBookingModal(false);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !slot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Không tìm thấy ô vườn'}</h2>
            <Link to="/gardens" className="text-green-600 font-medium">← Quay lại danh sách</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/gardens" className="hover:text-green-600 flex items-center gap-1 font-medium">
            <ChevronLeft className="w-4 h-4" /> Danh sách ô vườn
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">{slot.slotNumber}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Slot info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 shadow-xs">
                    <Grid3X3 className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-900">{slot.slotNumber}</h1>
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      Sẵn sàng cho thuê
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-medium">Giá thuê trụ đã chọn</div>
                  <div className="text-2xl font-black text-emerald-700">{pillarsMonthlyPrice.toLocaleString('vi-VN')}đ<span className="text-xs text-gray-400 font-normal">/tháng</span></div>
                </div>
              </div>

              {/* Thông số ô vườn */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-emerald-600" /> Diện tích ô
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-1">{slot.area || 3.0} m²</div>
                </div>
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <Layers className="w-3 h-3 text-emerald-600" /> Năng suất đã chọn
                  </div>
                  <div className="text-sm font-black text-emerald-800 mt-1">{totalHoles} hốc rau ({chosenPillarCount}/{allSlotPillars.length} trụ)</div>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" /> Cơ sở
                  </div>
                  <div className="text-xs font-bold text-gray-900 mt-1 truncate">{slot.locationName || 'Chính'}</div>
                </div>
              </div>

              {/* Danh sách chi tiết các trụ bên trong kèm Checkbox chọn trụ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" /> Chọn Các Trụ Canh Tác Để Thuê ({chosenPillarCount}/{allSlotPillars.length} trụ)
                  </h3>
                  <span className="text-xs text-gray-500">Tích chọn trụ bạn muốn thuê</span>
                </div>
                <div className="space-y-2.5">
                  {allSlotPillars.length > 0 ? (
                    allSlotPillars.map(p => {
                      const isLarge = p.pillarType === 'LARGE';
                      const isSmall = p.pillarType === 'SMALL';
                      const isRented = Boolean(p.isRented || p.status === 'RENTED');
                      const isChecked = selectedPillarIds.includes(p.id);
                      const scale = (p.capacityHoles || 24) / 24.0;
                      const treeCostForP = selectedTree && selectedTree.price ? Math.round(selectedTree.price * scale) : 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => !isRented && togglePillar(p.id)}
                          className={clsx(
                            "p-3.5 rounded-2xl border transition-all flex items-center justify-between select-none",
                            isRented
                              ? "bg-gray-100/80 border-gray-200 opacity-60 cursor-not-allowed"
                              : isChecked
                              ? "bg-emerald-50/90 border-emerald-500 shadow-xs cursor-pointer ring-1 ring-emerald-500/20"
                              : "bg-gray-50/60 border-gray-200 hover:border-emerald-300 hover:bg-white cursor-pointer"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isRented}
                              onChange={() => {}}
                              className={clsx(
                                "w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500",
                                isRented ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                              )}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">{p.pillarCode}</span>
                                <span className={clsx(
                                  'text-[10px] px-2 py-0.5 rounded-full font-bold',
                                  isLarge ? 'bg-purple-100 text-purple-700' :
                                  isSmall ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-blue-100 text-blue-700'
                                )}>
                                  {p.pillarTypeName || (isLarge ? 'Trụ Lớn' : isSmall ? 'Trụ Nhỏ' : 'Trụ Vừa')} ({p.capacityHoles || 36} hốc)
                                </span>
                                {isRented ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 flex items-center gap-0.5">
                                    🔒 Đã được thuê
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                                    🟢 Khả dụng
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                Diện tích: {p.requiredArea || (isLarge ? 2.0 : isSmall ? 1.0 : 1.5)} m² • Thuê: {(p.price || 200000).toLocaleString('vi-VN')} đ/tháng
                                {selectedTree && ` • Giống rau: ${treeCostForP.toLocaleString('vi-VN')}đ`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700">
                              {(p.price || 200000).toLocaleString('vi-VN')}đ/th
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                      Mã các trụ: <strong>{slot.pillarCodes?.join(', ') || slot.pillarCode}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chọn giống rau trồng */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-green-600" /> Chọn Giống Rau / Cây Trồng Thủy Canh
                </h3>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                  Tính theo kích thước từng trụ
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Mỗi loại rau có thời gian sinh trưởng và lượng phôi hạt giống khác nhau theo từng kích thước trụ ({chosenPillarCount} trụ đã chọn).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trees.map(t => {
                  const isSelected = selectedTreeId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTreeId(t.id)}
                      className={clsx(
                        'p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 relative',
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-gray-50/50 border-gray-200 hover:border-emerald-200 hover:bg-white'
                      )}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                        <Sprout className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-gray-900 truncate">{t.treeName}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Thu hoạch: ~{t.harvestDays} ngày</div>
                        <div className="text-xs font-black text-emerald-700 mt-1">
                          Từ {t.price?.toLocaleString('vi-VN')}đ (24 hốc)
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Hóa Đơn Thuê Canh Tác</h2>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="label font-medium text-gray-700">Ngày bắt đầu canh tác</label>
                  <input type="date" className="input rounded-xl font-medium" value={startDate} onChange={e => { setStartDate(e.target.value); setBookingError(''); }} min={new Date().toLocaleDateString('en-CA')} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0 font-medium text-gray-700">Thời gian thuê</label>
                    <span className="text-xs text-gray-500 font-medium">(Tối thiểu 1 tháng)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`input rounded-xl font-medium pr-16 ${monthsError ? 'border-red-500 focus:ring-red-400' : ''}`}
                      placeholder="Nhập số tháng thuê..."
                      value={monthsInput}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => handleMonthsChange(e.target.value)}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none">
                      tháng
                    </div>
                  </div>
                  {monthsError && (
                    <p className="text-xs text-red-600 font-medium mt-1.5 flex items-center gap-1">
                      ⚠️ {monthsError}
                    </p>
                  )}
                  {/* Gợi ý chọn nhanh các gói tháng */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMonthsInput(m.toString());
                          setBookingMonths(m);
                          setMonthsError('');
                          setBookingError('');
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                          bookingMonths === m && !monthsError
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {m} tháng
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bảng chi tiết tính giá minh bạch */}
                <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Thuê {chosenPillarCount} trụ ({chosenPillars.map(p => p.pillarCode).join(', ') || 'Chưa chọn'}):</span>
                    <span className="font-semibold text-gray-900">{pillarsMonthlyPrice.toLocaleString('vi-VN')}đ × {bookingMonths} th = {slotRentTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {selectedTree && (
                    <div className="flex justify-between text-gray-600">
                      <span>Cây giống ({selectedTree.treeName}):</span>
                      <span className="font-semibold text-gray-900">{Math.round(treeTotal).toLocaleString('vi-VN')}đ ({chosenPillarCount} trụ)</span>
                    </div>
                  )}
                  <div className="border-t border-emerald-200/80 pt-2 flex justify-between font-black text-sm text-emerald-950">
                    <span>Tổng thanh toán</span>
                    <span className="text-emerald-700 text-base">{Math.round(finalPrice).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
              </div>

              {bookingError && (
                <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-xs mb-4 font-medium border border-red-100">{bookingError}</div>
              )}

              <button onClick={handleBook}
                className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 rounded-2xl font-bold shadow-lg shadow-emerald-600/20">
                <Calendar className="w-5 h-5" /> Đặt thuê & Thanh toán ngay
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  <Link to="/login" className="text-emerald-600 font-bold hover:underline">Đăng nhập</Link> để đặt thuê và nhận thông báo chăm sóc.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking confirmation modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Xác nhận đặt thuê ô vườn</h2>
            <p className="text-gray-500 text-xs mb-5">Hệ thống sẽ chuyển tiếp đến cổng thanh toán VNPay</p>
            
            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Mã ô vườn:</span><span className="font-bold text-gray-900">{slot.slotNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Các trụ đã chọn:</span><span className="font-bold text-emerald-700">{chosenPillars.map(p => p.pillarCode).join(', ')} ({chosenPillarCount} trụ - {totalHoles} hốc)</span></div>
              {slot.locationName && <div className="flex justify-between"><span className="text-gray-500">Cơ sở:</span><span className="font-semibold text-gray-900">{slot.locationName}</span></div>}
              {selectedTree && <div className="flex justify-between"><span className="text-gray-500">Giống rau chọn:</span><span className="font-bold text-emerald-700">{selectedTree.treeName}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Ngày bắt đầu:</span><span className="font-semibold text-gray-900">{startDate}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Thời gian thuê:</span><span className="font-semibold text-gray-900">{bookingMonths} tháng</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-black text-emerald-900">
                <span>Tổng chi phí:</span>
                <span className="text-emerald-700 text-base">{Math.round(finalPrice).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={confirmBooking} disabled={booking} className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl font-bold shadow-md">
                {booking ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý thanh toán...</> : 'Xác nhận & Thanh toán VNPay'}
              </button>
              <button onClick={() => setShowBookingModal(false)} disabled={booking} className="btn-secondary w-full py-2.5 rounded-xl">Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
