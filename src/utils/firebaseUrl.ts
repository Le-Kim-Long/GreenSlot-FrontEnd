// Backend trả về link ảnh dạng "https://storage.googleapis.com/{bucket}/{path}" (GCS trực tiếp),
// nhưng bucket không public nên link này luôn bị 403 Forbidden khi trình duyệt tải.
// Cần đổi sang link Firebase Storage REST API (?alt=media) mới đọc được.
export function formatFirebaseUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('https://storage.googleapis.com/')) {
    const withoutDomain = url.replace('https://storage.googleapis.com/', '');
    const firstSlashIndex = withoutDomain.indexOf('/');
    if (firstSlashIndex !== -1) {
      const bucket = withoutDomain.substring(0, firstSlashIndex);
      const path = withoutDomain.substring(firstSlashIndex + 1);
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }
  }
  return url;
}
