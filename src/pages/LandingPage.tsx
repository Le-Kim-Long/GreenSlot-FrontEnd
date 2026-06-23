import { Link } from 'react-router-dom';
import { Leaf, Wifi, Users, Star, ArrowRight, CheckCircle, Sprout, ShieldCheck, BarChart3, Droplets, Thermometer, Sun, MapPin, ChevronRight, Play, Zap, Heart, ArrowDown, Quote } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { mockGardens } from '../data/mockData';
import { useScrollReveal, useCounter } from '../hooks/useScrollReveal';
import clsx from 'clsx';

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={clsx(className, 'transition-all duration-1000')}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(60px)',
      }}
    >
      {children}
    </div>
  );
}

function RevealItem({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal(0.05);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ end, suffix = '', isActive }: { end: number; suffix?: string; isActive: boolean }) {
  const value = useCounter(end, 2000, 0, isActive);
  return <>{value.toLocaleString('vi-VN')}{suffix}</>;
}

function StatCard({ value, suffix, label, icon, isActive, delay }: { value: number; suffix: string; label: string; icon: React.ReactNode; isActive: boolean; delay: number }) {
  const { ref, isVisible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className="bg-white rounded-3xl p-6 shadow-sm border border-green-100 text-center hover:shadow-xl hover:shadow-green-200/50 hover:-translate-y-2 transition-all duration-500 group"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-400 mx-auto mb-4 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
        {icon}
      </div>
      <div className="text-4xl font-black text-white mb-1">
        <AnimatedCounter end={value} suffix={suffix} isActive={isActive && isVisible} />
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const featuredGardens = mockGardens.filter(g => g.status === 'available').slice(0, 3);
  const statsReveal = useScrollReveal(0.1);

  const howItWorks = [
    { step: '01', title: 'Chọn vườn phù hợp', desc: 'Duyệt qua hàng trăm vườn canh tác thẳng đứng, lọc theo vị trí, diện tích và giá cả.', icon: <Sprout className="w-6 h-6" />, color: 'from-green-500 to-emerald-600' },
    { step: '02', title: 'Đặt thuê & Thanh toán', desc: 'Đặt thuê trực tuyến dễ dàng, thanh toán an toàn qua VNPay, MoMo hoặc chuyển khoản.', icon: <CheckCircle className="w-6 h-6" />, color: 'from-blue-500 to-cyan-600' },
    { step: '03', title: 'Giám sát qua IoT', desc: 'Theo dõi nhiệt độ, độ ẩm, ánh sáng và dinh dưỡng cây trồng theo thời gian thực.', icon: <Wifi className="w-6 h-6" />, color: 'from-purple-500 to-violet-600' },
    { step: '04', title: 'Thu hoạch & Thưởng thức', desc: 'Nhận rau sạch tự trồng hoặc yêu cầu nhân viên chăm sóc thu hoạch giúp bạn.', icon: <Heart className="w-6 h-6" />, color: 'from-orange-500 to-red-500' },
  ];

  const services = [
    { icon: <Droplets className="w-7 h-7" />, title: 'Tưới cây tự động', desc: 'Hệ thống tưới nhỏ giọt thông minh, điều chỉnh lượng nước theo nhu cầu', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 group-hover:bg-blue-100', iconColor: 'text-blue-500' },
    { icon: <Thermometer className="w-7 h-7" />, title: 'Kiểm soát môi trường', desc: 'Giám sát và điều chỉnh nhiệt độ, độ ẩm, CO₂ tối ưu', color: 'from-red-500 to-orange-500', bg: 'bg-red-50 group-hover:bg-red-100', iconColor: 'text-red-500' },
    { icon: <Sun className="w-7 h-7" />, title: 'Đèn LED chuyên dụng', desc: 'Đèn chiếu sáng spectrum đầy đủ, thay thế ánh sáng tự nhiên', color: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-50 group-hover:bg-yellow-100', iconColor: 'text-yellow-500' },
    { icon: <BarChart3 className="w-7 h-7" />, title: 'Phân tích dữ liệu', desc: 'Báo cáo chi tiết tăng trưởng, tiêu thụ năng lượng, năng suất', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50 group-hover:bg-purple-100', iconColor: 'text-purple-500' },
    { icon: <ShieldCheck className="w-7 h-7" />, title: 'Bảo vệ cây trồng', desc: 'Phát hiện sớm sâu bệnh qua camera AI, can thiệp sinh học', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 group-hover:bg-green-100', iconColor: 'text-green-500' },
    { icon: <Users className="w-7 h-7" />, title: 'Chăm sóc chuyên nghiệp', desc: 'Đội ngũ chuyên gia nông nghiệp đô thị hỗ trợ 6 ngày/tuần', color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50 group-hover:bg-indigo-100', iconColor: 'text-indigo-500' },
  ];

  const testimonials = [
    { name: 'Nguyễn Thị Lan', role: 'Kỹ sư phần mềm', comment: 'GreenSlot giúp tôi có rau sạch tự trồng ngay tại nhà mà không cần dành quá nhiều thời gian. App giám sát IoT rất tiện!', rating: 5, avatar: 'L', color: 'from-green-400 to-emerald-500' },
    { name: 'Trần Văn Minh', role: 'Bác sĩ', comment: 'Chất lượng rau tuyệt vời, không thuốc trừ sâu. Dịch vụ chăm sóc định kỳ rất chuyên nghiệp và đúng giờ.', rating: 5, avatar: 'M', color: 'from-blue-400 to-indigo-500' },
    { name: 'Lê Thị Thu', role: 'Giáo viên', comment: 'Giao diện đẹp, dễ sử dụng. Cảm biến IoT cảnh báo rất nhanh khi nhiệt độ bất thường. Rất đáng đầu tư!', rating: 4, avatar: 'T', color: 'from-purple-400 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-[#f0faf4] overflow-x-hidden">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-yellow-300/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-[10%] w-[600px] h-[600px] bg-cyan-300/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Floating elements */}
        <div className="absolute top-[15%] right-[15%] animate-float">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 rotate-12 shadow-lg">
            <Leaf className="w-8 h-8 text-white/80" />
          </div>
        </div>
        <div className="absolute bottom-[25%] right-[25%] animate-float-delayed">
          <div className="w-12 h-12 bg-yellow-300/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-yellow-200/30 -rotate-12 shadow-lg">
            <Wifi className="w-6 h-6 text-yellow-200/80" />
          </div>
        </div>
        <div className="absolute top-[40%] right-[8%] animate-float-slow">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
            <Sprout className="w-7 h-7 text-white/70" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="slide-up">
              <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-5 py-2 text-sm text-white font-medium mb-8 backdrop-blur-sm shadow-sm">
                <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
                Nền tảng canh tác đô thị #1 Việt Nam
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
                Vườn Xanh
                <br />
                <span className="bg-gradient-to-r from-yellow-200 via-lime-200 to-emerald-200 bg-clip-text text-transparent">Giữa Lòng</span>
                <br />
                Thành Phố
              </h1>
              <p className="text-lg text-white/80 mb-10 leading-relaxed max-w-xl">
                Thuê ô vườn thông minh, giám sát IoT 24/7 và nhận dịch vụ chăm sóc chuyên nghiệp. Tự trồng rau sạch chưa bao giờ dễ dàng đến thế.
              </p>
              <div className="flex flex-wrap gap-4 mb-12">
                <Link to="/gardens" className="group flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-2xl hover:bg-yellow-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5">
                  Khám phá vườn
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/how-it-works" className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/25 transition-all">
                  <Play className="w-5 h-5" /> Tìm hiểu thêm
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/70">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-yellow-300" /> Miễn phí đăng ký</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-yellow-300" /> Bảo mật 100%</span>
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-300" /> Setup 5 phút</span>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4 slide-up-delayed">
              {[
                { value: '150+', label: 'Vườn hoạt động', icon: <Sprout className="w-5 h-5" /> },
                { value: '1,200+', label: 'Khách hàng', icon: <Users className="w-5 h-5" /> },
                { value: '98%', label: 'Cây sống khỏe', icon: <Heart className="w-5 h-5" /> },
                { value: '24/7', label: 'Giám sát IoT', icon: <Wifi className="w-5 h-5" /> },
              ].map((s, i) => (
                <div key={s.label} className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/30 hover:border-white/40 transition-all duration-500 hover:-translate-y-1 group shadow-lg" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">{s.icon}</div>
                  <div className="text-3xl font-black text-white mb-1">{s.value}</div>
                  <div className="text-sm text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDown className="w-5 h-5 text-white/50" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
            <path fill="#0f1a12" d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ============ STATS (mobile) ============ */}
      <section className="lg:hidden bg-[#f0faf4] py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 gap-4" ref={statsReveal.ref}>
          <StatCard value={150} suffix="+" label="Vườn hoạt động" icon={<Sprout className="w-6 h-6" />} isActive={statsReveal.isVisible} delay={0} />
          <StatCard value={1200} suffix="+" label="Khách hàng" icon={<Users className="w-6 h-6" />} isActive={statsReveal.isVisible} delay={100} />
          <StatCard value={98} suffix="%" label="Cây sống khỏe" icon={<Heart className="w-6 h-6" />} isActive={statsReveal.isVisible} delay={200} />
          <StatCard value={24} suffix="/7" label="Giám sát IoT" icon={<Wifi className="w-6 h-6" />} isActive={statsReveal.isVisible} delay={300} />
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-24 bg-[#f0faf4] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-green-200">
              <Zap className="w-4 h-4" /> Đơn giản & Nhanh chóng
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Bắt đầu chỉ 4 bước</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Từ đăng ký đến thu hoạch rau sạch, mọi thứ đều dễ dàng</p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, idx) => (
              <RevealItem key={idx} delay={idx * 150} className="relative">
                <div className="bg-white rounded-3xl p-7 border border-green-100 hover:shadow-2xl hover:shadow-green-200/50 hover:-translate-y-3 transition-all duration-500 relative overflow-hidden group h-full hover:border-green-300">
                  <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-15 rounded-full blur-2xl transition-opacity duration-500`} />
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bước {item.step}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED GARDENS ============ */}
      <section className="py-24 bg-[#e6f5ec] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-emerald-200">
                  <Leaf className="w-4 h-4" /> Đang mở đặt
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">Vườn nổi bật</h2>
                <p className="text-gray-400 text-lg">Các vườn đang có chỗ trống, sẵn sàng canh tác</p>
              </div>
              <Link to="/gardens" className="hidden sm:flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-5 py-2.5 rounded-xl transition-colors border border-green-200">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredGardens.map((garden, i) => (
              <RevealItem key={garden.id} delay={i * 200}>
                <Link to={`/gardens/${garden.id}`} className="group bg-white rounded-3xl overflow-hidden border border-green-100 hover:shadow-2xl hover:shadow-green-200/50 hover:-translate-y-3 transition-all duration-700 block hover:border-green-300">
                  <div className="relative h-56 overflow-hidden">
                    <img src={garden.images[0]} alt={garden.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm text-green-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{garden.district}</span>
                      {garden.hasIoT && (
                        <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Wifi className="w-3 h-3" /> IoT
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-black text-white drop-shadow-lg">{garden.pricePerMonth.toLocaleString('vi-VN')}đ</span>
                        <span className="text-white/70 text-sm">/tháng</span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-sm px-2.5 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{garden.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-600 transition-colors">{garden.name}</h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {garden.address}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{garden.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {garden.plantTypes.slice(0, 3).map(p => (
                          <span key={p} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">{p}</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{garden.area}m²</span>
                    </div>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link to="/gardens" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700">
              Xem tất cả vườn <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="py-24 bg-[#f0faf4] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-200/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-purple-200">
              <Zap className="w-4 h-4" /> Công nghệ hiện đại
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Công nghệ & Dịch vụ</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Tích hợp công nghệ tiên tiến để mang lại trải nghiệm canh tác tốt nhất</p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <RevealItem key={i} delay={i * 100}>
                <div className="group bg-white rounded-3xl p-7 border border-green-100 hover:shadow-2xl hover:shadow-green-200/50 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden h-full hover:border-green-300">
                  <div className={`absolute -bottom-16 -right-16 w-40 h-40 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-15 rounded-full blur-2xl transition-all duration-700`} />
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 bg-green-50 ${s.iconColor} group-hover:scale-110 group-hover:rotate-3`}>
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors duration-300">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Tìm hiểu thêm <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-24 bg-[#e6f5ec] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-amber-200">
              <Star className="w-4 h-4" /> Đánh giá 4.9/5
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Khách hàng yêu thích</h2>
            <p className="text-gray-400 text-lg">Hàng nghìn người đã tin tưởng GreenSlot</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <RevealItem key={i} delay={i * 200}>
                <div className="relative bg-white rounded-3xl p-8 border border-green-100 hover:shadow-2xl hover:shadow-green-200/50 hover:-translate-y-2 transition-all duration-500 group h-full hover:border-green-300">
                  {/* Hover glow */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-700`} />

                  <Quote className="w-10 h-10 text-green-200 mb-4 group-hover:text-green-300 transition-colors duration-500" />

                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={clsx('w-5 h-5 transition-all duration-300', j < t.rating ? 'text-amber-400 fill-amber-400 group-hover:scale-110' : 'text-gray-200 fill-gray-200')} style={{ transitionDelay: `${j * 50}ms` }} />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6 relative z-10 text-[15px]">"{t.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${t.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white font-bold text-lg">{t.avatar}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.name}</p>
                      <p className="text-gray-500 text-sm">{t.role}</p>
                    </div>
                  </div>
                </div>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <RevealSection>
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-[20%] w-96 h-96 bg-yellow-300/15 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 right-[20%] w-96 h-96 bg-cyan-300/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-5 py-2 text-sm text-white font-medium mb-8 backdrop-blur-sm shadow-sm">
              <Sprout className="w-4 h-4 text-yellow-200" /> Ưu đãi tháng đầu giảm 20%
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Bắt đầu hành trình
              <br />
              <span className="bg-gradient-to-r from-yellow-200 to-lime-200 bg-clip-text text-transparent">xanh của bạn</span>
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
              Đăng ký miễn phí hôm nay. Không cần thẻ tín dụng. Hủy bất kỳ lúc nào.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="group bg-white text-green-700 font-bold px-10 py-4 rounded-2xl hover:bg-yellow-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 flex items-center gap-2 text-lg">
                Đăng ký ngay — Miễn phí
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/gardens" className="border-2 border-white/30 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-white/15 transition-all text-lg backdrop-blur-sm">
                Xem các vườn
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-yellow-200" /> Đăng ký miễn phí</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-yellow-200" /> Không cam kết dài hạn</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-yellow-200" /> Hỗ trợ 24/7</span>
            </div>
          </div>
        </section>
      </RevealSection>

      <Footer />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(12deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(-12deg); }
          50% { transform: translateY(-15px) rotate(-12deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out 1s infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out 0.5s infinite; }
        .slide-up { animation: slideUp 0.8s ease-out both; }
        .slide-up-delayed { animation: slideUp 0.8s ease-out 0.3s both; }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
