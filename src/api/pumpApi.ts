import apiClient from './axiosConfig';

export interface PumpStatusPayload {
  status: 'ON' | 'OFF';
  autoMode?: boolean;
  lastTriggerReason?: string;
  lastTriggerTime?: string;
}

export const pumpApi = {
  getPumpStatus: (): Promise<PumpStatusPayload> =>
    apiClient.get<PumpStatusPayload>('/iot/pump/status').then(r => r.data),

  updatePumpStatus: (data: Partial<PumpStatusPayload>): Promise<PumpStatusPayload> =>
    apiClient.post<PumpStatusPayload>('/iot/pump/status', data).then(r => r.data),

  setAutoMode: (enabled: boolean): Promise<PumpStatusPayload> =>
    apiClient.put<PumpStatusPayload>(`/iot/pump/auto-mode?enabled=${enabled}`).then(r => r.data),
};