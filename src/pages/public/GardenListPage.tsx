import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X, Grid3X3, LogIn, Phone, Ruler, Building2, CheckCircle2, ChevronRight } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { bookingApi, type AvailableSlot } from '../../api/bookingApi';
import { locationApi, type LocationDTO } from '../../api/locationApi';
import clsx from 'clsx';

export default function GardenListPage() {
  const { isAuthenticated } = useAuth();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // 1. Tải danh sách các cơ sở (public)
  useEffect(() => {
    locationApi.getLocations()
      .then(locs => setLocations(Array.isArray(locs) ? locs : []))
      .catch(() => {});
  }, []);

  // 2. Tải danh sách ô vườn theo cơ sở đã chọn (hoặc tất cả)
  useEffect(() => {
    setLoading(true);
    const locIdParam = selectedLocationId ? Number(selectedLocationId) : undefined;
    bookingApi.getAvailableSlots(locIdParam)
      .then(data => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setError('Không thể tải danh sách ô vườn'))
      .finally(() => setLoading(false));
  }, [selectedLocationId]);

  const activeLocation = locations.find(l => l.id === Number(selectedLocationId));

  const filtered = slots
    .filter(s => {
      if (search) {
        const q = search.toLowerCase();
        const matchSlot = s.slotNumber?.toLowerCase().includes(q);
        const matchLocation = s.locationName?.toLowerCase().includes(q);
        const matchAddress = s.locationAddress?.toLowerCase().includes(q);
        const matchPillar = s.pillarCode?.toLowerCase().includes(q);
        if (!matchSlot && !matchLocation && !matchAddress && !matchPillar) return false;
      }
      if (priceRange === 'under500k' && s.price >= 500000) return false;
      if (priceRange === '500k-1m' && (s.price < 500000 || s.price > 1000000)) return false;
      if (priceRange === 'over1m' && s.price <= 1000000) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return b.id - a.id;
    });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200/60 mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Hệ thống cơ sở GreenSlot</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chọn cơ sở & Thuê ô vườn</h1>
              <p className="text-gray-500 text-sm mt-1">Lựa chọn cơ sở gần bạn nhất và đặt thuê ô vườn thông minh theo nhu cầu</p>
            </div>
            
            {!isAuthenticated && (
              <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition">
                <LogIn className="w-4 h-4" /> Đăng nhập để thuê
              </Link>
            )}
          </div>

          {/* Location Selector Tabs / Pills */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Chọn cơ sở vườn:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setSelectedLocationId('');
                  setCurrentPage(1);
                }}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap border shadow-sm',
                  selectedLocationId === ''
                    ? 'bg-green-600 text-white border-green-600 shadow-green-600/20'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Tất cả cơ sở</span>
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  selectedLocationId === '' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                )}>
                  {slots.length} ô
                </span>
              </button>

              {locations.map((loc) => {
                const isSelected = selectedLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setSelectedLocationId(loc.id);
                      setCurrentPage(1);
                    }}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap border shadow-sm',
                      isSelected
                        ? 'bg-green-600 text-white border-green-600 shadow-green-600/20'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <MapPin className={clsx('w-4 h-4', isSelected ? 'text-white' : 'text-green-600')} />
                    <span>{loc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Facility Information Card (if a specific location is selected) */}
          {activeLocation && (
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 mb-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950 text-base">{activeLocation.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 font-semibold">
                      Đang hoạt động
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-800">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{activeLocation.address || 'TP. Hồ Chí Minh'}</span>
                    </div>
                    {activeLocation.contactPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Hotline: {activeLocation.contactPhone}</span>
                      </div>
                    )}
                    {activeLocation.area && (
                      <div className="flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Diện tích: {activeLocation.area.toLocaleString('vi-VN')} m²</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocationId('');
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline self-start sm:self-center"
                >
                  Xem tất cả cơ sở
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="input pl-10 py-3 text-sm"
                placeholder="Tìm kiếm theo mã ô, mã trụ, địa chỉ cơ sở..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilter(!showFilter)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-colors',
                showFilter
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Bộ lọc</span>
            </button>
          </div>

          {/* Collapsible Advanced Filters */}
          {showFilter && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
              <div>
                <label className="label text-xs font-bold text-gray-700 mb-1">Cơ sở</label>
                <select
                  className="input bg-white text-sm"
                  value={selectedLocationId}
                  onChange={e => {
                    setSelectedLocationId(e.target.value ? Number(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tất cả cơ sở</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs font-bold text-gray-700 mb-1">Khoảng giá</label>
                <select className="input bg-white text-sm" value={priceRange} onChange={e => {
                  setPriceRange(e.target.value);
                  setCurrentPage(1);
                }}>
                  <option value="">Tất cả mức giá</option>
                  <option value="under500k">Dưới 500.000đ</option>
                  <option value="500k-1m">500.000đ - 1.000.000đ</option>
                  <option value="over1m">Trên 1.000.000đ</option>
                </select>
              </div>
              <div>
                <label className="label text-xs font-bold text-gray-700 mb-1">Sắp xếp</label>
                <select className="input bg-white text-sm" value={sortBy} onChange={e => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}>
                  <option value="price_asc">Giá tăng dần (thấp nhất)</option>
                  <option value="price_desc">Giá giảm dần (cao nhất)</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex justify-end pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocationId('');
                    setPriceRange('');
                    setSortBy('price_asc');
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition"
                >
                  <X className="w-4 h-4" /> Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 text-sm font-medium">
            Tìm thấy <span className="font-bold text-gray-900">{filtered.length}</span> ô vườn trống
            {activeLocation ? ` tại ${activeLocation.name}` : ' trên toàn hệ thống'}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Đang tải danh sách ô vườn...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <Grid3X3 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Không có ô vườn nào phù hợp</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
              Hiện tại cơ sở này không có ô vườn trống hoặc không khớp bộ lọc tìm kiếm của bạn.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedLocationId('');
                setPriceRange('');
                setSearch('');
                setCurrentPage(1);
              }}
              className="btn-secondary text-xs px-4 py-2"
            >
              Xem tất cả cơ sở khác
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(slot => {
                const allPillars = slot.pillars || [];
                const availablePillars = allPillars.filter(p => !p.isRented && p.status !== 'RENTED');
                const pCount = allPillars.length || slot.pillarCodes?.length || 1;
                const availCount = allPillars.length > 0 ? availablePillars.length : pCount;
                const holes = slot.totalHoles || (pCount * 36);
                const slotArea = slot.area || 3.0;
                const startingPrice = availablePillars.length > 0 
                  ? availablePillars.reduce((sum, p) => sum + (p.price || 0), 0)
                  : (slot.calculatedPillarsPrice || slot.price || 0);

                return (
                  <Link
                    key={slot.id}
                    to={`/gardens/slot/${slot.id}`}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-300 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3.5">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform text-emerald-700">
                          <Grid3X3 className="w-6 h-6" />
                        </div>
                        <span className={clsx(
                          "text-xs px-3 py-1 rounded-full font-bold border flex items-center gap-1",
                          availCount > 0
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200/60"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        )}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {availCount > 0 ? `${availCount}/${pCount} trụ trống` : 'Hết trụ'}
                        </span>
                      </div>

                      <h3 className="font-black text-gray-900 text-lg mb-1 group-hover:text-emerald-600 transition-colors">
                        Ô {slot.slotNumber}
                      </h3>

                      {/* Badge năng suất & diện tích */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🌱 {holes} hốc rau
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                          {slotArea} m² ({pCount} trụ)
                        </span>
                      </div>

                      {slot.locationName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-gray-800 truncate" title={slot.locationName}>
                            {slot.locationName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 pt-0">
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-gray-400">Giá thuê trọn gói từ</div>
                          <div className="text-lg font-black text-emerald-700">
                            {startingPrice.toLocaleString('vi-VN')}đ
                            <span className="text-gray-400 text-xs font-normal">/tháng</span>
                          </div>
                        </div>
                        <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filtered.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filtered.length / pageSize) || 1}
                  totalItems={filtered.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[8, 16, 24, 32]}
                  itemName="ô vườn"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
