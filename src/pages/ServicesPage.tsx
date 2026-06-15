import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Droplets, Thermometer, Sun, BarChart3, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ServicesPage() {
  const services = [
    { 
      icon: <Droplets className="w-10 h-10 text-blue-500" />, 
      title: 'Tưới cây tự động (Smart Irrigation)', 
      desc: 'Hệ thống tưới nhỏ giọt thông minh được điều khiển qua IoT. Tự động điều chỉnh lượng nước dựa trên độ ẩm đất và loại cây trồng, giúp tiết kiệm nước và đảm bảo cây luôn đủ nước.', 
      color: 'bg-blue-50',
      features: ['Tưới nhỏ giọt chính xác', 'Cảm biến độ ẩm đất', 'Lên lịch tưới tự động']
    },
    { 
      icon: <Thermometer className="w-10 h-10 text-red-500" />, 
      title: 'Kiểm soát vi khí hậu (Climate Control)', 
      desc: 'Giám sát và điều chỉnh nhiệt độ, độ ẩm không khí, nồng độ CO₂ liên tục 24/7 để tạo ra môi trường phát triển tối ưu nhất cho từng loại cây trồng.', 
      color: 'bg-red-50',
      features: ['Quạt thông gió tự động', 'Hệ thống phun sương', 'Cảm biến CO₂']
    },
    { 
      icon: <Sun className="w-10 h-10 text-yellow-500" />, 
      title: 'Chiếu sáng quang hợp (LED Grow Lights)', 
      desc: 'Sử dụng đèn LED quang phổ đầy đủ (Full Spectrum) chuyên dụng cho nông nghiệp, thay thế hoàn toàn ánh sáng mặt trời tự nhiên cho các vườn trong nhà.', 
      color: 'bg-yellow-50',
      features: ['Quang phổ tuỳ chỉnh', 'Tiết kiệm năng lượng', 'Tự động bật/tắt theo chu kỳ']
    },
    { 
      icon: <BarChart3 className="w-10 h-10 text-purple-500" />, 
      title: 'Phân tích dữ liệu AI (Data Analytics)', 
      desc: 'Thu thập hàng ngàn điểm dữ liệu mỗi ngày. AI phân tích biểu đồ tăng trưởng, dự đoán năng suất thu hoạch và đưa ra các khuyến nghị chăm sóc.', 
      color: 'bg-purple-50',
      features: ['Báo cáo sinh trưởng', 'Cảnh báo sớm', 'Tối ưu hoá năng suất']
    },
    { 
      icon: <ShieldCheck className="w-10 h-10 text-green-500" />, 
      title: 'Bảo vệ sinh học (Bio-Protection)', 
      desc: 'Phát hiện sớm sâu bệnh thông qua camera AI. Can thiệp kịp thời bằng các biện pháp sinh học an toàn, không sử dụng hoá chất độc hại.', 
      color: 'bg-green-50',
      features: ['Phân tích hình ảnh AI', 'Chế phẩm sinh học', 'An toàn 100%']
    },
    { 
      icon: <Users className="w-10 h-10 text-indigo-500" />, 
      title: 'Dịch vụ chăm sóc tận nơi (On-site Care)', 
      desc: 'Đội ngũ chuyên gia nông nghiệp đô thị của GreenSlot sẵn sàng đến tận nơi để cắt tỉa, bón phân, phòng bệnh và thu hoạch giúp bạn.', 
      color: 'bg-indigo-50',
      features: ['Kỹ sư nông nghiệp', 'Hỗ trợ 6 ngày/tuần', 'Bảo hành cây sống 98%']
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header */}
        <section className="bg-gradient-to-br from-green-900 to-emerald-800 py-20 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Hệ Sinh Thái Dịch Vụ GreenSlot</h1>
            <p className="text-lg md:text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Ứng dụng công nghệ cao vào nông nghiệp đô thị, mang đến trải nghiệm tự trồng rau sạch ngay tại nhà một cách nhàn nhã và năng suất nhất.
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((s, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <div className={`w-20 h-20 ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {s.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {s.desc}
                  </p>
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

        {/* CTA */}
        <section className="py-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Bạn đã sẵn sàng trải nghiệm?</h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-8">
            Hàng ngàn khách hàng đã sở hữu khu vườn trong mơ với sự hỗ trợ từ GreenSlot. Đăng ký ngay hôm nay!
          </p>
          <Link to="/gardens" className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-green-600/30">
            Tìm vườn ngay
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
