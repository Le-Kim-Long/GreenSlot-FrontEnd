import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPwd: '', role: 'customer' as UserRole, phone: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'customer', label: 'Khách hàng', desc: 'Thuê vườn và chăm sóc cây' },
    { value: 'owner', label: 'Chủ vườn', desc: 'Đăng ký cho thuê vườn của bạn' },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPwd) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const ok = await register(form.name, form.email, form.password, form.role);
    setLoading(false);
    if (ok) {
      navigate(form.role === 'owner' ? '/dashboard/owner' : '/dashboard/customer');
    } else {
      setError('Email đã được sử dụng');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Green<span className="text-green-600">Slot</span></span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tạo tài khoản</h1>
          <p className="text-gray-500 text-sm mb-6">Tham gia cộng đồng canh tác đô thị thông minh</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="label">Vai trò của bạn</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value as UserRole }))}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${form.role === r.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    {form.role === r.value && <CheckCircle className="w-4 h-4 text-green-600 mb-1" />}
                    <div className="text-sm font-semibold text-gray-900">{r.label}</div>
                    <div className="text-xs text-gray-500">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Họ và tên</label>
              <input type="text" className="input" placeholder="Nguyễn Văn A" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="email@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>

            <div>
              <label className="label">Số điện thoại</label>
              <input type="tel" className="input" placeholder="0901234567" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>

            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="Ít nhất 6 ký tự" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Xác nhận mật khẩu</label>
              <input type="password" className="input" placeholder="Nhập lại mật khẩu" value={form.confirmPwd}
                onChange={e => setForm(p => ({ ...p, confirmPwd: e.target.value }))} required />
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" className="mt-0.5 rounded border-gray-300" required />
              <span>Tôi đồng ý với <a href="#" className="text-green-600">Điều khoản dịch vụ</a> và <a href="#" className="text-green-600">Chính sách bảo mật</a> của GreenSlot</span>
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
