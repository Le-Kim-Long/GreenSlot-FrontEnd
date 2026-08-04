import apiClient from './axiosConfig';

export interface CustomerLifetimeValue {
  userId: number;
  userName: string;
  userEmail: string;
  totalSpent: number;
  totalRentals: number;
  averageRentalValue: number;
  firstRentalDate: string | null;
  lastRentalDate: string | null;
  daysAsCustomer: number;
  monthlyAverageSpend: number;
  customerLifetimeValue: number;
}

export const customerAnalyticsApi = {
  getCLV: (userId: number): Promise<CustomerLifetimeValue> =>
    apiClient.get(`/analytics/customers/${userId}/clv`).then(r => r.data),

  getAllCLVs: (): Promise<CustomerLifetimeValue[]> =>
    apiClient.get('/analytics/customers/clv').then(r => r.data),
};
