import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "./firebase"; // 👉 Import instance firebase app của bạn ở đây

const storage = getStorage(app);

export const uploadTreeImage = async (file: File): Promise<string> => {
  // Tạo tên file duy nhất tránh bị trùng (tên-cây_timestamp.jpg)
  const fileName = `trees/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, fileName);

  // Bắt đầu upload
  const uploadTask = await uploadBytesResumable(storageRef, file);
  
  // Trả về đường dẫn web chính thức sau khi tải xong
  const downloadURL = await getDownloadURL(uploadTask.ref);
  return downloadURL;
};

// 💥 THÊM HÀM NÀY: Xóa ảnh khỏi kho Firebase Storage dựa vào link URL
export const deleteTreeImage = async (imageUrl: string): Promise<void> => {
  try {
    // Chỉ xử lý nếu đúng là link tải từ Firebase Storage
    if (!imageUrl || !imageUrl.includes("firebasestorage.googleapis.com")) return;
    
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log("♻️ Đã dọn dẹp ảnh tạm trên Firebase Storage:", imageUrl);
  } catch (error) {
    console.warn("Không thể xóa ảnh cũ trên Firebase (Có thể ảnh đã bị xóa trước đó):", error);
  }
};