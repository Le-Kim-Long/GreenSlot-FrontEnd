import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Grid3X3, MapPin, ChevronLeft, Calendar, DollarSign, Loader2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { bookingApi, type AvailableSlot } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';

export default function GardenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bookingMonths, setBookingMonths] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    bookingApi.getAvailableSlots()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find(s => s.id === Number(id));
        if (found) {
          setSlot(found);
        } else {
          setError('Không tìm thấy ô vườn này hoặc đã được thuê');
        }
      })
      .catch(() => setError('Không thể tải thông tin ô vườn'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!startDate) { setBookingError('Vui lòng chọn ngày bắt đầu'); return; }
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!slot) return;
    setBooking(true);
    setBookingError('');
    try {
      const result = await bookingApi.bookSlot({
        slotId: slot.id,
        durationInMonths: bookingMonths,
        startTime: new Date(startDate).toISOString(),
      });
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

  const totalPrice = slot ? slot.price * bookingMonths : 0;
  const discount = bookingMonths >= 3 ? totalPrice * 0.05 : 0;
  const finalPrice = totalPrice - discount;

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/gardens" className="hover:text-green-600 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Danh sách ô vườn
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{slot.slotNumber}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Slot info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Grid3X3 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{slot.slotNumber}</h1>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">Trống</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {slot.pillarCode && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500">Trụ</div>
                    <div className="text-sm font-semibold text-gray-900">{slot.pillarCode}</div>
                  </div>
                )}
                {slot.locationName && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500">Vị trí</div>
                    <div className="text-sm font-semibold text-gray-900">{slot.locationName}</div>
                  </div>
                )}
                {slot.locationAddress && (
                  <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                    <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Địa chỉ</div>
                    <div className="text-sm font-semibold text-gray-900">{slot.locationAddress}</div>
                  </div>
                )}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Giá thuê</div>
                  <div className="text-sm font-bold text-green-600">{slot.price.toLocaleString('vi-VN')}đ/tháng</div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <div className="mb-4">
                <span className="text-3xl font-black text-green-600">{slot.price.toLocaleString('vi-VN')}đ</span>
                <span className="text-gray-500">/tháng</span>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="label">Ngày bắt đầu</label>
                  <input type="date" className="input" value={startDate} onChange={e => { setStartDate(e.target.value); setBookingError(''); }} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="label">Số tháng thuê</label>
                  <select className="input" value={bookingMonths} onChange={e => setBookingMonths(Number(e.target.value))}>
                    {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} tháng</option>)}
                  </select>
                </div>
                <div className="bg-green-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{slot.price.toLocaleString('vi-VN')}đ × {bookingMonths} tháng</span>
                    <span className="font-medium">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá (≥3 tháng 5%)</span>
                      <span>-{Math.round(discount).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="border-t border-green-200 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span>{Math.round(finalPrice).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              {bookingError && (
                <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-sm mb-3">{bookingError}</div>
              )}

              <button onClick={handleBook}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" /> Đặt thuê ngay
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  <Link to="/login" className="text-green-600 font-medium">Đăng nhập</Link> để đặt thuê
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking confirmation modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác nhận đặt thuê</h2>
            <p className="text-gray-500 text-sm mb-5">Kiểm tra thông tin trước khi thanh toán qua VNPay</p>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Ô vườn</span><span className="font-medium">{slot.slotNumber}</span></div>
              {slot.locationName && <div className="flex justify-between text-sm"><span className="text-gray-600">Vị trí</span><span className="font-medium">{slot.locationName}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-600">Ngày bắt đầu</span><span className="font-medium">{startDate}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Thời gian</span><span className="font-medium">{bookingMonths} tháng</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tổng tiền</span><span className="font-bold text-green-600">{Math.round(finalPrice).toLocaleString('vi-VN')}đ</span></div>
            </div>
            <div className="space-y-2">
              <button onClick={confirmBooking} disabled={booking} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {booking ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : 'Xác nhận & Thanh toán VNPay'}
              </button>
              <button onClick={() => setShowBookingModal(false)} disabled={booking} className="btn-secondary w-full py-2.5">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
