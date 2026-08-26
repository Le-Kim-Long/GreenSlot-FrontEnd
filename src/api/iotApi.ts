import apiClient from './axiosConfig';
import type { SensorReading, SensorTypeInfo } from '../types/api';

export type { SensorReading, SensorTypeInfo };

export interface SlotDeviceInfo {
  slotId: number;
  slotNumber: string;
  deviceId: string;
  pillarId: number;
  pillarCode: string;
  deviceStatus: string;
  cameraStatus: string;
  cameraStreamUrl: string;
  locationId: number | null;
  locationName: string;
}

export const iotApi = {
  getLatest: (deviceId: string): Promise<SensorReading[]> =>
    apiClient.get('/iot/sensors/latest', { params: { deviceId } }).then(r => r.data),

  getHistory: (deviceId: string, sensorType?: string, limit = 50): Promise<SensorReading[]> =>
    apiClient.get('/iot/sensors/history', { params: { deviceId, sensorType, limit } }).then(r => r.data),

  getDeviceBySlot: (slotId: number): Promise<SlotDeviceInfo> =>
    apiClient.get(`/iot/device/slot/${slotId}`).then(r => r.data),

  getLatestBySlot: (slotId: number): Promise<SensorReading[]> =>
    apiClient.get(`/iot/sensors/slot/${slotId}/latest`).then(r => r.data),

  getHistoryBySlot: (slotId: number, sensorType?: string, limit = 50): Promise<SensorReading[]> =>
    apiClient.get(`/iot/sensors/slot/${slotId}/history`, { params: { sensorType, limit } }).then(r => r.data),

  getTypes: (): Promise<SensorTypeInfo[]> =>
    apiClient.get('/iot/sensors/types').then(r => r.data),

  getMonitoredPillars: (): Promise<any[]> =>
    apiClient.get('/iot/monitored-pillars').then(r => r.data),
};
