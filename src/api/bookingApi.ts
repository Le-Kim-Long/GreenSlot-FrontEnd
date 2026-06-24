import apiClient from './axiosConfig';

export interface AvailableSlot {
  id: number;
  slotNumber: string;
  status: string;
  price: number;
  pillarId: number;
  pillarCode?: string;
  locationName?: string;
  locationAddress?: string;
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

export interface BookingHistory {
  id: number;
  slotId: number;
  slotNumber: string;
  locationName?: string;
  locationAddress?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
}

export interface ExtendRequest {
  bookingId: number;
  additionalMonths: number;
}

export const bookingApi = {
  getAvailableSlots: (): Promise<AvailableSlot[]> =>
    apiClient.get('/bookings/available').then(r => r.data),

  bookSlot: (data: BookingRequest): Promise<BookingResponse> =>
    apiClient.post('/bookings/book', data).then(r => r.data),

  getHistory: (): Promise<BookingHistory[]> =>
    apiClient.get('/bookings/history').then(r => r.data),

  extendBooking: (data: ExtendRequest): Promise<string> =>
    apiClient.post('/bookings/extend', data).then(r => r.data),
};
