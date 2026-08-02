import axios from 'axios';

// Interface khớp với dữ liệu DTO từ Java Spring Boot
export interface CameraDTO {
  cam_id: string;
  name: string;
  ip: string;
  stream_url: string;
  capture_url: string;
}

// Nếu trong thư mục api của bạn có sẵn file cấu hình axios (ví dụ axiosClient hoặc api.ts), 
// bạn có thể import nó vào thay cho axios thường nhé.
const BASE_URL = 'http://localhost:8080'; // Cổng chạy Spring Boot của bạn

export const getActiveCameras = async (): Promise<CameraDTO[]> => {
  try {
    const response = await axios.get<CameraDTO[]>(`${BASE_URL}/api/cameras`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách camera:', error);
    throw error;
  }
};