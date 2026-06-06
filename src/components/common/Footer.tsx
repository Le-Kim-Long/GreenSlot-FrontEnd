import { Link } from 'react-router-dom';
import { Leaf, Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-xl">GreenSlot</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Nền tảng cho thuê vườn canh tác thẳng đứng tại đô thị, tích hợp giám sát IoT và dịch vụ chăm sóc cây trồng tại chỗ.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2 text-sm">
              {['Thuê vườn canh tác', 'Giám sát IoT', 'Chăm sóc cây trồng', 'Tư vấn nông nghiệp', 'Đào tạo canh tác'].map(item => (
                <li key={item}><a href="#" className="hover:text-green-400 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              {['Câu hỏi thường gặp', 'Hướng dẫn sử dụng', 'Chính sách thuê', 'Bảo mật & Quyền riêng tư', 'Điều khoản dịch vụ'].map(item => (
                <li key={item}><a href="#" className="hover:text-green-400 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Lô E2a-7, Đường D1, Khu CNC, TP. Thủ Đức, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                <a href="tel:1900xxxx" className="hover:text-green-400 transition-colors">1900 xxxx</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-500 flex-shrink-0" />
                <a href="mailto:hello@greenslot.vn" className="hover:text-green-400 transition-colors">hello@greenslot.vn</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2024 GreenSlot. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-gray-300">Chính sách bảo mật</Link>
            <Link to="#" className="hover:text-gray-300">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
