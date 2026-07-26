import { initializeApp } from "firebase/app";

// Cấu hình kết nối Firebase dành cho trình duyệt (Web)
const firebaseConfig = {
  // Các mã này bạn vào Firebase Console -> Project Settings (Bánh răng ⚙️) -> General -> Copy dán vào:
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "greenslot-46382.firebaseapp.com",
  projectId: "greenslot-46382",
  
  // 💥 ĐIỂM QUAN TRỌNG NHẤT: Phải copy y chang dòng storageBucket bên Spring Boot bỏ vào đây
  storageBucket: "greenslot-46382.firebasestorage.app", 
  
  messagingSenderId: "123456789000",
  appId: "1:123456789000:web:xxxxxxxxxxxxxxxxxxxx"
};

// Khởi tạo app và xuất ra cho file firebaseUpload.ts sử dụng
export const app = initializeApp(firebaseConfig);