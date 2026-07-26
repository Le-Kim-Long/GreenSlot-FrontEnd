import apiClient from './axiosConfig';

export interface StaffSchedule {
  id: number;
  staffId: number;
  staffName: string;
  locationId: number;
  locationName: string;
  scheduleDate: string; // Định dạng "YYYY-MM-DD"
  startTime: string;    // VD: "08:00"
  endTime: string;      // VD: "17:00"
  notes: string;
  isActive: boolean;
}

export const staffScheduleApi = {
  getSchedules: (): Promise<StaffSchedule[]> => 
    apiClient.get('/staff-schedules').then(r => r.data),
  
  getScheduleById: (id: number): Promise<StaffSchedule> => 
    apiClient.get(`/staff-schedules/${id}`).then(r => r.data),
  
  getSchedulesByStaff: (staffId: number): Promise<StaffSchedule[]> => 
    apiClient.get(`/staff-schedules/staff/${staffId}`).then(r => r.data),
  
  getSchedulesByLocation: (locationId: number): Promise<StaffSchedule[]> => 
    apiClient.get(`/staff-schedules/location/${locationId}`).then(r => r.data),
  
  getSchedulesByLocationAndDate: (locationId: number, date: string): Promise<StaffSchedule[]> => 
    apiClient.get(`/staff-schedules/location/${locationId}/date/${date}`).then(r => r.data),
  
  getSchedulesByDate: (date: string): Promise<StaffSchedule[]> => 
    apiClient.get(`/staff-schedules/date/${date}`).then(r => r.data),
  
  createSchedule: (data: Partial<StaffSchedule>): Promise<StaffSchedule> => 
    apiClient.post('/staff-schedules', data).then(r => r.data),
  
  updateSchedule: (id: number, data: Partial<StaffSchedule>): Promise<StaffSchedule> => 
    apiClient.put(`/staff-schedules/${id}`, data).then(r => r.data),
  
  deleteSchedule: (id: number): Promise<any> => 
    apiClient.delete(`/staff-schedules/${id}`).then(r => r.data),
};