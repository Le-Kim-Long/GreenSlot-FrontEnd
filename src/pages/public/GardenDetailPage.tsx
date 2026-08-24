import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Grid3X3, ChevronLeft, Calendar, Loader2, Sprout, Layers, Maximize2, MapPin, CheckCircle2, Sparkles, ChevronDown } from 'lucide-react';

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { bookingApi, type AvailableSlot } from '../../api/bookingApi';
import { treeApi, type Tree } from '../../api/treeApi';
import { cacheSlotId } from '../../utils/slotCache';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface ChosenPillarItem {
  id: string;
  type: 'LARGE' | 'MEDIUM' | 'SMALL';
  typeName: string;
  holes: number;
  label: string;
}

export default function GardenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);
  const [pillarTreeSelections, setPillarTreeSelections] = useState<Record<string, number>>({});
  const [activePillarTab, setActivePillarTab] = useState<string>('ALL');

  const [smallCount, setSmallCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(2);
  const [largeCount, setLargeCount] = useState(0);
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

          const slotAreaVal = found.area && found.area > 0 ? found.area : 3.0;

          // Check if slot has pre-configured template pillars
          const availablePillars = (found.pillars || []).filter(p => !p.isRented && p.status !== 'RENTED');
          if (availablePillars.length > 0) {
            const sCount = availablePillars.filter(p => p.pillarType === 'SMALL').length;
            const mCount = availablePillars.filter(p => p.pillarType === 'MEDIUM' || !p.pillarType).length;
            const lCount = availablePillars.filter(p => p.pillarType === 'LARGE').length;
            setSmallCount(sCount);
            setMediumCount(mCount);
            setLargeCount(lCount);
          } else {
            // Default optimal template allocation based on slot area
            if (slotAreaVal >= 6.0) {
              setMediumCount(4);
              setSmallCount(0);
              setLargeCount(0);
            } else if (slotAreaVal >= 4.5) {
              setMediumCount(3);
              setSmallCount(0);
              setLargeCount(0);
            } else if (slotAreaVal >= 3.0) {
              setMediumCount(2);
              setSmallCount(0);
              setLargeCount(0);
            } else {
              setMediumCount(1);
              setSmallCount(0);
              setLargeCount(0);
            }
          }

          // Check if default tree is set
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

  const slotArea = slot?.area && slot.area > 0 ? slot.area : 3.0;
  const totalAreaUsed = (smallCount * 1.0) + (mediumCount * 1.5) + (largeCount * 2.0);
  const remainingArea = slotArea - totalAreaUsed;
  const isAreaExceeded = totalAreaUsed > slotArea + 0.01;
  const totalPillarsCount = smallCount + mediumCount + largeCount;
  const totalHoles = (smallCount * 24) + (mediumCount * 36) + (largeCount * 48);

  const pillarsMonthlyPrice = (smallCount * 150000) + (mediumCount * 200000) + (largeCount * 300000);
  const slotRentTotal = pillarsMonthlyPrice * bookingMonths;

  // Danh sách từng trụ cụ thể được chọn trong ô (sắp xếp đồng bộ theo chuẩn BE: SMALL -> MEDIUM -> LARGE)
  const chosenPillars = useMemo<ChosenPillarItem[]>(() => {
    const list: ChosenPillarItem[] = [];
    for (let i = 1; i <= smallCount; i++) {
      list.push({ id: `S-${i}`, type: 'SMALL', typeName: 'Trụ Nhỏ', holes: 24, label: `Trụ Nhỏ #${i} (24 hốc)` });
    }
    for (let i = 1; i <= mediumCount; i++) {
      list.push({ id: `M-${i}`, type: 'MEDIUM', typeName: 'Trụ Vừa', holes: 36, label: `Trụ Vừa #${i} (36 hốc)` });
    }
    for (let i = 1; i <= largeCount; i++) {
      list.push({ id: `L-${i}`, type: 'LARGE', typeName: 'Trụ Lớn', holes: 48, label: `Trụ Lớn #${i} (48 hốc)` });
    }
    return list;
  }, [smallCount, mediumCount, largeCount]);

  // Tự động chuyển về tab ALL nếu trụ đang chọn không còn tồn tại
  useEffect(() => {
    if (activePillarTab !== 'ALL' && !chosenPillars.some(p => p.id === activePillarTab)) {
      setActivePillarTab('ALL');
    }
  }, [chosenPillars, activePillarTab]);

  // Đồng bộ lựa chọn giống cây cho các trụ mới thêm
  useEffect(() => {
    if (chosenPillars.length === 0) return;
    setPillarTreeSelections(prev => {
      const next = { ...prev };
      const defaultId = selectedTreeId || (trees.length > 0 ? trees[0].id : 1);
      chosenPillars.forEach(p => {
        if (!next[p.id]) {
          next[p.id] = defaultId;
        }
      });
      return next;
    });
  }, [chosenPillars, selectedTreeId, trees]);

  // Hàm chọn giống cây (áp dụng cho tất cả hoặc riêng từng trụ)
  const handleSelectTree = (treeId: number) => {
    if (activePillarTab === 'ALL') {
      setSelectedTreeId(treeId);
      const newMap: Record<string, number> = {};
      chosenPillars.forEach(p => {
        newMap[p.id] = treeId;
      });
      setPillarTreeSelections(newMap);
    } else {
      setPillarTreeSelections(prev => {
        const next = {
          ...prev,
          [activePillarTab]: treeId
        };
        // Nếu tất cả các trụ đều đang chọn cùng 1 giống này, cập nhật selectedTreeId
        const allSame = chosenPillars.length > 0 && chosenPillars.every(p => next[p.id] === treeId);
        if (allSame) {
          setSelectedTreeId(treeId);
        }
        return next;
      });
    }
  };

  const getTreeForPillar = (pillarId: string) => {
    const tId = pillarTreeSelections[pillarId] || selectedTreeId || (trees[0]?.id ?? 1);
    return trees.find(t => t.id === tId) || trees[0] || null;
  };


  const getTreePriceForPillar = (t?: Tree | null, p?: { holes: number; type?: string }) => {
    if (!t) return 0;
    const holes = p?.holes || 24;
    if (holes >= 48) {
      return Number(t.priceLarge != null ? t.priceLarge : ((t.price || 0) * 2.0));
    }
    if (holes >= 36) {
      return Number(t.priceMedium != null ? t.priceMedium : ((t.price || 0) * 1.5));
    }
    return Number(t.priceSmall != null ? t.priceSmall : (t.price || 0));
  };

  // Chi tiết giống cây và giá phôi giống theo từng trụ
  const pillarTreeDetails = useMemo(() => {
    return chosenPillars.map(p => {
      const t = getTreeForPillar(p.id);
      const cost = getTreePriceForPillar(t, p);
      return {
        pillar: p,
        tree: t,
        cost: Math.round(cost),
      };
    });
  }, [chosenPillars, pillarTreeSelections, selectedTreeId, trees]);

  const treeTotal = useMemo(() => {
    return pillarTreeDetails.reduce((sum, item) => sum + item.cost, 0);
  }, [pillarTreeDetails]);


  const finalPrice = slotRentTotal + treeTotal;

  const canAddSmall = remainingArea >= 1.0 - 0.01;
  const canAddMedium = remainingArea >= 1.5 - 0.01;
  const canAddLarge = remainingArea >= 2.0 - 0.01;

  const handleAddSmall = () => setSmallCount(prev => prev + 1);
  const handleRemoveSmall = () => setSmallCount(prev => Math.max(0, prev - 1));
  const handleAddMedium = () => setMediumCount(prev => prev + 1);
  const handleRemoveMedium = () => setMediumCount(prev => Math.max(0, prev - 1));
  const handleAddLarge = () => setLargeCount(prev => prev + 1);
  const handleRemoveLarge = () => setLargeCount(prev => Math.max(0, prev - 1));

  const maxRentalDays = bookingMonths * 30;

  // Danh sách các cây bị quá hạn sinh trưởng
  const exceededTrees = useMemo(() => {
    const list: { tree: Tree; harvestDays: number; minMonths: number }[] = [];
    const checkedIds = new Set<number>();
    pillarTreeDetails.forEach(item => {
      if (item.tree && item.tree.harvestDays && !checkedIds.has(item.tree.id)) {
        checkedIds.add(item.tree.id);
        if (item.tree.harvestDays > maxRentalDays) {
          list.push({
            tree: item.tree,
            harvestDays: item.tree.harvestDays,
            minMonths: Math.ceil(item.tree.harvestDays / 30),
          });
        }
      }
    });
    return list;
  }, [pillarTreeDetails, maxRentalDays]);

  const handleBook = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (totalPillarsCount === 0) {
      setBookingError('Vui lòng chọn ít nhất 1 trụ canh tác để thuê.');
      return;
    }
    if (isAreaExceeded) {
      setBookingError(
        `Tổng diện tích các trụ (${totalAreaUsed.toFixed(1)} m²) vượt quá diện tích ô vườn (${slotArea.toFixed(1)} m²). Ô nhỏ không thể đặt quá nhiều trụ lớn, vui lòng giảm bớt trụ hoặc chọn ô vườn lớn hơn.`
      );
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
    if (exceededTrees.length > 0) {
      const names = exceededTrees.map(e => `"${e.tree.treeName}" (~${e.harvestDays} ngày)`).join(', ');
      const maxMinMonth = Math.max(...exceededTrees.map(e => e.minMonths));
      setBookingError(
        `Thời hạn thuê (${bookingMonths} tháng = ${maxRentalDays} ngày) không đủ để các giống rau [${names}] sinh trưởng và thu hoạch. Vui lòng tăng thời gian thuê lên tối thiểu ${maxMinMonth} tháng hoặc chọn giống rau ngắn ngày hơn.`
      );
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

      const treeIdsPayload = chosenPillars.map(p => pillarTreeSelections[p.id] || selectedTreeId || (trees[0]?.id || 1));

      const result = await bookingApi.bookSlot({
        slotId: slot.id,
        durationInMonths: bookingMonths,
        startTime: startTimeIso,
        treeId: treeIdsPayload[0],
        treeIds: treeIdsPayload,
        smallPillarsCount: smallCount,
        mediumPillarsCount: mediumCount,
        largePillarsCount: largeCount,
        redirectUrl: `${window.location.origin}/payment-result`,
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-4">
            <Grid3X3 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy ô vườn</h2>
          <p className="text-gray-500 mb-6">{error || 'Ô vườn này không tồn tại hoặc đã bị xóa.'}</p>
          <Link to="/gardens" className="btn-primary">
            Quay lại danh sách
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const usagePercent = Math.min(100, Math.round((totalAreaUsed / slotArea) * 100));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link to="/gardens" className="hover:text-green-600 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Danh sách ô vườn
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">{slot.slotNumber}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Slot Info Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
                    <Grid3X3 className="w-6 h-6" />
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
                <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-600" /> Diện tích ô vườn
                  </div>
                  <div className="text-sm font-black text-emerald-900 mt-1">{slotArea.toFixed(1)} m²</div>
                </div>
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" /> Năng suất đã chọn
                  </div>
                  <div className="text-sm font-black text-emerald-800 mt-1">{totalHoles} hốc ({totalPillarsCount} trụ)</div>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Cơ sở
                  </div>
                  <div className="text-xs font-bold text-gray-900 mt-1 truncate">{slot.locationName || 'Chính'}</div>
                </div>
              </div>

              {/* Thanh đo dung lượng diện tích ô vườn */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-6">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" /> Dung Lượng Diện Tích Ô Vườn
                  </span>
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[11px]",
                    isAreaExceeded ? "bg-rose-100 text-rose-700 font-black" :
                    usagePercent === 100 ? "bg-emerald-100 text-emerald-800" :
                    "bg-blue-100 text-blue-800"
                  )}>
                    {totalAreaUsed.toFixed(1)} / {slotArea.toFixed(1)} m² ({usagePercent}%)
                  </span>
                </div>

                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full transition-all duration-300 rounded-full",
                      isAreaExceeded ? "bg-rose-500" :
                      usagePercent === 100 ? "bg-emerald-600" :
                      "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, (totalAreaUsed / slotArea) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] mt-2">
                  <span className="text-gray-500">
                    {isAreaExceeded ? (
                      <span className="text-rose-600 font-bold">⚠️ Vượt quá {(totalAreaUsed - slotArea).toFixed(1)} m² so với diện tích ô!</span>
                    ) : remainingArea >= 1.0 ? (
                      <span className="text-emerald-700 font-medium">Còn trống {remainingArea.toFixed(1)} m² (có thể chọn thêm trụ)</span>
                    ) : (
                      <span className="text-emerald-700 font-bold">Đã tận dụng tối đa 100% diện tích ô vườn</span>
                    )}
                  </span>
                  <span className="text-gray-400">
                    Ô nhỏ sẽ giới hạn số lượng trụ lớn
                  </span>
                </div>
              </div>

              {/* Bộ điều khiển chọn số lượng từng loại trụ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" /> Tùy Chỉnh Các Loại Trụ Canh Tác Trong Ô
                  </h3>
                  <span className="text-xs text-gray-500">Tự do tăng/giảm theo diện tích ô</span>
                </div>

                <div className="space-y-3">
                  {/* Trụ Lớn (48 hốc - 2.0 m²) */}
                  <div className={clsx(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    largeCount > 0 ? "bg-purple-50/60 border-purple-300 shadow-xs" : "bg-gray-50/40 border-gray-200"
                  )}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                        L
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">Trụ Lớn (Large)</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            48 hốc • Chiếm 2.0 m²
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Giá thuê: <strong className="text-purple-700">300.000đ</strong>/tháng • Năng suất gấp đôi trụ nhỏ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRemoveLarge}
                        disabled={largeCount === 0}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-gray-700 flex items-center justify-center shadow-xs text-base transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-base text-gray-900">{largeCount}</span>
                      <button
                        type="button"
                        onClick={handleAddLarge}
                        disabled={!canAddLarge}
                        title={!canAddLarge ? "Ô vườn không còn đủ 2.0 m² để thêm Trụ Lớn" : "Thêm 1 Trụ Lớn"}
                        className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold text-white flex items-center justify-center shadow-xs text-base transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Trụ Vừa (36 hốc - 1.5 m²) */}
                  <div className={clsx(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    mediumCount > 0 ? "bg-blue-50/60 border-blue-300 shadow-xs" : "bg-gray-50/40 border-gray-200"
                  )}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                        M
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">Trụ Vừa (Medium)</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            36 hốc • Chiếm 1.5 m²
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Giá thuê: <strong className="text-blue-700">200.000đ</strong>/tháng • Kích cỡ chuẩn phổ biến
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRemoveMedium}
                        disabled={mediumCount === 0}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-gray-700 flex items-center justify-center shadow-xs text-base transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-base text-gray-900">{mediumCount}</span>
                      <button
                        type="button"
                        onClick={handleAddMedium}
                        disabled={!canAddMedium}
                        title={!canAddMedium ? "Ô vườn không còn đủ 1.5 m² để thêm Trụ Vừa" : "Thêm 1 Trụ Vừa"}
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold text-white flex items-center justify-center shadow-xs text-base transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Trụ Nhỏ (24 hốc - 1.0 m²) */}
                  <div className={clsx(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    smallCount > 0 ? "bg-emerald-50/60 border-emerald-300 shadow-xs" : "bg-gray-50/40 border-gray-200"
                  )}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                        S
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">Trụ Nhỏ (Small)</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            24 hốc • Chiếm 1.0 m²
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Giá thuê: <strong className="text-emerald-700">150.000đ</strong>/tháng • Tiết kiệm diện tích
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRemoveSmall}
                        disabled={smallCount === 0}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-gray-700 flex items-center justify-center shadow-xs text-base transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-black text-base text-gray-900">{smallCount}</span>
                      <button
                        type="button"
                        onClick={handleAddSmall}
                        disabled={!canAddSmall}
                        title={!canAddSmall ? "Ô vườn không còn đủ 1.0 m² để thêm Trụ Nhỏ" : "Thêm 1 Trụ Nhỏ"}
                        className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold text-white flex items-center justify-center shadow-xs text-base transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ghi chú điều phối lắp đặt bổ sung */}
                <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-blue-800">
                  <span className="text-base shrink-0">💡</span>
                  <div>
                    <strong className="font-semibold">Lắp đặt linh hoạt theo nhu cầu:</strong> Bạn có thể tùy ý chọn loại trụ theo diện tích ô. Kỹ thuật viên của cơ sở sẽ tự động nhận lệnh kiểm tra và lắp đặt hoàn thiện đầy đủ {totalPillarsCount} trụ trước ngày bạn bắt đầu canh tác.
                  </div>
                </div>
              </div>
            </div>

            {/* Chọn giống rau trồng */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-green-600" /> Chọn Giống Rau / Cây Trồng Thủy Canh
                </h3>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tỷ lệ 1-1 theo từng trụ
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Bạn có thể gán 1 giống chung cho toàn bộ {totalPillarsCount} trụ hoặc chọn từng giống rau khác nhau cho từng trụ ({totalHoles} hốc).
              </p>

              {/* BỘ CHỌN PHẠM VI TRỤ GÁN GIỐNG CÂY (DROPDOWN) */}
              {totalPillarsCount > 0 && (
                <div className="mb-5 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <label htmlFor="pillar-select" className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Chọn trụ để tùy chỉnh giống rau:</span>
                    </label>
                    <span className="text-[11px] text-emerald-800 font-medium bg-emerald-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                      {activePillarTab === 'ALL'
                        ? `Áp dụng chung cho cả ${totalPillarsCount} trụ (${totalHoles} hốc)`
                        : `Tùy chỉnh riêng cho ${chosenPillars.find(p => p.id === activePillarTab)?.label}`}
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id="pillar-select"
                      value={activePillarTab}
                      onChange={(e) => setActivePillarTab(e.target.value)}
                      className="w-full bg-white border border-emerald-300 text-gray-900 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block p-3 pr-10 shadow-xs appearance-none cursor-pointer transition-all hover:border-emerald-400"
                    >
                      <option value="ALL" className="font-bold text-emerald-800 py-1">
                        🌱 Áp dụng 1 giống cho tất cả các trụ ({totalPillarsCount} trụ • {totalHoles} hốc)
                      </option>
                      {chosenPillars.length > 1 && (
                        <optgroup label="Tùy chỉnh giống riêng cho từng trụ:" className="font-semibold text-gray-700">
                          {chosenPillars.map(p => {
                            const assignedTree = getTreeForPillar(p.id);
                            return (
                              <option key={p.id} value={p.id} className="py-1">
                                📍 {p.label} — Đang chọn: {assignedTree?.treeName || 'Mặc định'}
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-emerald-700">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* LƯỚI GIỐNG CÂY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trees.map(t => {
                  const isExceededForRental = Boolean(t.harvestDays && t.harvestDays > maxRentalDays);
                  const treeMinMonths = t.harvestDays ? Math.ceil(t.harvestDays / 30) : 1;

                  // Kiểm tra xem cây này có đang được chọn cho tab hiện tại không
                  const isSelectedInActiveTab = activePillarTab === 'ALL'
                    ? chosenPillars.every(p => (pillarTreeSelections[p.id] || selectedTreeId) === t.id)
                    : (pillarTreeSelections[activePillarTab] || selectedTreeId) === t.id;


                  // Các trụ đang gán giống cây này
                  const assignedPillarLabels = chosenPillars
                    .filter(p => pillarTreeSelections[p.id] === t.id)
                    .map(p => p.label);

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        handleSelectTree(t.id);
                        if (isExceededForRental) {
                          setBookingError(`⚠️ Lưu ý: Giống rau "${t.treeName}" cần ~${t.harvestDays} ngày sinh trưởng. Bạn nên chọn thời gian thuê từ ${treeMinMonths} tháng trở lên.`);
                        } else {
                          setBookingError('');
                        }
                      }}
                      className={clsx(
                        'p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 relative',
                        isSelectedInActiveTab
                          ? isExceededForRental
                            ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-1 ring-amber-500/20'
                            : 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                          : assignedPillarLabels.length > 0
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : isExceededForRental
                          ? 'bg-amber-50/30 border-amber-200 hover:bg-amber-50/60'
                          : 'bg-gray-50/50 border-gray-200 hover:border-emerald-200 hover:bg-white'
                      )}
                    >
                      <div className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isExceededForRental ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        <Sprout className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-gray-900 truncate">{t.treeName}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Thu hoạch: ~{t.harvestDays} ngày</div>
                        
                        {/* Nhãn các trụ đang gán giống cây này */}
                        {assignedPillarLabels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignedPillarLabels.map(label => (
                              <span key={label} className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {label.split(' ')[0]} {label.split(' ')[1]}
                              </span>
                            ))}
                          </div>
                        )}

                        {isExceededForRental && (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 inline-block">
                              ⚠️ Cần thuê ≥ {treeMinMonths} tháng
                            </span>
                          </div>
                        )}
                        {/* Giá áp dụng cho trụ đang chọn trong Dropdown */}
                        {activePillarTab === 'ALL' ? (
                          (() => {
                            const totalAllPillarsCost = chosenPillars.reduce((sum, p) => sum + getTreePriceForPillar(t, p), 0);
                            return (
                              <div className="text-xs font-black text-emerald-700 mt-1">
                                Tổng giống cho {totalPillarsCount} trụ: +{totalAllPillarsCost.toLocaleString('vi-VN')}đ
                              </div>
                            );
                          })()
                        ) : (
                          (() => {
                            const activePillar = chosenPillars.find(p => p.id === activePillarTab);
                            const activePillarCost = getTreePriceForPillar(t, activePillar);
                            return (
                              <div className="text-xs font-black text-emerald-700 mt-1">
                                Cho {activePillar?.label}: +{activePillarCost.toLocaleString('vi-VN')}đ
                              </div>
                            );
                          })()
                        )}

                        {/* Bảng mini 3 cột hiển thị chi tiết giá theo từng loại trụ (Nhỏ 24h, Vừa 36h, Lớn 48h) */}
                        <div className="mt-2.5 pt-2 border-t border-gray-100/90">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                            <span>Giá phôi giống theo trụ:</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                            <div className="p-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-center">
                              <span className="text-[9px] text-gray-500 font-semibold">Nhỏ (24h)</span>
                              <span className="font-black text-emerald-800 mt-0.5">
                                {Number(t.priceSmall != null ? t.priceSmall : (t.price || 0)).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col justify-center">
                              <span className="text-[9px] text-gray-500 font-semibold">Vừa (36h)</span>
                              <span className="font-black text-blue-800 mt-0.5">
                                {Number(t.priceMedium != null ? t.priceMedium : ((t.price || 0) * 1.5)).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col justify-center">
                              <span className="text-[9px] text-gray-500 font-semibold">Lớn (48h)</span>
                              <span className="font-black text-purple-800 mt-0.5">
                                {Number(t.priceLarge != null ? t.priceLarge : ((t.price || 0) * 2.0)).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                      {isSelectedInActiveTab && (
                        <CheckCircle2 className={clsx(
                          "w-4 h-4 absolute top-3 right-3",
                          isExceededForRental ? "text-amber-600" : "text-emerald-600"
                        )} />
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
                    <span>Thuê {totalPillarsCount} trụ ({totalAreaUsed.toFixed(1)} m²):</span>
                    <span className="font-semibold text-gray-900">{pillarsMonthlyPrice.toLocaleString('vi-VN')}đ × {bookingMonths} th = {slotRentTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="text-[11px] text-gray-500 pl-2 space-y-0.5">
                    {largeCount > 0 && <div>• {largeCount}x Trụ Lớn (48 hốc): {(largeCount * 300000).toLocaleString('vi-VN')}đ/th</div>}
                    {mediumCount > 0 && <div>• {mediumCount}x Trụ Vừa (36 hốc): {(mediumCount * 200000).toLocaleString('vi-VN')}đ/th</div>}
                    {smallCount > 0 && <div>• {smallCount}x Trụ Nhỏ (24 hốc): {(smallCount * 150000).toLocaleString('vi-VN')}đ/th</div>}
                  </div>

                  {/* Chi tiết giống cây từng trụ */}
                  <div className="border-t border-emerald-200/60 pt-2 space-y-1">
                    <div className="flex justify-between text-gray-700 font-bold">
                      <span>Phôi giống cây trồng ({totalHoles} hốc):</span>
                      <span className="font-black text-emerald-800">{Math.round(treeTotal).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="text-[11px] text-gray-600 pl-2 space-y-0.5">
                      {pillarTreeDetails.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {item.pillar.label}: {item.tree?.treeName || 'Mặc định'}</span>
                          <span>{item.cost.toLocaleString('vi-VN')}đ</span>
                        </div>
                      ))}
                    </div>
                  </div>

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
              <div className="flex justify-between"><span className="text-gray-500">Mã ô vườn:</span><span className="font-bold text-gray-900">{slot.slotNumber} (Diện tích {slotArea.toFixed(1)} m²)</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cấu hình trụ:</span>
                <span className="font-bold text-emerald-700 text-right">
                  {totalPillarsCount} trụ ({[
                    largeCount > 0 ? `${largeCount} Trụ Lớn` : null,
                    mediumCount > 0 ? `${mediumCount} Trụ Vừa` : null,
                    smallCount > 0 ? `${smallCount} Trụ Nhỏ` : null,
                  ].filter(Boolean).join(' + ')}) • {totalHoles} hốc rau ({totalAreaUsed.toFixed(1)} m²)
                </span>
              </div>
              {slot.locationName && <div className="flex justify-between"><span className="text-gray-500">Cơ sở:</span><span className="font-semibold text-gray-900">{slot.locationName}</span></div>}
              
              <div className="border-t border-gray-200/80 pt-2 space-y-1">
                <span className="text-gray-500 font-semibold block">Giống cây theo từng trụ:</span>
                {pillarTreeDetails.map((item, idx) => (
                  <div key={idx} className="flex justify-between pl-2 text-gray-700">
                    <span>{item.pillar.label}:</span>
                    <span className="font-bold text-emerald-700">{item.tree?.treeName || 'Mặc định'} ({item.cost.toLocaleString('vi-VN')}đ)</span>
                  </div>
                ))}
              </div>

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
