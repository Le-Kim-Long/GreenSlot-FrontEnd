import apiClient from './axiosConfig';
import type { SensorReading, SensorTypeInfo } from '../types/api';

export type { SensorReading, SensorTypeInfo };

export const iotApi = {
  getLatest: (deviceId: string): Promise<SensorReading[]> =>
    apiClient.get('/iot/sensors/latest', { params: { deviceId } }).then(r => r.data),

  getHistory: (deviceId: string, sensorType?: string, limit = 50): Promise<SensorReading[]> =>
    apiClient.get('/iot/sensors/history', { params: { deviceId, sensorType, limit } }).then(r => r.data),

  getTypes: (): Promise<SensorTypeInfo[]> =>
    apiClient.get('/iot/sensors/types').then(r => r.data),
};
