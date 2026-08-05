import React, { useState, useEffect } from 'react';
import { pumpApi, PumpStatusPayload } from '../../api/PumpApi'; // Nhớ đổi đường dẫn cho đúng với project của bạn

const PumpControl: React.FC = () => {
  const [pumpStatus, setPumpStatus] = useState<'ON' | 'OFF'>('OFF');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy trạng thái máy bơm khi component vừa mount
  useEffect(() => {
    fetchPumpStatus();
  }, []);

  const fetchPumpStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await pumpApi.getPumpStatus();
      setPumpStatus(data.status);
    } catch (err) {
      console.error('Lỗi khi lấy trạng thái máy bơm:', err);
      setError('Không thể kết nối đến hệ thống máy bơm.');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý sự kiện khi bấm nút Bật/Tắt
  const handleTogglePump = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      // Xác định trạng thái mục tiêu (ngược lại với hiện tại)
      const targetStatus: 'ON' | 'OFF' = pumpStatus === 'ON' ? 'OFF' : 'ON';
      const payload: PumpStatusPayload = { status: targetStatus };

      // Gọi API POST cập nhật
      const response = await pumpApi.updatePumpStatus(payload);
      
      // Cập nhật lại UI dựa trên phản hồi từ server
      setPumpStatus(response.status);
    } catch (err) {
      console.error('Lỗi khi điều khiển máy bơm:', err);
      setError('Đã có lỗi xảy ra khi gửi lệnh điều khiển.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Đang tải dữ liệu máy bơm...</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Bảng Điều Khiển Máy Bơm</h2>
      
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.statusCard}>
        <p>Trạng thái hiện tại:</p>
        <h3 style={{ color: pumpStatus === 'ON' ? '#28a745' : '#dc3545' }}>
          {pumpStatus === 'ON' ? 'ĐANG BẬT (ON)' : 'ĐANG TẮT (OFF)'}
        </h3>
      </div>

      <button 
        onClick={handleTogglePump} 
        disabled={isUpdating}
        style={{
          ...styles.button,
          backgroundColor: pumpStatus === 'ON' ? '#dc3545' : '#28a745',
          opacity: isUpdating ? 0.7 : 1,
          cursor: isUpdating ? 'not-allowed' : 'pointer'
        }}
      >
        {isUpdating ? 'Đang xử lý...' : (pumpStatus === 'ON' ? 'Tắt Máy Bơm' : 'Bật Máy Bơm')}
      </button>
    </div>
  );
};

// CSS in JS đơn giản (Bạn có thể chuyển sang dùng Tailwind hoặc CSS Modules tùy cấu trúc dự án)
const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    textAlign: 'center' as const,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    fontFamily: 'sans-serif'
  },
  statusCard: {
    margin: '20px 0',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  button: {
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  error: {
    color: '#dc3545',
    marginBottom: '15px',
    fontSize: '14px'
  }
};

export default PumpControl;