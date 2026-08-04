import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Cấu hình kết nối Firebase từ bạn của bạn
const firebaseConfig = {
  apiKey: "AIzaSyCCJyN_YjyGjXqcKUxJ97s2YGizf4EH25c",
  authDomain: "greenslot-46382.firebaseapp.com",
  projectId: "greenslot-46382",
  storageBucket: "greenslot-46382.firebasestorage.app",
  messagingSenderId: "900995780208",
  appId: "1:900995780208:web:b53b590af03fc1e2b56eb5",
  measurementId: "G-JCYHBNRG93"
};

// Khởi tạo app
export const app = initializeApp(firebaseConfig);

// Khởi tạo analytics (Tùy chọn, nếu bạn không cần dùng Analytics có thể xóa dòng này)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;