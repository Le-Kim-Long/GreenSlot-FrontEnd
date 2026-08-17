import apiClient from './axiosConfig';

// 🧪 CHỈ DÙNG ĐỂ TEST tính năng nhắc thu hoạch — gọi thẳng 2 endpoint debug ở backend
// (HarvestTestController), không phải luồng nghiệp vụ thật. Xóa khi không cần test nữa.
export const harvestTestApi = {
  backdate: (rentalId: number, days: number, treeId?: number) =>
    apiClient
      .post(`/test/harvest/backdate/${rentalId}`, null, { params: { days, treeId } })
      .then(r => r.data),

  trigger: () => apiClient.post('/test/harvest/trigger').then(r => r.data),
};
