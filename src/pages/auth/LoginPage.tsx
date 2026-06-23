import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, AlertCircle, Sprout, Sun, Droplets, Wind } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function FloatingLeaf({ delay, x, size, duration }: { delay: number; x: number; size: number; duration: number }) {
  return (
    <div
      className="absolute text-green-300/30 pointer-events-none"
      style={{
        left: `${x}%`,
        top: '-5%',
        fontSize: `${size}px`,
        animation: `floatDown ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      <Leaf className="w-full h-full" style={{ width: size, height: size }} />
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(form.email, form.password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError('Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating leaves */}
        <FloatingLeaf delay={0} x={10} size={24} duration={8} />
        <FloatingLeaf delay={2} x={30} size={16} duration={10} />
        <FloatingLeaf delay={4} x={60} size={20} duration={9} />
        <FloatingLeaf delay={1} x={80} size={18} duration={11} />
        <FloatingLeaf delay={3} x={45} size={14} duration={7} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold">GreenSlot</span>
          </div>

          <h1 className="text-4xl font-black mb-4 leading-tight">
            Canh tác đô thị<br />
            <span className="text-green-200">thông minh</span>
          </h1>
          <p className="text-green-100/80 text-lg mb-10 max-w-md">
            Thuê vườn, giám sát IoT và chăm sóc cây trồng — tất cả trong một nền tảng.
          </p>

          {/* Feature cards */}
          <div className="space-y-4">
            {[
              { icon: <Sprout className="w-5 h-5" />, title: 'Vườn thông minh', desc: 'Hàng trăm ô vườn sẵn sàng' },
              { icon: <Sun className="w-5 h-5" />, title: 'Giám sát 24/7', desc: 'IoT theo dõi nhiệt độ, độ ẩm' },
              { icon: <Droplets className="w-5 h-5" />, title: 'Tưới tự động', desc: 'Hệ thống tưới thông minh' },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10 hover:bg-white/15 transition-all duration-300"
                style={{ animation: `slideInLeft 0.5s ease-out ${0.2 + i * 0.15}s both` }}
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-green-200/70 text-xs">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full text-green-800/30">
            <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
          </svg>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-green-50/30 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Green<span className="text-green-600">Slot</span></span>
            </Link>
          </div>

          {/* Welcome icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 animate-bounce" style={{ animationDuration: '3s' }}>
              <Wind className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-green-900/5 border border-white/80 p-8" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-gray-900 mb-1">Chào mừng trở lại!</h1>
              <p className="text-gray-500 text-sm">Đăng nhập để tiếp tục với GreenSlot</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email hoặc Username</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'email' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="text"
                    className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none rounded-xl"
                    placeholder="Nhập email hoặc username"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'password' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="w-full bg-transparent px-4 py-3 pr-12 text-sm focus:outline-none rounded-xl"
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer group">
                  <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="group-hover:text-gray-900 transition-colors">Ghi nhớ</span>
                </label>
                <Link to="/forgot-password" className="text-green-600 hover:text-green-700 font-semibold hover:underline">Quên mật khẩu?</Link>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang đăng nhập...
                  </span>
                ) : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-bold hover:underline">Đăng ký ngay</Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> Bảo mật SSL</span>
            <span className="flex items-center gap-1"><Sprout className="w-3 h-3" /> 100+ vườn</span>
            <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> IoT 24/7</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatDown {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
