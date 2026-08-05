import apiClient from './axiosConfig';

export interface PumpStatusPayload {
  status: 'ON' | 'OFF';
}

export const pumpApi = {
  // Đã bỏ '/api' ở đầu chuỗi
  getPumpStatus: (): Promise<PumpStatusPayload> =>
    apiClient.get('/iot/pump/status').then(r => r.data),

  // Đã bỏ '/api' ở đầu chuỗi
  updatePumpStatus: (data: PumpStatusPayload): Promise<PumpStatusPayload> =>
    apiClient.post('/iot/pump/status', data).then(r => r.data),
};