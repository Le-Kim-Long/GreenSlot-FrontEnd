import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Leaf, Wifi, Wrench, TrendingUp, CreditCard, Bell, Plus, CheckCircle, X, Loader2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { bookingApi, type BookingHistory } from '../../api/bookingApi';
import { managerApi } from '../../api/managerApi';
import { taskApi } from '../../api/taskApi';
import { resolveSlotId, cacheSlotForRental } from '../../utils/slotCache';
import type { ServiceType } from '../../types/api';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/customer', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn đang thuê', path: '/dashboard/customer/rentals', icon: <Leaf className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/customer/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Dịch vụ chăm sóc', path: '/dashboard/customer/care', icon: <Wrench className="w-full h-full" /> },
  { label: 'Lịch sử thanh toán', path: '/dashboard/customer/payments', icon: <CreditCard className="w-full h-full" /> },
  { label: 'Thông báo', path: '/dashboard/customer/notifications', icon: <Bell className="w-full h-full" /> },
];

interface RentalWithSlot extends BookingHistory {
  resolvedSlotId?: number;
}

export default function CareServicesPage() {
  const [searchParams] = useSearchParams();
  const [activeRentals, setActiveRentals] = useState<RentalWithSlot[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypesBlocked, setServiceTypesBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ slotId: 0, serviceTypeId: 0, description: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qpSlotId = Number(searchParams.get('slotId'));
    const qpServiceTypeId = Number(searchParams.get('serviceTypeId'));

    Promise.all([
      bookingApi.getHistory().catch(() => []),
      managerApi.getServiceTypes().catch(() => null),
    ]).then(([rentals, types]) => {
      const active: RentalWithSlot[] = rentals
        .filter(r => r.status === 'ACTIVE')
        .map(r => ({
          ...r,
          resolvedSlotId: resolveSlotId(r.slotNumber, r.id),
        }));

      setActiveRentals(active);
      if (types) {
        setServiceTypes(types);
        setServiceTypesBlocked(false);
      } else {
        setServiceTypes([]);
        setServiceTypesBlocked(true);
      }

      const firstSlot = active.find(r => r.resolvedSlotId)?.resolvedSlotId ?? qpSlotId;
      if (firstSlot) setForm(f => ({ ...f, slotId: firstSlot }));
      if (types?.[0]) setForm(f => ({ ...f, serviceTypeId: types[0].id }));
      else if (qpServiceTypeId) setForm(f => ({ ...f, serviceTypeId: qpServiceTypeId }));
    }).finally(() => setLoading(false));
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!form.slotId || !form.serviceTypeId) return;
    setSaving(true);
    setError('');
    try {
      await taskApi.requestService({
        slotId: form.slotId,
        serviceTypeId: form.serviceTypeId,
        description: form.description || undefined,
      });
      const rental = activeRentals.find(r => r.resolvedSlotId === form.slotId);
      if (rental) cacheSlotForRental(rental.id, form.slotId);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setShowModal(false); }, 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gửi yêu cầu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const selectedService = serviceTypes.find(s => s.id === form.serviceTypeId);
  const canSubmit = form.slotId > 0 && form.serviceTypeId > 0;

  return (
    <DashboardLayout navItems={navItems} title="Dịch vụ chăm sóc cây">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dịch vụ chăm sóc</h2>
          <p className="text-gray-500 text-sm mt-1">POST /api/services/request — yêu cầu dịch vụ cho slot đang thuê ACTIVE</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm" disabled={activeRentals.length === 0}>
          <Plus className="w-4 h-4" /> Đặt dịch vụ
        </button>
      </div>

      {serviceTypesBlocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm flex gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            BE không cho CUSTOMER đọc <code className="text-xs">/manager/service-types</code>.
            Nhập mã dịch vụ (serviceTypeId) do quản lý cung cấp, hoặc đặt dịch vụ ngay sau khi thuê ô vườn.
          </div>
        </div>
      )}

      {error && !showModal && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : activeRentals.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Bạn cần có ô vườn ACTIVE để đặt dịch vụ</p>
          <Link to="/gardens" className="text-green-600 text-sm mt-2 block">Thuê ô vườn →</Link>
        </div>
      ) : (
        <>
          {serviceTypes.length > 0 && (
            <div className="card mb-6">
              <h3 className="font-bold text-lg mb-4">Danh mục dịch vụ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map(svc => (
                  <div key={svc.id} className="border rounded-xl p-4 hover:border-green-300 cursor-pointer"
                    onClick={() => { setForm(p => ({ ...p, serviceTypeId: svc.id })); setShowModal(true); }}>
                    <div className="font-semibold">{svc.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{svc.description}</div>
                    <div className="text-sm font-bold text-green-600 mt-2">{svc.price?.toLocaleString('vi-VN')}đ</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-bold text-lg mb-2">Ô vườn đang thuê</h3>
            <div className="space-y-2">
              {activeRentals.map(r => (
                <div key={r.id} className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm">
                  <div>
                    <span className="font-medium">{r.slotNumber} — {r.locationName}</span>
                    {!r.resolvedSlotId && (
                      <div className="text-xs text-orange-600 mt-1">
                        Chưa có slotId (cache). Thuê lại từ <Link to="/gardens" className="underline">/gardens</Link> để lưu mapping.
                      </div>
                    )}
                  </div>
                  <span className="badge-green">ACTIVE</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Yêu cầu đã gửi!</h3>
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-5">
                  <h2 className="text-xl font-bold">Đặt dịch vụ</h2>
                  <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
                </div>
                {error && <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-sm mb-3">{error}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="label">Slot ID (gardenSlot.id)</label>
                    {activeRentals.some(r => r.resolvedSlotId) ? (
                      <select className="input" value={form.slotId} onChange={e => setForm(p => ({ ...p, slotId: Number(e.target.value) }))}>
                        {activeRentals.filter(r => r.resolvedSlotId).map(r => (
                          <option key={r.id} value={r.resolvedSlotId}>{r.slotNumber} — {r.locationName}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="number" className="input" placeholder="Nhập slotId từ lúc đặt thuê"
                        value={form.slotId || ''} onChange={e => setForm(p => ({ ...p, slotId: Number(e.target.value) }))} />
                    )}
                  </div>
                  <div>
                    <label className="label">Service Type ID</label>
                    {serviceTypes.length > 0 ? (
                      <select className="input" value={form.serviceTypeId} onChange={e => setForm(p => ({ ...p, serviceTypeId: Number(e.target.value) }))}>
                        {serviceTypes.map(s => (
                          <option key={s.id} value={s.id}>{s.name} — {s.price?.toLocaleString('vi-VN')}đ</option>
                        ))}
                      </select>
                    ) : (
                      <input type="number" className="input" placeholder="Mã dịch vụ từ quản lý"
                        value={form.serviceTypeId || ''} onChange={e => setForm(p => ({ ...p, serviceTypeId: Number(e.target.value) }))} />
                    )}
                  </div>
                  <div>
                    <label className="label">Ghi chú</label>
                    <textarea className="input resize-none" rows={3} value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  {selectedService && (
                    <div className="bg-green-50 rounded-xl p-3 text-sm flex justify-between">
                      <span>Phí dịch vụ</span>
                      <span className="font-bold text-green-600">{selectedService.price?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <button onClick={handleSubmit} disabled={saving || !canSubmit} className="btn-primary w-full">
                    {saving ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
