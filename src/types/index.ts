export type UserRole = 'customer' | 'owner' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Garden {
  id: string;
  name: string;
  description: string;
  address: string;
  district: string;
  city: string;
  area: number;
  floors: number;
  pricePerMonth: number;
  images: string[];
  amenities: string[];
  status: 'available' | 'rented' | 'maintenance';
  ownerId: string;
  ownerName: string;
  rating: number;
  reviewCount: number;
  plantTypes: string[];
  hasIoT: boolean;
  hasCareService: boolean;
}

export interface Rental {
  id: string;
  gardenId: string;
  gardenName: string;
  gardenImage: string;
  customerId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  iotEnabled: boolean;
  careServiceRequested: boolean;
}

export interface IoTData {
  gardenId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  lightIntensity: number;
  soilMoisture: number;
  waterLevel: number;
  co2Level: number;
}

export interface IoTAlert {
  id: string;
  gardenId: string;
  type: 'temperature' | 'humidity' | 'water' | 'soil' | 'light';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface CareService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: 'watering' | 'fertilizing' | 'pruning' | 'pest_control' | 'harvest' | 'consultation';
}

export interface CareServiceRequest {
  id: string;
  gardenId: string;
  gardenName: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  staffId?: string;
  staffName?: string;
  notes?: string;
  price: number;
}

export interface Payment {
  id: string;
  rentalId?: string;
  serviceRequestId?: string;
  userId: string;
  amount: number;
  method: 'vnpay' | 'momo' | 'bank_transfer' | 'cash';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  createdAt: string;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'iot_alert' | 'booking' | 'payment' | 'care_service' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  gardenId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}
