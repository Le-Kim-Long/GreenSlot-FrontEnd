import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'Khách hàng', email: 'an@gmail.com', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { role: 'Chủ vườn', email: 'binh@gmail.com', color: 'bg-green-50 border-green-200 text-green-700' },
    { role: 'Nhân viên', email: 'cuong@gmail.com', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { role: 'Admin', email: 'admin@greenslot.vn', color: 'bg-red-50 border-red-200 text-red-700' },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = await login(form.email, form.password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError('Email hoặc mật khẩu không đúng');
    }
  };

  const fillDemo = (email: string) => setForm({ email, password: '123456' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Green<span className="text-green-600">Slot</span></span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h1>
          <p className="text-gray-500 text-sm mb-6">Chào mừng trở lại! Hãy đăng nhập vào tài khoản của bạn.</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="text-green-600 hover:text-green-700 font-medium">Quên mật khẩu?</a>
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">Đăng ký ngay</Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Tài khoản demo (mật khẩu: 123456)</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map(acc => (
              <button key={acc.email} onClick={() => fillDemo(acc.email)}
                className={`text-left text-xs px-3 py-2 rounded-lg border ${acc.color} hover:opacity-80 transition-opacity`}>
                <div className="font-semibold">{acc.role}</div>
                <div className="opacity-75 truncate">{acc.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
