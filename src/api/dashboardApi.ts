import apiClient from './axiosConfig';

export interface ActiveRentalItem {
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

export interface AlertItem {
  id: number;
  alertType: string;
  description: string;
  status: string;
  thresholdValue: number;
  actualValue: number;
  sensorType: string;
  pillarId: number;
  pillarCode: string;
  gardenSlotId: number;
  slotNumber: string;
  treeId: number;
  treeName: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface DashboardMetrics {
  locationId: number;
  locationName: string;
  totalSlots: number | null;
  availableSlots: number | null;
  activeRentals: number;
  pendingAlerts: number;
  totalRevenue: number | null;
  recentAlerts: AlertItem[];
  activeRentalsList: ActiveRentalItem[];
}

export interface LocationRevenue {
  totalRevenue: number;
  dailyBreakdown: { date: string; revenue: number }[];
  transactions: { id: number; amount: number; date: string; description?: string }[];
}

export const dashboardApi = {
  getLocationMetrics: (locationId: number): Promise<DashboardMetrics> =>
    apiClient.get(`/dashboard/metrics/${locationId}`).then(r => r.data),

  getLocationRevenue: (locationId: number, startDate: string, endDate: string): Promise<LocationRevenue> =>
    apiClient.get(`/dashboard/metrics/${locationId}/revenue`, { params: { startDate, endDate } }).then(r => r.data),
};
