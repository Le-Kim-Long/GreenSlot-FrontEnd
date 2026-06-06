import type { Garden, User, Rental, IoTData, IoTAlert, CareService, CareServiceRequest, Payment, Notification } from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Nguyễn Văn An', email: 'an@gmail.com', phone: '0901234567', role: 'customer', createdAt: '2024-01-15' },
  { id: 'u2', name: 'Trần Thị Bình', email: 'binh@gmail.com', phone: '0912345678', role: 'owner', createdAt: '2024-02-10' },
  { id: 'u3', name: 'Lê Văn Cường', email: 'cuong@gmail.com', phone: '0923456789', role: 'staff', createdAt: '2024-03-05' },
  { id: 'u4', name: 'Phạm Thị Dung', email: 'admin@greenslot.vn', phone: '0934567890', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u5', name: 'Hoàng Văn Em', email: 'em@gmail.com', phone: '0945678901', role: 'customer', createdAt: '2024-04-20' },
  { id: 'u6', name: 'Võ Thị Hoa', email: 'hoa@gmail.com', phone: '0956789012', role: 'owner', createdAt: '2024-02-28' },
];

export const mockGardens: Garden[] = [
  {
    id: 'g1',
    name: 'Vườn Xanh Quận 1',
    description: 'Không gian canh tác thẳng đứng hiện đại tại trung tâm thành phố. Phù hợp trồng rau sạch, cây dược liệu và cây cảnh mini.',
    address: '12 Nguyễn Huệ, Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    area: 25,
    floors: 5,
    pricePerMonth: 1500000,
    images: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600'],
    amenities: ['Hệ thống tưới tự động', 'Đèn LED chuyên dụng', 'Camera giám sát', 'Cảm biến IoT', 'WiFi'],
    status: 'available',
    ownerId: 'u2',
    ownerName: 'Trần Thị Bình',
    rating: 4.8,
    reviewCount: 24,
    plantTypes: ['Rau cải', 'Rau muống', 'Cà chua bi', 'Dâu tây'],
    hasIoT: true,
    hasCareService: true,
  },
  {
    id: 'g2',
    name: 'Urban Farm Bình Thạnh',
    description: 'Khu vườn đô thị tiêu chuẩn với hệ thống hydroponics tiên tiến. Thích hợp cho người mới bắt đầu trồng rau organic.',
    address: '45 Đinh Tiên Hoàng, Phường 1',
    district: 'Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    area: 18,
    floors: 4,
    pricePerMonth: 1200000,
    images: ['https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
    amenities: ['Hydroponics', 'Đèn LED', 'Cảm biến IoT', 'Bình phân hữu cơ'],
    status: 'rented',
    ownerId: 'u6',
    ownerName: 'Võ Thị Hoa',
    rating: 4.5,
    reviewCount: 18,
    plantTypes: ['Xà lách', 'Húng quế', 'Cải thìa', 'Cải bó xôi'],
    hasIoT: true,
    hasCareService: false,
  },
  {
    id: 'g3',
    name: 'Green Tower Thủ Đức',
    description: 'Vườn thẳng đứng quy mô lớn tại Thủ Đức với không gian rộng rãi. Đặc biệt phù hợp trồng trái cây nhiệt đới mini.',
    address: '78 Võ Văn Ngân, Phường Bình Thọ',
    district: 'Thủ Đức',
    city: 'TP. Hồ Chí Minh',
    area: 35,
    floors: 6,
    pricePerMonth: 2000000,
    images: ['https://images.unsplash.com/photo-1477092888588-33b72cd7e1a0?w=600'],
    amenities: ['Hệ thống tưới nhỏ giọt', 'Đèn UV', 'Cảm biến IoT', 'Máy lọc nước', 'Kho chứa thiết bị'],
    status: 'available',
    ownerId: 'u2',
    ownerName: 'Trần Thị Bình',
    rating: 4.9,
    reviewCount: 31,
    plantTypes: ['Chanh leo', 'Dưa leo', 'Ớt chuông', 'Cà tím'],
    hasIoT: true,
    hasCareService: true,
  },
  {
    id: 'g4',
    name: 'Eco Garden Tân Bình',
    description: 'Không gian xanh eco-friendly, thân thiện môi trường. Sử dụng 100% năng lượng mặt trời và phân hữu cơ.',
    address: '23 Cộng Hòa, Phường 12',
    district: 'Tân Bình',
    city: 'TP. Hồ Chí Minh',
    area: 20,
    floors: 3,
    pricePerMonth: 900000,
    images: ['https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600'],
    amenities: ['Năng lượng mặt trời', 'Phân compost', 'Tưới nhỏ giọt', 'WiFi'],
    status: 'available',
    ownerId: 'u6',
    ownerName: 'Võ Thị Hoa',
    rating: 4.3,
    reviewCount: 12,
    plantTypes: ['Rau thơm', 'Hoa ăn được', 'Cây gia vị'],
    hasIoT: false,
    hasCareService: true,
  },
  {
    id: 'g5',
    name: 'Smart Farm Gò Vấp',
    description: 'Vườn thông minh tích hợp AI tự động điều chỉnh môi trường. Công nghệ cao nhất hiện tại.',
    address: '56 Nguyễn Văn Nghi, Phường 7',
    district: 'Gò Vấp',
    city: 'TP. Hồ Chí Minh',
    area: 30,
    floors: 5,
    pricePerMonth: 2500000,
    images: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600'],
    amenities: ['AI tự động', 'IoT đầy đủ', 'Robot tưới', 'Phân tích dữ liệu', 'Camera 4K'],
    status: 'available',
    ownerId: 'u2',
    ownerName: 'Trần Thị Bình',
    rating: 5.0,
    reviewCount: 8,
    plantTypes: ['Tất cả loại rau', 'Cây dược liệu', 'Microgreens'],
    hasIoT: true,
    hasCareService: true,
  },
  {
    id: 'g6',
    name: 'Rooftop Farm Phú Nhuận',
    description: 'Vườn trên mái nhà tầng 15 với view thành phố tuyệt đẹp. Trải nghiệm canh tác unique giữa lòng đô thị.',
    address: '88 Hoàng Văn Thụ, Phường 8',
    district: 'Phú Nhuận',
    city: 'TP. Hồ Chí Minh',
    area: 15,
    floors: 2,
    pricePerMonth: 800000,
    images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600'],
    amenities: ['View thành phố', 'Tưới tự động', 'Đèn LED', 'Ghế nghỉ ngơi'],
    status: 'maintenance',
    ownerId: 'u6',
    ownerName: 'Võ Thị Hoa',
    rating: 4.6,
    reviewCount: 15,
    plantTypes: ['Cây cảnh', 'Hoa', 'Rau cải'],
    hasIoT: false,
    hasCareService: false,
  },
];

export const mockRentals: Rental[] = [
  {
    id: 'r1', gardenId: 'g1', gardenName: 'Vườn Xanh Quận 1',
    gardenImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400',
    customerId: 'u1', customerName: 'Nguyễn Văn An',
    startDate: '2024-11-01', endDate: '2025-01-31',
    totalPrice: 4500000, status: 'active', paymentStatus: 'paid',
    iotEnabled: true, careServiceRequested: false,
  },
  {
    id: 'r2', gardenId: 'g3', gardenName: 'Green Tower Thủ Đức',
    gardenImage: 'https://images.unsplash.com/photo-1477092888588-33b72cd7e1a0?w=400',
    customerId: 'u1', customerName: 'Nguyễn Văn An',
    startDate: '2024-09-01', endDate: '2024-10-31',
    totalPrice: 4000000, status: 'completed', paymentStatus: 'paid',
    iotEnabled: true, careServiceRequested: true,
  },
  {
    id: 'r3', gardenId: 'g2', gardenName: 'Urban Farm Bình Thạnh',
    gardenImage: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400',
    customerId: 'u5', customerName: 'Hoàng Văn Em',
    startDate: '2024-12-01', endDate: '2025-02-28',
    totalPrice: 3600000, status: 'active', paymentStatus: 'paid',
    iotEnabled: true, careServiceRequested: false,
  },
  {
    id: 'r4', gardenId: 'g5', gardenName: 'Smart Farm Gò Vấp',
    gardenImage: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
    customerId: 'u1', customerName: 'Nguyễn Văn An',
    startDate: '2025-01-15', endDate: '2025-03-15',
    totalPrice: 5000000, status: 'pending', paymentStatus: 'unpaid',
    iotEnabled: true, careServiceRequested: true,
  },
];

export const generateIoTHistory = (gardenId: string): IoTData[] => {
  const data: IoTData[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000);
    data.push({
      gardenId,
      timestamp: t.toISOString(),
      temperature: 24 + Math.sin(i / 4) * 4 + Math.random() * 2,
      humidity: 65 + Math.cos(i / 3) * 10 + Math.random() * 5,
      lightIntensity: i >= 6 && i <= 18 ? 800 + Math.random() * 400 : 50 + Math.random() * 100,
      soilMoisture: 55 + Math.sin(i / 6) * 15 + Math.random() * 5,
      waterLevel: 70 + Math.random() * 20,
      co2Level: 400 + Math.random() * 200,
    });
  }
  return data;
};

export const mockIoTAlerts: IoTAlert[] = [
  { id: 'a1', gardenId: 'g1', type: 'temperature', severity: 'high', message: 'Nhiệt độ vượt ngưỡng 32°C - cần điều chỉnh', timestamp: '2024-12-20T14:30:00', resolved: false },
  { id: 'a2', gardenId: 'g1', type: 'water', severity: 'medium', message: 'Mức nước xuống dưới 30% - cần bổ sung', timestamp: '2024-12-20T10:00:00', resolved: true },
  { id: 'a3', gardenId: 'g1', type: 'soil', severity: 'low', message: 'Độ ẩm đất thấp hơn mức tối ưu', timestamp: '2024-12-19T16:00:00', resolved: true },
  { id: 'a4', gardenId: 'g3', type: 'humidity', severity: 'medium', message: 'Độ ẩm không khí quá cao - nguy cơ nấm mốc', timestamp: '2024-12-20T08:00:00', resolved: false },
];

export const mockCareServices: CareService[] = [
  { id: 'cs1', name: 'Tưới cây & Chăm sóc cơ bản', description: 'Tưới nước, kiểm tra và vệ sinh khu vực trồng', price: 150000, duration: '2 giờ', category: 'watering' },
  { id: 'cs2', name: 'Bón phân hữu cơ', description: 'Bón phân và cải thiện dinh dưỡng đất', price: 200000, duration: '2-3 giờ', category: 'fertilizing' },
  { id: 'cs3', name: 'Cắt tỉa & Tạo hình', description: 'Cắt tỉa cành lá, tạo hình cây theo yêu cầu', price: 250000, duration: '3-4 giờ', category: 'pruning' },
  { id: 'cs4', name: 'Phòng trừ sâu bệnh', description: 'Kiểm tra, phun thuốc sinh học phòng trừ sâu bệnh', price: 300000, duration: '2-3 giờ', category: 'pest_control' },
  { id: 'cs5', name: 'Thu hoạch & Đóng gói', description: 'Thu hoạch rau quả và đóng gói theo yêu cầu', price: 180000, duration: '2-3 giờ', category: 'harvest' },
  { id: 'cs6', name: 'Tư vấn chuyên gia', description: 'Tư vấn 1:1 với chuyên gia nông nghiệp đô thị', price: 350000, duration: '1 giờ', category: 'consultation' },
];

export const mockCareRequests: CareServiceRequest[] = [
  { id: 'cr1', gardenId: 'g1', gardenName: 'Vườn Xanh Quận 1', customerId: 'u1', customerName: 'Nguyễn Văn An', serviceId: 'cs1', serviceName: 'Tưới cây & Chăm sóc cơ bản', scheduledDate: '2024-12-22', scheduledTime: '08:00', status: 'assigned', staffId: 'u3', staffName: 'Lê Văn Cường', price: 150000 },
  { id: 'cr2', gardenId: 'g1', gardenName: 'Vườn Xanh Quận 1', customerId: 'u1', customerName: 'Nguyễn Văn An', serviceId: 'cs4', serviceName: 'Phòng trừ sâu bệnh', scheduledDate: '2024-12-25', scheduledTime: '09:00', status: 'pending', price: 300000 },
  { id: 'cr3', gardenId: 'g3', gardenName: 'Green Tower Thủ Đức', customerId: 'u1', customerName: 'Nguyễn Văn An', serviceId: 'cs5', serviceName: 'Thu hoạch & Đóng gói', scheduledDate: '2024-10-15', scheduledTime: '07:00', status: 'completed', staffId: 'u3', staffName: 'Lê Văn Cường', price: 180000 },
];

export const mockPayments: Payment[] = [
  { id: 'p1', rentalId: 'r1', userId: 'u1', amount: 4500000, method: 'vnpay', status: 'success', createdAt: '2024-10-28', description: 'Thanh toán thuê Vườn Xanh Quận 1 - 3 tháng' },
  { id: 'p2', rentalId: 'r2', userId: 'u1', amount: 4000000, method: 'momo', status: 'success', createdAt: '2024-08-28', description: 'Thanh toán thuê Green Tower Thủ Đức - 2 tháng' },
  { id: 'p3', serviceRequestId: 'cr3', userId: 'u1', amount: 180000, method: 'cash', status: 'success', createdAt: '2024-10-15', description: 'Dịch vụ thu hoạch & đóng gói' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Cảnh báo nhiệt độ cao', message: 'Nhiệt độ vườn Quận 1 đang ở mức 34°C, cần chú ý!', type: 'iot_alert', read: false, createdAt: '2024-12-20T14:30:00' },
  { id: 'n2', userId: 'u1', title: 'Đặt lịch chăm sóc thành công', message: 'Yêu cầu tưới cây ngày 22/12 đã được xác nhận', type: 'care_service', read: false, createdAt: '2024-12-19T10:00:00' },
  { id: 'n3', userId: 'u1', title: 'Thanh toán thành công', message: 'Đã thanh toán 4.500.000đ cho đơn thuê Vườn Xanh Quận 1', type: 'payment', read: true, createdAt: '2024-10-28T09:00:00' },
  { id: 'n4', userId: 'u1', title: 'Hợp đồng sắp hết hạn', message: 'Hợp đồng thuê Green Tower Thủ Đức còn 7 ngày nữa hết hạn', type: 'booking', read: true, createdAt: '2024-10-24T08:00:00' },
];
