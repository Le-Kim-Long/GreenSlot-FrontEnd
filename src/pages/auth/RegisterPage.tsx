import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, AlertCircle, Sprout, TreePine, Flower2, User, Mail, Phone, Lock, CheckCircle, AtSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function GrowingPlant({ delay, x }: { delay: number; x: number }) {
  return (
    <div
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${x}%`, animation: `growUp 4s ease-out ${delay}s both` }}
    >
      <div className="flex flex-col items-center">
        <Sprout className="w-6 h-6 text-green-400/40" />
        <div className="w-0.5 bg-green-400/20 rounded-full" style={{ height: `${30 + Math.random() * 50}px` }} />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', confirmPwd: '', phone: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (form.username.trim().length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }
    if (form.password !== form.confirmPwd) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    const ok = await register(form.username.trim(), form.name, form.email, form.password, form.phone);
    setLoading(false);
    if (ok === true) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(ok);
    }
  };

  const passwordStrength = () => {
    const len = form.password.length;
    if (len === 0) return { width: '0%', color: 'bg-gray-200', label: '' };
    if (len < 6) return { width: '33%', color: 'bg-red-400', label: 'Yếu' };
    if (len < 10) return { width: '66%', color: 'bg-yellow-400', label: 'Trung bình' };
    return { width: '100%', color: 'bg-green-500', label: 'Mạnh' };
  };

  const strength = passwordStrength();

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Tạo tài khoản thành công!</h1>
          <p className="text-gray-500 mb-6">Đang chuyển đến trang đăng nhập...</p>
          <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ animation: 'progressBar 2s linear' }} />
          </div>
        </div>
        <style>{`
          @keyframes fadeInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes progressBar { from { width: 0; } to { width: 100%; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 left-10 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-teal-400/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.8s' }} />
        </div>

        {/* Growing plants */}
        <GrowingPlant delay={0} x={5} />
        <GrowingPlant delay={0.5} x={15} />
        <GrowingPlant delay={1} x={25} />
        <GrowingPlant delay={0.3} x={55} />
        <GrowingPlant delay={0.8} x={70} />
        <GrowingPlant delay={1.2} x={85} />
        <GrowingPlant delay={0.6} x={92} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold">GreenSlot</span>
          </div>

          <h1 className="text-4xl font-black mb-4 leading-tight">
            Bắt đầu hành trình<br />
            <span className="text-emerald-200">xanh của bạn</span>
          </h1>
          <p className="text-green-100/80 text-lg mb-10 max-w-md">
            Tạo tài khoản miễn phí và khám phá hàng trăm ô vườn thông minh tại thành phố.
          </p>

          {/* Steps */}
          <div className="space-y-5">
            {[
              { icon: <User className="w-5 h-5" />, step: '01', title: 'Tạo tài khoản', desc: 'Đăng ký nhanh chỉ 1 phút' },
              { icon: <TreePine className="w-5 h-5" />, step: '02', title: 'Chọn ô vườn', desc: 'Duyệt & thuê ô vườn yêu thích' },
              { icon: <Flower2 className="w-5 h-5" />, step: '03', title: 'Bắt đầu trồng', desc: 'Giám sát & chăm sóc từ xa' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-4"
                style={{ animation: `slideInLeft 0.5s ease-out ${0.3 + i * 0.15}s both` }}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                    {s.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full text-[10px] font-bold flex items-center justify-center text-emerald-900">
                    {s.step}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-green-200/70 text-sm">{s.desc}</div>
                </div>
                {i < 2 && <div className="hidden" />}
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400'].map((c, i) => (
                <div key={i} className={`w-8 h-8 ${c} rounded-full border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-green-200/80 text-sm">
              <span className="text-white font-bold">100+</span> người đã tham gia
            </p>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full text-green-800/30">
            <path fill="currentColor" d="M0,96L60,85.3C120,75,240,53,360,48C480,43,600,53,720,64C840,75,960,85,1080,80C1200,75,1320,53,1380,42.7L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" />
          </svg>
        </div>
      </div>

      {/* Right side - register form */}
      <div className="flex-1 flex items-center justify-center p-6 py-12 bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="text-center mb-6 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Green<span className="text-green-600">Slot</span></span>
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-green-900/5 border border-white/80 p-8" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                <Sprout className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Tạo tài khoản</h1>
              <p className="text-gray-500 text-sm">Tham gia cộng đồng canh tác đô thị thông minh</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên đăng nhập</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'username' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none rounded-xl" placeholder="vd: nguyenvana"
                    value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.replace(/\s/g, '') }))}
                    onFocus={() => setFocused('username')} onBlur={() => setFocused('')} required autoComplete="username" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Dùng để đăng nhập — ít nhất 3 ký tự, không dấu cách</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Họ và tên</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'name' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none rounded-xl" placeholder="Nguyễn Văn A"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused('')} required />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'email' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none rounded-xl" placeholder="email@example.com"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')} required />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'phone' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none rounded-xl" placeholder="0901234567"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    onFocus={() => setFocused('phone')} onBlur={() => setFocused('')} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'password' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPwd ? 'text' : 'password'} className="w-full bg-transparent pl-10 pr-12 py-3 text-sm focus:outline-none rounded-xl" placeholder="Ít nhất 6 ký tự"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} rounded-full transition-all duration-500`} style={{ width: strength.width }} />
                    </div>
                    <span className="text-xs text-gray-500">{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                <div className={`relative rounded-xl border-2 transition-all duration-300 ${focused === 'confirm' ? 'border-green-500 shadow-lg shadow-green-500/10' : form.confirmPwd && form.confirmPwd === form.password ? 'border-green-400' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" className="w-full bg-transparent pl-10 pr-10 py-3 text-sm focus:outline-none rounded-xl" placeholder="Nhập lại mật khẩu"
                    value={form.confirmPwd} onChange={e => setForm(p => ({ ...p, confirmPwd: e.target.value }))}
                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')} required />
                  {form.confirmPwd && form.confirmPwd === form.password && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <input type="checkbox" className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500" required />
                <span>Tôi đồng ý với <a href="#" className="text-green-600 hover:underline font-medium">Điều khoản dịch vụ</a> và <a href="#" className="text-green-600 hover:underline font-medium">Chính sách bảo mật</a></span>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang tạo tài khoản...
                  </span>
                ) : 'Tạo tài khoản'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-bold hover:underline">Đăng nhập</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes growUp {
          from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          to { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
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
