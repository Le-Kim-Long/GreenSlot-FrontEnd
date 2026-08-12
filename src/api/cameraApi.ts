import apiClient from './axiosConfig';

export interface CameraDTO {
  cam_id: string;
  name: string;
  ip: string;
  stream_url: string;
  capture_url: string;
}

export const getActiveCameras = async (): Promise<CameraDTO[]> => {
  try {
    const response = await apiClient.get<CameraDTO[]>('/cameras');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách camera:', error);
    throw error;
  }
};