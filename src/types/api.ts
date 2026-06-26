// DTOs aligned with GreeenSlot backend

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AvailableSlotDTO {
  id: number;
  slotNumber: string;
  price: number;
  status: string;
  pillarCode: string;
  locationName: string;
}

export interface BookingRequest {
  slotId: number;
  durationInMonths: number;
  startTime: string;
}

export interface BookingResponse {
  rentalId: number;
  paymentUrl: string;
  vnpTxnRef: string;
}

export interface ExtensionRequest {
  rentalId: number;
  durationInMonths: number;
}

export interface PaymentTransactionInfo {
  id: number;
  amount: number;
  vnpTxnRef: string;
  paymentDate: string;
  status: string;
}

export interface RentalHistoryDTO {
  rentalId: number;
  slotNumber: string;
  pillarCode?: string;
  locationName?: string;
  locationAddress?: string;
  startTime: string;
  endTime: string;
  rentalStatus: string;
  transactions: PaymentTransactionInfo[];
}

export interface BookingHistory {
  id: number;
  slotId?: number;
  slotNumber: string;
  pillarCode?: string;
  locationName?: string;
  locationAddress?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  totalPrice: number;
  status: string;
  paymentStatus?: string;
  transactions: PaymentTransactionInfo[];
}

export interface ServiceRequest {
  slotId: number;
  serviceTypeId: number;
  description?: string;
}

export interface GardeningTask {
  id: number;
  taskName: string;
  description?: string;
  status: string;
  evidenceImageUrl?: string;
  taskType: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  targetSlotId?: number;
  targetSlotNumber?: string;
  createdAt: string;
}

export interface TaskAssignment {
  taskId?: number;
  staffId: number;
  taskName?: string;
  description?: string;
  taskType?: string;
  targetSlotId?: number;
}

export interface TaskStatusUpdate {
  status: string;
  evidenceImageUrl?: string;
}

export interface IssueReport {
  issueTitle: string;
  description: string;
  evidenceImageUrl?: string;
}

export interface UserAdmin {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  enabled: boolean;
  roles: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  performedBy: string;
  performedAt: string;
  details?: string;
  ipAddress?: string;
}

export interface GlobalContent {
  id?: number;
  title: string;
  content: string;
  contentType: 'ANNOUNCEMENT' | 'CONFIG';
  active?: boolean;
}

export interface ActiveRental {
  rentalId: number;
  username: string;
  fullName: string;
  slotNumber: string;
  pillarCode: string;
  locationName: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
}

export interface ServiceType {
  id: number;
  name: string;
  description?: string;
  price: number;
  serviceCategoryId?: number;
}

export interface SensorReading {
  id: number;
  deviceId: string;
  sensorType: string;
  sensorDescription: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface SensorTypeInfo {
  name: string;
  code: string;
  unit: string;
  description: string;
}
