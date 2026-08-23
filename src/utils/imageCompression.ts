/**
 * Nén ảnh phía client bằng Canvas API trước khi upload.
 * Giảm dung lượng ảnh xuống dưới 2MB để tránh lỗi Vercel proxy 4.5MB payload limit.
 * Resize max 1920px chiều dài nhất, chất lượng JPEG 80%.
 */

const MAX_DIMENSION = 1920;
const QUALITY = 0.8;
const TARGET_MAX_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Nén một File ảnh xuống kích thước nhỏ hơn bằng Canvas resize + JPEG compression.
 * Nếu file đã nhỏ hơn TARGET_MAX_BYTES, trả về nguyên bản.
 */
export async function compressImage(file: File): Promise<File> {
  // Bỏ qua nếu file đã đủ nhỏ hoặc không phải ảnh
  if (file.size <= TARGET_MAX_BYTES || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Resize giữ tỉ lệ, max chiều dài nhất = MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // fallback trả về file gốc nếu canvas không khả dụng
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Tạo File mới với tên gốc, đổi extension sang .jpg
          const compressedName = file.name.replace(/\.[^.]+$/, '.jpg');
          const compressedFile = new File([blob], compressedName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
