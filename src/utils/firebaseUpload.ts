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

// Upload ảnh thiết bị trực tiếp từ trình duyệt lên Firebase Storage (né backend Java —
// endpoint upload ảnh của BE hiện không cấp quyền đọc public nên link luôn bị 403)
export const uploadEquipmentImage = async (file: File): Promise<string> => {
  const fileName = `equipment/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, fileName);
  const uploadTask = await uploadBytesResumable(storageRef, file);
  return getDownloadURL(uploadTask.ref);
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