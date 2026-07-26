import apiClient from './axiosConfig';

// 👉 Bổ sung các trường avatar để không cần dùng "as any" khi gọi API update profile
export interface UserProfileUpdateDTO {
  fullName: string;
  phone: string;
  address: string;
  avatar?: string;
  avatarUrl?: string;
  imageUrl?: string;
}

export interface UploadedImage {
  id: number;
  fileName: string;
  storagePath: string;
  publicUrl: string;
  contentType: string;
  fileSize: number;
  uploadedAt?: string;
  status?: string;
  uploadedBy?: number;
  uploadedByUsername?: string;
  uploadType?: string;
}

export const userApi = {
  updateProfile: (data: UserProfileUpdateDTO) =>
    apiClient.patch('/users/profile', data).then(r => r.data),
};

export const imageApi = {
  // 👉 Khớp 100% với Hình 1: POST /api/images/upload/avatar
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/images/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Lấy chính xác trường publicUrl từ Swagger response
    return response.data?.publicUrl || response.data?.url || '';
  },

  // 👉 Khớp 100% với Hình 2: GET /api/images/my-uploads
  getMyUploads: async (): Promise<UploadedImage[]> => {
    const response = await apiClient.get('/images/my-uploads');
    return response.data || [];
  },
};