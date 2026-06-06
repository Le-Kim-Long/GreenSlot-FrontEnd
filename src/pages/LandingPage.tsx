import { Link } from 'react-router-dom';
import { Leaf, Wifi, Users, Star, ArrowRight, CheckCircle, Sprout, ShieldCheck, BarChart3, Droplets, Thermometer, Sun, MapPin, ChevronRight } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { mockGardens } from '../data/mockData';

export default function LandingPage() {
  const featuredGardens = mockGardens.filter(g => g.status === 'available').slice(0, 3);

  const stats = [
    { value: '150+', label: 'Vườn đang hoạt động' },
    { value: '1,200+', label: 'Khách hàng hài lòng' },
    { value: '98%', label: 'Tỷ lệ cây sống' },
    { value: '24/7', label: 'Giám sát IoT' },
  ];

  const howItWorks = [
    { step: '01', title: 'Chọn vườn phù hợp', desc: 'Duyệt qua hàng trăm vườn canh tác thẳng đứng, lọc theo vị trí, diện tích và giá cả.', icon: <Sprout className="w-6 h-6" /> },
    { step: '02', title: 'Đặt thuê & Thanh toán', desc: 'Đặt thuê trực tuyến dễ dàng, thanh toán an toàn qua VNPay, MoMo hoặc chuyển khoản.', icon: <CheckCircle className="w-6 h-6" /> },
    { step: '03', title: 'Giám sát qua IoT', desc: 'Theo dõi nhiệt độ, độ ẩm, ánh sáng và dinh dưỡng cây trồng theo thời gian thực.', icon: <Wifi className="w-6 h-6" /> },
    { step: '04', title: 'Nhận dịch vụ chăm sóc', desc: 'Yêu cầu nhân viên chăm sóc chuyên nghiệp đến tưới cây, bón phân, thu hoạch.', icon: <Users className="w-6 h-6" /> },
  ];

  const services = [
    { icon: <Droplets className="w-8 h-8 text-blue-500" />, title: 'Tưới cây tự động', desc: 'Hệ thống tưới nhỏ giọt thông minh, điều chỉnh lượng nước theo nhu cầu cây trồng', color: 'bg-blue-50' },
    { icon: <Thermometer className="w-8 h-8 text-red-500" />, title: 'Kiểm soát môi trường', desc: 'Giám sát và điều chỉnh nhiệt độ, độ ẩm, CO₂ để tối ưu năng suất', color: 'bg-red-50' },
    { icon: <Sun className="w-8 h-8 text-yellow-500" />, title: 'Đèn LED chuyên dụng', desc: 'Đèn chiếu sáng spectrum đầy đủ, thay thế hoàn toàn ánh sáng tự nhiên', color: 'bg-yellow-50' },
    { icon: <BarChart3 className="w-8 h-8 text-purple-500" />, title: 'Phân tích dữ liệu', desc: 'Báo cáo chi tiết về tăng trưởng cây, tiêu thụ năng lượng và năng suất thu hoạch', color: 'bg-purple-50' },
    { icon: <ShieldCheck className="w-8 h-8 text-green-500" />, title: 'Bảo vệ cây trồng', desc: 'Phát hiện sớm sâu bệnh qua camera AI, can thiệp kịp thời bằng biện pháp sinh học', color: 'bg-green-50' },
    { icon: <Users className="w-8 h-8 text-indigo-500" />, title: 'Chăm sóc chuyên nghiệp', desc: 'Đội ngũ chuyên gia nông nghiệp đô thị sẵn sàng hỗ trợ 6 ngày/tuần', color: 'bg-indigo-50' },
  ];

  const testimonials = [
    { name: 'Nguyễn Thị Lan', role: 'Kỹ sư phần mềm', comment: 'GreenSlot giúp tôi có rau sạch tự trồng ngay tại nhà mà không cần dành quá nhiều thời gian. App giám sát IoT rất tiện!', rating: 5 },
    { name: 'Trần Văn Minh', role: 'Bác sĩ', comment: 'Chất lượng rau tuyệt vời, không thuốc trừ sâu. Dịch vụ chăm sóc định kỳ rất chuyên nghiệp và đúng giờ.', rating: 5 },
    { name: 'Lê Thị Thu', role: 'Giáo viên', comment: 'Giao diện đẹp, dễ sử dụng. Cảm biến IoT cảnh báo rất nhanh khi nhiệt độ bất thường. Rất đáng đầu tư!', rating: 4 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-700/50 border border-green-500/30 rounded-full px-4 py-1.5 text-sm text-green-200 mb-6">
              <Leaf className="w-4 h-4" />
              Nền tảng canh tác đô thị thông minh
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Vườn Xanh Của Bạn{' '}
              <span className="text-green-300">Giữa Lòng</span>{' '}
              Thành Phố
            </h1>
            <p className="text-lg sm:text-xl text-green-100 mb-8 leading-relaxed">
              GreenSlot kết nối bạn với các vườn canh tác thẳng đứng hiện đại, tích hợp IoT giám sát 24/7 và dịch vụ chăm sóc chuyên nghiệp. Tự trồng rau sạch, dễ dàng và thú vị!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/gardens" className="flex items-center gap-2 bg-white text-green-800 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
                Khám phá vườn ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="flex items-center gap-2 border border-green-400/50 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700/50 transition-colors">
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-green-900/50 border-t border-green-700/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-green-300 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Bắt đầu dễ dàng</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Chỉ 4 bước đơn giản để có vườn rau sạch riêng ngay giữa thành phố</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
                <div className="text-5xl font-black text-green-50 absolute top-4 right-4">{item.step}</div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                {idx < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-green-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured gardens */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Vườn nổi bật</h2>
              <p className="text-gray-500">Các vườn đang có chỗ trống, sẵn sàng canh tác</p>
            </div>
            <Link to="/gardens" className="hidden sm:flex items-center gap-1 text-green-600 font-medium hover:text-green-700">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGardens.map(garden => (
              <Link key={garden.id} to={`/gardens/${garden.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="relative h-52 overflow-hidden">
                  <img src={garden.images[0]} alt={garden.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3">
                    <span className="badge-green">{garden.district}</span>
                  </div>
                  {garden.hasIoT && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      <Wifi className="w-3 h-3" /> IoT
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{garden.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-amber-500 flex-shrink-0 ml-2">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="font-medium">{garden.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    {garden.address}
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">{garden.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {garden.plantTypes.slice(0, 3).map(p => (
                      <span key={p} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">{garden.pricePerMonth.toLocaleString('vi-VN')}đ</span>
                      <span className="text-gray-500 text-sm">/tháng</span>
                    </div>
                    <span className="text-sm text-gray-500">{garden.area}m² · {garden.floors} tầng</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Công nghệ & Dịch vụ</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Tích hợp công nghệ hiện đại để mang lại trải nghiệm canh tác tốt nhất</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center mb-4`}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Khách hàng nói gì</h2>
            <p className="text-gray-500 text-lg">Chia sẻ từ những người đã tin tưởng GreenSlot</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{t.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-bold">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Bắt đầu hành trình xanh của bạn</h2>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">Đăng ký miễn phí hôm nay và nhận ưu đãi tháng đầu giảm 20% cho lần thuê vườn đầu tiên.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
              Đăng ký ngay — Miễn phí
            </Link>
            <Link to="/gardens" className="border border-white/50 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-500/50 transition-colors">
              Xem các vườn
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
