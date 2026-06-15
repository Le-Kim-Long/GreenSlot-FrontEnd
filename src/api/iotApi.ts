import apiClient from './axiosConfig';

export interface SensorReadingResponse {
  id: number;
  deviceId: string;
  sensorType: string;
  sensorDescription: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface SensorTypeInfo {
  type: string;
  description: string;
  unit: string;
}

export const iotApi = {
  getLatest: async (deviceId: string): Promise<SensorReadingResponse[]> => {
    const response = await apiClient.get('/iot/sensors/latest', {
      params: { deviceId }
    });
    return response.data;
  },
  getHistory: async (deviceId: string, sensorType?: string, limit: number = 50): Promise<SensorReadingResponse[]> => {
    const response = await apiClient.get('/iot/sensors/history', {
      params: { deviceId, sensorType, limit }
    });
    return response.data;
  },
  getTypes: async (): Promise<SensorTypeInfo[]> => {
    const response = await apiClient.get('/iot/sensors/types');
    return response.data;
  }
};
