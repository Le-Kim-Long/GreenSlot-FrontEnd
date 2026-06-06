import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Calendar, TrendingUp, Settings, DollarSign, CheckCircle, Upload } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/owner', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Vườn của tôi', path: '/dashboard/owner/gardens', icon: <Leaf className="w-full h-full" /> },
  { label: 'Quản lý thuê', path: '/dashboard/owner/rentals', icon: <Calendar className="w-full h-full" /> },
  { label: 'Doanh thu', path: '/dashboard/owner/revenue', icon: <DollarSign className="w-full h-full" /> },
  { label: 'Cài đặt', path: '/dashboard/owner/settings', icon: <Settings className="w-full h-full" /> },
];

const AMENITY_OPTIONS = ['Hệ thống tưới tự động', 'Đèn LED chuyên dụng', 'Cảm biến IoT', 'Camera giám sát', 'WiFi', 'Hydroponics', 'Năng lượng mặt trời', 'Phân compost', 'Máy lọc nước', 'Kho chứa thiết bị', 'Robot tưới', 'Bình phân hữu cơ'];
const PLANT_OPTIONS = ['Rau cải', 'Xà lách', 'Húng quế', 'Cải thìa', 'Cà chua bi', 'Dâu tây', 'Dưa leo', 'Ớt chuông', 'Chanh leo', 'Rau muống', 'Cải bó xôi', 'Microgreens', 'Cây dược liệu', 'Cây cảnh'];

export default function AddGardenPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', address: '', district: '', area: '', floors: '',
    pricePerMonth: '', hasIoT: false, hasCareService: false,
    amenities: [] as string[], plantTypes: [] as string[],
  });

  const districts = ['Quận 1', 'Quận 3', 'Quận 5', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Phú Nhuận', 'Thủ Đức', 'Bình Dương'];

  const toggleItem = (key: 'amenities' | 'plantTypes', val: string) => {
    setForm(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val],
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => navigate('/dashboard/owner/gardens'), 2000);
  };

  if (submitted) {
    return (
      <DashboardLayout navItems={navItems} title="Thêm vườn mới">
        <div className="card max-w-lg mx-auto text-center py-20">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký vườn thành công!</h2>
          <p className="text-gray-500">Vườn của bạn đang được xem xét. Chúng tôi sẽ phê duyệt trong vòng 24-48h.</p>
        </div>
      </DashboardLayout>
    );
  }

  const steps = [
    { n: 1, label: 'Thông tin cơ bản' },
    { n: 2, label: 'Tiện ích & Cây trồng' },
    { n: 3, label: 'Giá & Dịch vụ' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Thêm vườn mới">
      <div className="max-w-2xl mx-auto">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${step >= s.n ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-green-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Thông tin cơ bản</h2>
              <div>
                <label className="label">Tên vườn *</label>
                <input className="input" placeholder="VD: Vườn Xanh Quận 1" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Mô tả chi tiết *</label>
                <textarea className="input resize-none" rows={4} placeholder="Mô tả về vườn của bạn..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Địa chỉ *</label>
                <input className="input" placeholder="Số nhà, tên đường, phường" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="label">Quận/Huyện *</label>
                <select className="input" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}>
                  <option value="">-- Chọn quận --</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Diện tích (m²) *</label>
                  <input type="number" className="input" placeholder="25" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Số tầng *</label>
                  <input type="number" className="input" placeholder="4" value={form.floors} onChange={e => setForm(p => ({ ...p, floors: e.target.value }))} />
                </div>
              </div>
              {/* Image upload */}
              <div>
                <label className="label">Hình ảnh vườn</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Kéo thả hoặc click để upload hình ảnh</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 10MB</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Tiện ích & Loại cây</h2>
              <div>
                <label className="label mb-3 block">Tiện ích có sẵn</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AMENITY_OPTIONS.map(a => (
                    <label key={a} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm ${form.amenities.includes(a) ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                      <input type="checkbox" className="hidden" checked={form.amenities.includes(a)} onChange={() => toggleItem('amenities', a)} />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${form.amenities.includes(a) ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                        {form.amenities.includes(a) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      {a}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label mb-3 block">Loại cây phù hợp</label>
                <div className="flex flex-wrap gap-2">
                  {PLANT_OPTIONS.map(p => (
                    <button key={p} type="button" onClick={() => toggleItem('plantTypes', p)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${form.plantTypes.includes(p) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Giá thuê & Dịch vụ</h2>
              <div>
                <label className="label">Giá thuê mỗi tháng (VNĐ) *</label>
                <div className="relative">
                  <input type="number" className="input pr-12" placeholder="1500000" value={form.pricePerMonth} onChange={e => setForm(p => ({ ...p, pricePerMonth: e.target.value }))} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                </div>
                {form.pricePerMonth && (
                  <p className="text-sm text-green-600 mt-1">{Number(form.pricePerMonth).toLocaleString('vi-VN')}đ/tháng</p>
                )}
              </div>
              <div className="space-y-3">
                <label className="label">Dịch vụ tích hợp</label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-green-300 transition-colors">
                  <input type="checkbox" checked={form.hasIoT} onChange={e => setForm(p => ({ ...p, hasIoT: e.target.checked }))} className="w-4 h-4 text-green-600 rounded" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Hệ thống IoT giám sát</div>
                    <div className="text-xs text-gray-500">Cảm biến nhiệt độ, độ ẩm, ánh sáng, tưới tự động</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-green-300 transition-colors">
                  <input type="checkbox" checked={form.hasCareService} onChange={e => setForm(p => ({ ...p, hasCareService: e.target.checked }))} className="w-4 h-4 text-green-600 rounded" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Dịch vụ chăm sóc chuyên nghiệp</div>
                    <div className="text-xs text-gray-500">Nhân viên đến tưới, bón phân, thu hoạch theo yêu cầu</div>
                  </div>
                </label>
              </div>
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Tóm tắt đăng ký</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Tên vườn</span><span className="font-medium">{form.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Địa chỉ</span><span className="font-medium">{form.district || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Diện tích</span><span className="font-medium">{form.area ? `${form.area}m²` : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Giá/tháng</span><span className="font-bold text-green-600">{form.pricePerMonth ? `${Number(form.pricePerMonth).toLocaleString('vi-VN')}đ` : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">IoT</span><span>{form.hasIoT ? '✅' : '❌'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Chăm sóc</span><span>{form.hasCareService ? '✅' : '❌'}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary">← Quay lại</button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">Tiếp theo →</button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Đăng ký vườn
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
