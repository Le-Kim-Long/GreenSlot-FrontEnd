import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Search, Sprout, Smartphone, ShoppingBasket, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {

  const steps = [
    {
      icon: <Search className="w-8 h-8" />,
      title: '1. Tìm & Thuê Vườn',
      desc: 'Duyệt qua danh sách các vườn canh tác đạt chuẩn trên hệ thống. So sánh vị trí, diện tích, giá cả và đọc đánh giá từ những người dùng khác. Ký hợp đồng điện tử và thanh toán an toàn ngay trên nền tảng.',
      color: 'bg-blue-900/30 text-blue-400',
    },
    {
      icon: <Sprout className="w-8 h-8" />,
      title: '2. Lên Kế Hoạch Canh Tác',
      desc: 'Chọn loại cây trồng bạn muốn từ thư viện cây trồng của chúng tôi. Hệ thống sẽ tự động đề xuất lịch tưới nước, bón phân và ánh sáng phù hợp nhất. Hoặc tự cấu hình theo kinh nghiệm của riêng bạn.',
      color: 'bg-green-900/30 text-green-400',
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: '3. Giám Sát Từ Xa 24/7',
      desc: 'Theo dõi mọi thông số của khu vườn (Nhiệt độ, Độ ẩm, CO₂, Ánh sáng) qua ứng dụng. Nhận cảnh báo ngay lập tức nếu có bất thường. Điều khiển máy bơm, quạt thông gió chỉ bằng một cú chạm.',
      color: 'bg-purple-900/30 text-purple-400',
    },
    {
      icon: <ShoppingBasket className="w-8 h-8" />,
      title: '4. Thu Hoạch & Thưởng Thức',
      desc: 'Đến tận vườn để tự tay thu hoạch những luống rau xanh mướt do chính mình chăm sóc. Hoặc sử dụng dịch vụ thu hoạch hộ, rau sạch sẽ được giao đến tận cửa nhà bạn.',
      color: 'bg-orange-900/30 text-orange-400',
    }
  ];

  return (
    <div className="min-h-screen bg-[#f0faf4] flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <section className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 py-20 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Trải Nghiệm Nông Nghiệp Số</h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Trở thành nông gia đô thị chưa bao giờ dễ dàng đến thế. Cùng GreenSlot bắt đầu hành trình xanh của bạn chỉ với 4 bước đơn giản.
            </p>
          </div>
        </section>

        <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-100 -translate-x-1/2" />

            <div className="space-y-12 md:space-y-24">
              {steps.map((step, idx) => (
                <div key={idx} className={`relative flex flex-col md:flex-row items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`w-full md:w-1/2 flex ${idx % 2 === 0 ? 'md:justify-end md:pr-16' : 'md:justify-start md:pl-16'}`}>
                    <div className="bg-white p-8 rounded-3xl border border-green-100 hover:shadow-xl hover:shadow-green-200/50 hover:border-green-300 transition-all w-full group">
                      <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        {step.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-4 border-green-500 items-center justify-center z-10 shadow-lg shadow-green-200">
                    <ArrowDown className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#e6f5ec] text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-6">Sẵn sàng để bắt đầu?</h2>
            <Link to="/register" className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-400 transition-colors shadow-lg shadow-green-500/25">
              Đăng ký tài khoản miễn phí
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
