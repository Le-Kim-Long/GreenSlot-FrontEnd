import { useState } from 'react';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Plus, CheckCircle, Clock, X } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { mockCareRequests, mockCareServices, mockRentals } from '../../data/mockData';
import clsx from 'clsx';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

const categoryIcons: Record<string, string> = {
  watering: '💧', fertilizing: '🌱', pruning: '✂️',
  pest_control: '🛡️', harvest: '🌾', consultation: '💬',
};

export default function CareServicesPage() {
  const { user } = useAuth();
  const myRentals = mockRentals.filter(r => r.customerId === user?.id && r.status === 'active');
  const myRequests = mockCareRequests.filter(r => r.customerId === user?.id);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ gardenId: myRentals[0]?.gardenId || '', serviceId: '', date: '', time: '08:00', notes: '' });
  const [success, setSuccess] = useState(false);

  const statusConfig: Record<string, { label: string; cls: string; icon: JSX.Element }> = {
    pending: { label: 'Chờ xác nhận', cls: 'badge-yellow', icon: <Clock className="w-3 h-3" /> },
    assigned: { label: 'Đã phân công', cls: 'badge-blue', icon: <CheckCircle className="w-3 h-3" /> },
    in_progress: { label: 'Đang thực hiện', cls: 'badge-green', icon: <CheckCircle className="w-3 h-3" /> },
    completed: { label: 'Hoàn thành', cls: 'badge-gray', icon: <CheckCircle className="w-3 h-3" /> },
    cancelled: { label: 'Đã hủy', cls: 'badge-red', icon: <X className="w-3 h-3" /> },
  };

  const handleSubmit = () => {
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setShowModal(false); }, 2000);
  };

  return (
    <DashboardLayout navItems={navItems} title="Dịch vụ chăm sóc cây">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dịch vụ chăm sóc</h2>
          <p className="text-gray-500 text-sm mt-1">Đặt lịch nhân viên chuyên nghiệp đến chăm sóc vườn của bạn</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm" disabled={myRentals.length === 0}>
          <Plus className="w-4 h-4" /> Đặt dịch vụ
        </button>
      </div>

      {/* Service catalog */}
      <div className="card mb-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Danh mục dịch vụ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCareServices.map(svc => (
            <div key={svc.id} className="border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50/50 transition-colors cursor-pointer"
              onClick={() => { setForm(p => ({ ...p, serviceId: svc.id })); setShowModal(true); }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {categoryIcons[svc.category]}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{svc.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{svc.description}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-green-600">{svc.price.toLocaleString('vi-VN')}đ</span>
                    <span className="text-xs text-gray-400">{svc.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My requests */}
      <div className="card">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Lịch chăm sóc của tôi</h3>
        {myRequests.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có yêu cầu chăm sóc nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map(req => {
              const sc = statusConfig[req.status];
              return (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {categoryIcons[mockCareServices.find(s => s.id === req.serviceId)?.category || 'watering']}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{req.serviceName}</div>
                      <div className="text-sm text-gray-500">{req.gardenName}</div>
                      <div className="text-sm text-gray-500">{req.scheduledDate} lúc {req.scheduledTime}</div>
                      {req.staffName && (
                        <div className="text-xs text-green-600 mt-0.5">Nhân viên: {req.staffName}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className={clsx('flex items-center gap-1', sc.cls)}>{sc.icon}{sc.label}</span>
                    <span className="font-bold text-gray-900 text-sm">{req.price.toLocaleString('vi-VN')}đ</span>
                    {(req.status === 'pending') && (
                      <button className="text-xs text-red-500 hover:text-red-700 underline">Hủy</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt lịch thành công!</h3>
                <p className="text-gray-500 text-sm">Chúng tôi sẽ liên hệ xác nhận trong vòng 24h</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Đặt dịch vụ chăm sóc</h2>
                  <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">Vườn cần chăm sóc</label>
                    <select className="input" value={form.gardenId} onChange={e => setForm(p => ({ ...p, gardenId: e.target.value }))}>
                      {myRentals.map(r => <option key={r.gardenId} value={r.gardenId}>{r.gardenName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Dịch vụ</label>
                    <select className="input" value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))}>
                      <option value="">-- Chọn dịch vụ --</option>
                      {mockCareServices.map(s => (
                        <option key={s.id} value={s.id}>{s.name} — {s.price.toLocaleString('vi-VN')}đ</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Ngày thực hiện</label>
                      <input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <label className="label">Giờ bắt đầu</label>
                      <input type="time" className="input" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Ghi chú (tùy chọn)</label>
                    <textarea className="input resize-none" rows={3} placeholder="Yêu cầu đặc biệt..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  {form.serviceId && (
                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Phí dịch vụ</span>
                        <span className="font-bold text-green-600">
                          {mockCareServices.find(s => s.id === form.serviceId)?.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={handleSubmit} className="btn-primary flex-1 py-2.5" disabled={!form.gardenId || !form.serviceId || !form.date}>
                      Xác nhận đặt lịch
                    </button>
                    <button onClick={() => setShowModal(false)} className="btn-secondary px-4">Hủy</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
