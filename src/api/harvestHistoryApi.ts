import apiClient from './axiosConfig';

export interface HarvestHistoryItem {
  id: number;
  rentalId: number;
  locationId?: number;
  locationName?: string;
  slotId?: number;
  slotNumber?: string;
  treeId?: number;
  treeName?: string;
  customerId?: number;
  customerName?: string;
  harvestMethod: 'SELF' | 'STAFF';
  staffId?: number;
  staffName?: string;
  plantedAt?: string;
  harvestedAt: string;
  pillarCodes?: string;
  harvestDays?: number;
  daysGrown?: number;
  isEarlyHarvest?: boolean;
}

export const harvestHistoryApi = {
  // Khách hàng xem lịch sử thu hoạch của chính mình
  getMyHistory: (): Promise<HarvestHistoryItem[]> =>
    apiClient.get('/harvest-history/my').then(r => r.data),

  // Quản lý/staff xem lịch sử thu hoạch theo cơ sở (location_manager tự lọc theo cơ sở của mình ở backend)
  getManagerHistory: (): Promise<HarvestHistoryItem[]> =>
    apiClient.get('/harvest-history').then(r => r.data),
};
