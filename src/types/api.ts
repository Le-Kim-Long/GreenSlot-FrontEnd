// DTOs aligned with GreeenSlot backend

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  locationId?: number;
  locationName?: string;
}

export interface PillarDetail {
  id: number;
  pillarCode: string;
  status: string;
  pillarType?: string;
  pillarTypeName?: string;
  capacityHoles?: number;
  price?: number;
  requiredArea?: number;
  defaultTreeId?: number;
  defaultTreeName?: string;
  defaultTreePrice?: number;
  defaultTreeImageUrl?: string;
  cameraStreamUrl?: string;
  cameraStatus?: string;
  locationId?: number;
  locationName?: string;
  slotId?: number;
  slotNumber?: string;
}

export type PillarInfo = PillarDetail;

export interface AvailableSlotDTO {
  id: number;
  slotNumber: string;
  price: number;
  area?: number;
  maxPillars?: number;
  status: string;
  pillarCode: string;
  pillarCodes?: string[];
  pillarCount?: number;
  locationName: string;
  locationId?: number;
  locationAddress?: string;
  imageUrl?: string;
  pillars?: PillarDetail[];
  totalHoles?: number;
  calculatedPillarsPrice?: number;
  calculatedTreesPrice?: number;
}

export interface BookingRequest {
  slotId: number;
  durationInMonths: number;
  startTime: string;
  treeId?: number;
  isMobile?: boolean;
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
  slotId: number;
  slotNumber: string;
  pillarCode?: string;
  pillarCodes?: string[];
  pillars?: PillarInfo[];
  locationName?: string;
  locationAddress?: string;
  startTime: string;
  endTime: string;
  rentalStatus: string;
  transactions: PaymentTransactionInfo[];
  treeName?: string;
  harvestNotifiedAt?: string;
  harvestDecision?: string;
  plantedAt?: string;
  expectedHarvestAt?: string;
}

export interface BookingHistory {
  id: number;
  slotId: number;
  slotNumber: string;
  pillarCode?: string;
  pillarCodes?: string[];
  pillars?: PillarInfo[];
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
  treeName?: string;
  harvestNotifiedAt?: string;
  harvestDecision?: string;
  plantedAt?: string;
  expectedHarvestAt?: string;
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
  rejectionReason?: string;
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
  locationId?: number;
  locationName?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
  categoryName?: string;
  description?: string;
}

export interface ServiceType {
  id: number;
  name: string;
  serviceName?: string;
  description?: string;
  price: number;
  serviceCategoryId?: number;
  categoryId?: number;
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
