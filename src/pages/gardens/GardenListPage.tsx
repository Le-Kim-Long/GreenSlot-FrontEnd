import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Wifi, Users, SlidersHorizontal, X } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { mockGardens } from '../../data/mockData';
import type { Garden } from '../../types';
import clsx from 'clsx';

export default function GardenListPage() {
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hasIoT, setHasIoT] = useState(false);
  const [hasCare, setHasCare] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  const districts = [...new Set(mockGardens.map(g => g.district))];

  const filtered = mockGardens
    .filter(g => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.address.toLowerCase().includes(search.toLowerCase())) return false;
      if (district && g.district !== district) return false;
      if (statusFilter && g.status !== statusFilter) return false;
      if (priceRange === 'under1m' && g.pricePerMonth >= 1000000) return false;
      if (priceRange === '1m-2m' && (g.pricePerMonth < 1000000 || g.pricePerMonth > 2000000)) return false;
      if (priceRange === 'over2m' && g.pricePerMonth <= 2000000) return false;
      if (hasIoT && !g.hasIoT) return false;
      if (hasCare && !g.hasCareService) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.pricePerMonth - b.pricePerMonth;
      if (sortBy === 'price_desc') return b.pricePerMonth - a.pricePerMonth;
      return 0;
    });

  const statusBadge = (status: Garden['status']) => {
    const map = { available: { label: 'Còn chỗ', cls: 'badge-green' }, rented: { label: 'Đã thuê', cls: 'badge-red' }, maintenance: { label: 'Bảo trì', cls: 'badge-yellow' } };
    const s = map[status];
    return <span className={s.cls}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Khám phá vườn canh tác</h1>
          <p className="text-gray-500 mb-6">Tìm vườn thẳng đứng phù hợp với nhu cầu của bạn tại TP.HCM</p>

          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" className="input pl-10 py-3" placeholder="Tìm theo tên vườn, địa chỉ..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowFilter(!showFilter)} className={clsx('flex items-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-colors', showFilter ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')}>
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
            </button>
          </div>

          {/* Filters */}
          {showFilter && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Quận/Huyện</label>
                <select className="input" value={district} onChange={e => setDistrict(e.target.value)}>
                  <option value="">Tất cả</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Khoảng giá</label>
                <select className="input" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                  <option value="">Tất cả</option>
                  <option value="under1m">Dưới 1 triệu</option>
                  <option value="1m-2m">1 - 2 triệu</option>
                  <option value="over2m">Trên 2 triệu</option>
                </select>
              </div>
              <div>
                <label className="label">Trạng thái</label>
                <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">Tất cả</option>
                  <option value="available">Còn chỗ</option>
                  <option value="rented">Đã thuê</option>
                </select>
              </div>
              <div>
                <label className="label">Sắp xếp</label>
                <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="price_asc">Giá thấp nhất</option>
                  <option value="price_desc">Giá cao nhất</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-4 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={hasIoT} onChange={e => setHasIoT(e.target.checked)} className="rounded" />
                  Có hệ thống IoT
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={hasCare} onChange={e => setHasCare(e.target.checked)} className="rounded" />
                  Có dịch vụ chăm sóc
                </label>
                <button onClick={() => { setDistrict(''); setPriceRange(''); setStatusFilter(''); setHasIoT(false); setHasCare(false); setSortBy('rating'); }} className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                  <X className="w-4 h-4" /> Xóa bộ lọc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 text-sm">Tìm thấy <span className="font-semibold text-gray-900">{filtered.length}</span> vườn</p>
          <div className="flex gap-2">
            {[Filter].map((_, i) => (
              <span key={i} className="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">TP. Hồ Chí Minh</span>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy vườn phù hợp</h3>
            <p className="text-gray-500">Hãy thử điều chỉnh bộ lọc tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(garden => (
              <Link key={garden.id} to={`/gardens/${garden.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="relative h-52 overflow-hidden">
                  <img src={garden.images[0]} alt={garden.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {statusBadge(garden.status)}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1">
                    {garden.hasIoT && (
                      <span className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        <Wifi className="w-3 h-3" /> IoT
                      </span>
                    )}
                    {garden.hasCareService && (
                      <span className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        <Users className="w-3 h-3" /> Chăm sóc
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{garden.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-amber-500 flex-shrink-0 ml-2">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="font-medium">{garden.rating}</span>
                      <span className="text-gray-400">({garden.reviewCount})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{garden.district} · {garden.address}</span>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">{garden.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {garden.plantTypes.slice(0, 3).map(p => (
                      <span key={p} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                    {garden.plantTypes.length > 3 && <span className="text-xs text-gray-400">+{garden.plantTypes.length - 3}</span>}
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">{(garden.pricePerMonth / 1000000).toFixed(1)}tr</span>
                      <span className="text-gray-500 text-sm">/tháng</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{garden.area}m² · {garden.floors} tầng</span>
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
