import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const plans = [
    {
      name: 'Khởi đầu',
      price: 'Miễn phí',
      period: 'mãi mãi',
      desc: 'Phù hợp cho người muốn tìm hiểu nền tảng và tự chăm sóc vườn cơ bản.',
      border: 'border-green-100',
      btn: 'bg-[#1a2e1f] text-gray-200 hover:bg-[#243828] border border-green-800/40',
      popular: false,
      features: [
        { name: 'Truy cập tìm kiếm & Thuê vườn', included: true },
        { name: 'Quản lý hợp đồng điện tử', included: true },
        { name: 'Giám sát IoT (Cập nhật mỗi 1 giờ)', included: true },
        { name: 'Lưu trữ dữ liệu lịch sử 7 ngày', included: true },
        { name: 'Yêu cầu dịch vụ chăm sóc (tính phí rời)', included: true },
        { name: 'Phân tích dữ liệu AI', included: false },
        { name: 'Tự động tưới tiêu theo kịch bản', included: false },
        { name: 'Chuyên gia hỗ trợ 24/7', included: false },
      ]
    },
    {
      name: 'Nông Gia PRO',
      price: '199.000đ',
      period: '/ tháng',
      desc: 'Dành cho những người yêu cây, muốn tối ưu hoá năng suất qua IoT.',
      border: 'border-green-500 shadow-xl shadow-green-500/10 relative scale-105 z-10',
      btn: 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/25',
      popular: true,
      features: [
        { name: 'Truy cập tìm kiếm & Thuê vườn', included: true },
        { name: 'Quản lý hợp đồng điện tử', included: true },
        { name: 'Giám sát IoT Real-time (Cập nhật liên tục)', included: true },
        { name: 'Lưu trữ dữ liệu lịch sử 12 tháng', included: true },
        { name: 'Yêu cầu dịch vụ chăm sóc (giảm 15%)', included: true },
        { name: 'Phân tích dữ liệu AI cơ bản', included: true },
        { name: 'Tự động tưới tiêu theo kịch bản', included: true },
        { name: 'Chuyên gia hỗ trợ 24/7', included: false },
      ]
    },
    {
      name: 'Toàn Diện (All-in)',
      price: '899.000đ',
      period: '/ tháng',
      desc: 'Trải nghiệm canh tác nhàn nhã 100%. Mọi thứ đã có chuyên gia lo.',
      border: 'border-green-100',
      btn: 'bg-white text-green-900 hover:bg-gray-100 font-bold',
      popular: false,
      features: [
        { name: 'Truy cập tìm kiếm & Thuê vườn', included: true },
        { name: 'Quản lý hợp đồng điện tử', included: true },
        { name: 'Giám sát IoT Real-time', included: true },
        { name: 'Lưu trữ dữ liệu không giới hạn', included: true },
        { name: 'Miễn phí 4 lần chăm sóc tận nơi / tháng', included: true },
        { name: 'Phân tích dữ liệu AI chuyên sâu', included: true },
        { name: 'Tự động tưới tiêu & bón phân', included: true },
        { name: 'Chuyên gia hỗ trợ 24/7 (Kênh riêng)', included: true },
      ]
    }
  ];

  const faqs = [
    { q: 'Tôi có phải trả thêm phí khi thuê vườn không?', a: 'Bảng giá trên là phí dịch vụ nền tảng (Subscription). Phí thuê vườn (giá đất) sẽ được thanh toán riêng trực tiếp cho Chủ vườn tuỳ thuộc vào diện tích và vị trí khu vườn.' },
    { q: 'Gói PRO có áp dụng cho nhiều vườn không?', a: 'Gói PRO được áp dụng trên phạm vi 1 tài khoản (User). Nếu bạn thuê nhiều mảnh vườn trên cùng 1 tài khoản, bạn vẫn được hưởng quyền lợi IoT Real-time cho tất cả các vườn đó.' },
    { q: 'Tôi có thể huỷ gói bất cứ lúc nào không?', a: 'Hoàn toàn được. Bạn có thể huỷ gia hạn tự động bất kỳ lúc nào trong phần Cài đặt tài khoản. Gói của bạn sẽ tiếp tục hoạt động cho đến hết chu kỳ đã thanh toán.' }
  ];

  return (
    <div className="min-h-screen bg-[#f0faf4] flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <section className="pt-20 pb-12 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Bảng Giá Dịch Vụ</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Chọn gói dịch vụ phù hợp với nhu cầu canh tác của bạn. Từ người mới bắt đầu đến nông gia thực thụ.
          </p>
        </section>

        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {plans.map((plan, idx) => (
              <div key={idx} className={`rounded-3xl border ${plan.border} bg-white p-8 flex flex-col h-full transition-all duration-300 hover:border-green-300`}>
                {plan.popular && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg shadow-green-500/25">
                    Phổ biến nhất
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 font-medium">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feat.included ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feat.included ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {feat.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/register" className={`w-full text-center py-4 rounded-xl font-bold transition-all ${plan.btn}`}>
                  Bắt đầu ngay
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 bg-[#e6f5ec]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Câu hỏi thường gặp</h2>
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-white border border-green-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h3>
                  <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
