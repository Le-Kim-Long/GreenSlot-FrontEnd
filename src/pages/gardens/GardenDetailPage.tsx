import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Wifi, Users, ChevronLeft, CheckCircle, Phone, Mail, Calendar, ArrowRight, Thermometer, Droplets, Sun, Wind } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { mockGardens } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export default function GardenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeImg, setActiveImg] = useState(0);
  const [bookingMonths, setBookingMonths] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const garden = mockGardens.find(g => g.id === id);

  if (!garden) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h2 className="text-xl font-semibold">Không tìm thấy vườn</h2>
          <Link to="/gardens" className="text-green-600 mt-2 block">← Quay lại</Link>
        </div>
      </div>
    );
  }

  const handleBook = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setShowBookingModal(true);
  };

  const statusMap = { available: { label: 'Còn chỗ', cls: 'badge-green' }, rented: { label: 'Đã thuê', cls: 'badge-red' }, maintenance: { label: 'Đang bảo trì', cls: 'badge-yellow' } };
  const s = statusMap[garden.status];

  const specs = [
    { icon: <MapPin className="w-5 h-5" />, label: 'Vị trí', value: `${garden.district}, ${garden.city}` },
    { icon: <Sun className="w-5 h-5" />, label: 'Diện tích', value: `${garden.area} m²` },
    { icon: <Wind className="w-5 h-5" />, label: 'Số tầng', value: `${garden.floors} tầng` },
    { icon: <Thermometer className="w-5 h-5" />, label: 'Cảm biến IoT', value: garden.hasIoT ? 'Có đầy đủ' : 'Không có' },
    { icon: <Droplets className="w-5 h-5" />, label: 'Tưới tự động', value: 'Có' },
    { icon: <Users className="w-5 h-5" />, label: 'Dịch vụ chăm sóc', value: garden.hasCareService ? 'Có' : 'Không có' },
  ];

  const mockReviews = [
    { name: 'Nguyễn Thị Lan', rating: 5, date: '20/11/2024', comment: 'Vườn rất sạch sẽ, cảm biến hoạt động tốt. Rau xanh và tươi!', avatar: 'N' },
    { name: 'Trần Văn Minh', rating: 4, date: '15/10/2024', comment: 'Dịch vụ tốt, nhân viên nhiệt tình. Vị trí tiện lợi.', avatar: 'T' },
    { name: 'Lê Thị Thu', rating: 5, date: '08/09/2024', comment: 'Rất hài lòng! App giám sát rất tiện, theo dõi được cây mọi lúc.', avatar: 'L' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/gardens" className="hover:text-green-600 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Danh sách vườn
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{garden.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-72 sm:h-96">
                <img src={garden.images[activeImg] || garden.images[0]} alt={garden.name} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={s.cls}>{s.label}</span>
                  {garden.hasIoT && (
                    <span className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      <Wifi className="w-3 h-3" /> IoT
                    </span>
                  )}
                </div>
              </div>
              {garden.images.length > 1 && (
                <div className="flex gap-2 p-3">
                  {garden.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-green-500' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Rating */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{garden.name}</h1>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    {garden.address}, {garden.district}, {garden.city}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-5 h-5 fill-amber-500" />
                    <span className="text-xl font-bold text-gray-900">{garden.rating}</span>
                  </div>
                  <div className="text-sm text-gray-400">{garden.reviewCount} đánh giá</div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">{garden.description}</p>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Thông số kỹ thuật</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="text-green-600 mt-0.5">{spec.icon}</div>
                    <div>
                      <div className="text-xs text-gray-500">{spec.label}</div>
                      <div className="text-sm font-semibold text-gray-900">{spec.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tiện ích</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {garden.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Plant types */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Loại cây phù hợp</h2>
              <div className="flex flex-wrap gap-2">
                {garden.plantTypes.map(p => (
                  <span key={p} className="bg-green-100 text-green-800 text-sm px-3 py-1.5 rounded-full font-medium">{p}</span>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Đánh giá ({garden.reviewCount})</h2>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500" />
                  <span className="font-bold text-gray-900">{garden.rating}</span>
                  <span className="text-gray-500 text-sm">/5</span>
                </div>
              </div>
              <div className="space-y-4">
                {mockReviews.map((r, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-bold text-sm">{r.avatar}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.date}</div>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <div className="mb-4">
                <span className="text-3xl font-black text-green-600">{garden.pricePerMonth.toLocaleString('vi-VN')}đ</span>
                <span className="text-gray-500">/tháng</span>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="label">Ngày bắt đầu</label>
                  <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">Số tháng thuê</label>
                  <select className="input" value={bookingMonths} onChange={e => setBookingMonths(Number(e.target.value))}>
                    {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} tháng</option>)}
                  </select>
                </div>
                <div className="bg-green-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{garden.pricePerMonth.toLocaleString('vi-VN')}đ × {bookingMonths} tháng</span>
                    <span className="font-medium">{(garden.pricePerMonth * bookingMonths).toLocaleString('vi-VN')}đ</span>
                  </div>
                  {bookingMonths >= 3 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá (≥3 tháng 5%)</span>
                      <span>-{Math.round(garden.pricePerMonth * bookingMonths * 0.05).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="border-t border-green-200 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span>{(garden.pricePerMonth * bookingMonths * (bookingMonths >= 3 ? 0.95 : 1)).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              <button onClick={handleBook} disabled={garden.status !== 'available'}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {garden.status === 'available' ? (
                  <><Calendar className="w-5 h-5" /> Đặt thuê ngay</>
                ) : 'Vườn không khả dụng'}
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  <Link to="/login" className="text-green-600 font-medium">Đăng nhập</Link> để đặt thuê
                </p>
              )}
            </div>

            {/* Owner info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Thông tin chủ vườn</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-bold text-lg">{garden.ownerName.charAt(0)}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{garden.ownerName}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Đã xác minh</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /> 090x xxx xxx</div>
                <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /> owner@gmail.com</div>
              </div>
              <button className="btn-outline-green w-full mt-4 text-sm flex items-center justify-center gap-1">
                Liên hệ chủ vườn <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác nhận đặt thuê</h2>
            <p className="text-gray-500 text-sm mb-5">Kiểm tra thông tin trước khi xác nhận</p>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Vườn</span><span className="font-medium">{garden.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Thời gian</span><span className="font-medium">{bookingMonths} tháng</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tổng tiền</span><span className="font-bold text-green-600">{(garden.pricePerMonth * bookingMonths).toLocaleString('vi-VN')}đ</span></div>
            </div>
            <div className="space-y-2">
              <button onClick={() => { setShowBookingModal(false); navigate('/dashboard/customer/rentals'); }} className="btn-primary w-full py-2.5">Xác nhận & Thanh toán</button>
              <button onClick={() => setShowBookingModal(false)} className="btn-secondary w-full py-2.5">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
