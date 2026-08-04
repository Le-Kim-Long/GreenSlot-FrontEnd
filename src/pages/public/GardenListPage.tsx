import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X, Grid3X3, DollarSign, LogIn } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import { bookingApi, type AvailableSlot } from '../../api/bookingApi';
import clsx from 'clsx';

export default function GardenListPage() {
  const { isAuthenticated } = useAuth();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    bookingApi.getAvailableSlots()
      .then(data => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setError('Không thể tải danh sách ô vườn'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">Đăng nhập để xem ô vườn</h2>
          <p className="text-gray-500 text-sm mb-6">API <code>/bookings/available</code> yêu cầu JWT trên backend hiện tại.</p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2"><LogIn className="w-4 h-4" /> Đăng nhập</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = slots
    .filter(s => {
      if (search) {
        const q = search.toLowerCase();
        const matchSlot = s.slotNumber?.toLowerCase().includes(q);
        const matchLocation = s.locationName?.toLowerCase().includes(q);
        const matchPillar = s.pillarCode?.toLowerCase().includes(q);
        if (!matchSlot && !matchLocation && !matchPillar) return false;
      }
      if (priceRange === 'under500k' && s.price >= 500000) return false;
      if (priceRange === '500k-1m' && (s.price < 500000 || s.price > 1000000)) return false;
      if (priceRange === 'over1m' && s.price <= 1000000) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ô vườn trống</h1>
          <p className="text-gray-500 mb-6">Chọn ô vườn phù hợp và đặt thuê ngay</p>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" className="input pl-10 py-3" placeholder="Tìm theo mã ô, vị trí..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowFilter(!showFilter)} className={clsx('flex items-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-colors', showFilter ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')}>
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
            </button>
          </div>

          {showFilter && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Khoảng giá</label>
                <select className="input" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                  <option value="">Tất cả</option>
                  <option value="under500k">Dưới 500k</option>
                  <option value="500k-1m">500k - 1 triệu</option>
                  <option value="over1m">Trên 1 triệu</option>
                </select>
              </div>
              <div>
                <label className="label">Sắp xếp</label>
                <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="price_asc">Giá thấp nhất</option>
                  <option value="price_desc">Giá cao nhất</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setPriceRange(''); setSortBy('price_asc'); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                  <X className="w-4 h-4" /> Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 text-sm">
            Tìm thấy <span className="font-semibold text-gray-900">{filtered.length}</span> ô vườn trống
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy ô vườn phù hợp</h3>
            <p className="text-gray-500">Hãy thử điều chỉnh bộ lọc tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(slot => (
              <Link key={slot.id} to={`/gardens/slot/${slot.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Grid3X3 className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
                      Trống
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-green-600 transition-colors">
                    {slot.slotNumber}
                  </h3>

                  {slot.pillarCode && (
                    <p className="text-sm text-gray-500 mb-1">Trụ: {slot.pillarCode}</p>
                  )}

                  {slot.locationName && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{slot.locationName}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xl font-bold text-green-600">{slot.price.toLocaleString('vi-VN')}đ</span>
                      <span className="text-gray-500 text-sm">/tháng</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
