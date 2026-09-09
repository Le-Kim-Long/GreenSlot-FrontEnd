import axios from 'axios';

// Địa chỉ Spring Boot của bạn trên Render
const BACKEND_API_URL = 'https://greenslot-backend.onrender.com/api/cameras/ping'; 

async function autoUpdateCameraUrl() {
    try {
        const ngrokResponse = await axios.get('http://127.0.0.1:4040/api/tunnels');
        
        const tunnels = ngrokResponse.data.tunnels;
        if (tunnels.length === 0) {
            console.log("❌ Không tìm thấy tunnel. Hãy mở Terminal khác và chạy lệnh 'ngrok http 192.168.1.12:81' trước!");
            return;
        }

        const publicUrl = tunnels[0].public_url;
        const captureUrl = publicUrl + "/capture";
        const streamUrl = publicUrl + "/stream";

        await axios.post(BACKEND_API_URL, {
            cam_id: "CAM_SVIET_01",
            name: "Vườn Rau Tầng 1 (Ngrok)",
            ip: "Mạng 4G Đồ Án", 
            stream_url: streamUrl,
            capture_url: captureUrl
        });

        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] 🎉 Đã ping thành công URL (${publicUrl}) lên Spring Boot!`);

    } catch (error) {
        console.error("❌ Lỗi kết nối:", error.message);
    }
}

// 1. Chạy ngay lập tức lần đầu tiên
console.log("🚀 Đang khởi động Tool Auto-Ping Ngrok...");
autoUpdateCameraUrl();

// 2. Thiết lập vòng lặp cứ mỗi 30 giây chạy lại 1 lần
setInterval(() => {
    autoUpdateCameraUrl();
}, 30000);

console.log("⏳ Đã bật chế độ giữ Server Render thức tỉnh mỗi 30 giây. Nhấn Ctrl + C để thoát.");