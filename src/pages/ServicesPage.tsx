import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Droplets, Thermometer, Sun, BarChart3, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ServicesPage() {
  const services = [
    {
      icon: <Droplets className="w-10 h-10 text-blue-400" />,
      title: 'Tưới cây tự động (Smart Irrigation)',
      desc: 'Hệ thống tưới nhỏ giọt thông minh được điều khiển qua IoT. Tự động điều chỉnh lượng nước dựa trên độ ẩm đất và loại cây trồng.',
      color: 'bg-blue-900/30',
      features: ['Tưới nhỏ giọt chính xác', 'Cảm biến độ ẩm đất', 'Lên lịch tưới tự động']
    },
    {
      icon: <Thermometer className="w-10 h-10 text-red-400" />,
      title: 'Kiểm soát vi khí hậu (Climate Control)',
      desc: 'Giám sát và điều chỉnh nhiệt độ, độ ẩm không khí, nồng độ CO₂ liên tục 24/7 để tạo môi trường phát triển tối ưu.',
      color: 'bg-red-900/30',
      features: ['Quạt thông gió tự động', 'Hệ thống phun sương', 'Cảm biến CO₂']
    },
    {
      icon: <Sun className="w-10 h-10 text-yellow-400" />,
      title: 'Chiếu sáng quang hợp (LED Grow Lights)',
      desc: 'Sử dụng đèn LED quang phổ đầy đủ chuyên dụng cho nông nghiệp, thay thế hoàn toàn ánh sáng mặt trời tự nhiên.',
      color: 'bg-yellow-900/30',
      features: ['Quang phổ tuỳ chỉnh', 'Tiết kiệm năng lượng', 'Tự động bật/tắt theo chu kỳ']
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-purple-400" />,
      title: 'Phân tích dữ liệu AI (Data Analytics)',
      desc: 'Thu thập hàng ngàn điểm dữ liệu mỗi ngày. AI phân tích biểu đồ tăng trưởng, dự đoán năng suất thu hoạch.',
      color: 'bg-purple-900/30',
      features: ['Báo cáo sinh trưởng', 'Cảnh báo sớm', 'Tối ưu hoá năng suất']
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-green-400" />,
      title: 'Bảo vệ sinh học (Bio-Protection)',
      desc: 'Phát hiện sớm sâu bệnh thông qua camera AI. Can thiệp kịp thời bằng các biện pháp sinh học an toàn.',
      color: 'bg-green-900/30',
      features: ['Phân tích hình ảnh AI', 'Chế phẩm sinh học', 'An toàn 100%']
    },
    {
      icon: <Users className="w-10 h-10 text-indigo-400" />,
      title: 'Dịch vụ chăm sóc tận nơi (On-site Care)',
      desc: 'Đội ngũ chuyên gia nông nghiệp đô thị sẵn sàng đến tận nơi để cắt tỉa, bón phân, phòng bệnh và thu hoạch.',
      color: 'bg-indigo-900/30',
      features: ['Kỹ sư nông nghiệp', 'Hỗ trợ 6 ngày/tuần', 'Bảo hành cây sống 98%']
    },
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Hệ Sinh Thái Dịch Vụ GreenSlot</h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Ứng dụng công nghệ cao vào nông nghiệp đô thị, mang đến trải nghiệm tự trồng rau sạch nhàn nhã và năng suất nhất.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((s, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-8 border border-green-100 hover:shadow-xl hover:shadow-green-200/50 hover:-translate-y-1 hover:border-green-300 transition-all duration-300 group">
                  <div className={`w-20 h-20 ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {s.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-6">{s.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {s.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 text-center bg-[#e6f5ec]">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Bạn đã sẵn sàng trải nghiệm?</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            Hàng ngàn khách hàng đã sở hữu khu vườn trong mơ với sự hỗ trợ từ GreenSlot. Đăng ký ngay hôm nay!
          </p>
          <Link to="/gardens" className="inline-flex items-center gap-2 bg-green-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-400 transition-colors shadow-lg shadow-green-500/25">
            Tìm vườn ngay <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
