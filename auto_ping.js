import express from 'express';
import cors from 'cors';
import axios from 'axios';
import http from 'http';

const app = express();
app.use(cors());

// ================= TRANG CHỦ =================
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h1 style="color: #16a34a;">✅ Proxy Server Đang Hoạt Động!</h1>
            <p>Hệ thống truyền phát Video từ ESP32 đã sẵn sàng.</p>
        </div>
    `);
});

// ================= CẤU HÌNH =================
const PROXY_PORT = 3000; 
const ESP32_IP = '192.168.1.4'; // CHÚ Ý: Kiểm tra lại IP ESP32 lúc demo
const ESP32_STREAM_URL = `http://${ESP32_IP}:81/stream`;
const BACKEND_API_URL = 'https://greenslot-backend.onrender.com/api/cameras/ping';

// 👇 DÁN LINK CLOUDFLARE VÀO ĐÂY MỖI LẦN CHẠY 👇
const CLOUDFLARE_URL = 'https://wells-rubber-youth-favorite.trycloudflare.com';

// ================= 1. HỆ THỐNG PROXY ĐỘNG CÓ CACHE =================
let clients = []; 
let esp32Controller = null; 

// KHỞI TẠO VÙNG NHỚ CACHE MỞ RỘNG (Giữ khung hình mới nhất)
let frameCache = null; 
let cacheUpdateTime = 0;

function startESP32Stream() {
    console.log("🔄 Bắt đầu yêu cầu luồng video từ ESP32...");
    esp32Controller = new AbortController();

    axios({
        method: 'get',
        url: ESP32_STREAM_URL,
        responseType: 'stream',
        signal: esp32Controller.signal
    }).then(response => {
        console.log("✅ Đã kết nối thành công tới ESP32-CAM!");
        
        response.data.on('data', (chunk) => {
            // LƯU VÀO CACHE: Cập nhật vùng nhớ đệm liên tục
            frameCache = chunk;
            cacheUpdateTime = Date.now();

            clients.forEach(client => {
                try { client.write(chunk); } catch(e) {}
            });
        });
    }).catch(err => {
        if (axios.isCancel(err)) {
            console.log("🛑 Đã cho ESP32 đi ngủ vì không còn ai xem.");
        } else {
            console.log("❌ Không tìm thấy ESP32, thử lại sau 2 giây...");
            setTimeout(() => {
                if (clients.length > 0) startESP32Stream();
            }, 2000);
        }
    });
}

function stopESP32Stream() {
    if (esp32Controller) {
        esp32Controller.abort();
        esp32Controller = null;
    }
    // Xoá cache khi ngừng stream để giải phóng RAM
    frameCache = null; 
}

app.get('/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=123456789000000000000987654321',
        'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'X-Accel-Buffering': 'no'
    });

    res.write('\r\n--123456789000000000000987654321\r\n');

    // PHỤC VỤ TỪ CACHE (Nếu Cache chưa quá cũ - ví dụ < 5 giây)
    if (frameCache && (Date.now() - cacheUpdateTime < 5000)) {
        res.write(frameCache);
        console.log("⚡ Đã phục vụ khung hình đầu tiên từ vùng nhớ Cache!");
    }

    clients.push(res);
    console.log(`🎥 Có người mới vào xem. Tổng số người đang xem: ${clients.length}`);

    if (clients.length === 1) {
        startESP32Stream();
    }

    req.on('close', () => {
        clients = clients.filter(client => client !== res);
        console.log(`👋 Một người vừa thoát. Còn lại: ${clients.length}`);
        
        if (clients.length === 0) {
            stopESP32Stream();
        }
    });
});

const server = http.createServer(app);
server.listen(PROXY_PORT, () => {
    console.log(`\n🚀 [PROXY SERVER] Đang chạy tại http://localhost:${PROXY_PORT}`);
});

// ================= 2. HỆ THỐNG AUTO-PING LÊN SERVER =================
async function autoUpdateCameraUrl() {
    try {
        const streamUrl = CLOUDFLARE_URL + "/stream"; 
        await axios.post(BACKEND_API_URL, {
            cam_id: "CAM_SVIET_01",
            name: "Vườn Rau Tầng 1 (Cloudflare Cache)",
            ip: "Mạng 4G Đồ Án", 
            stream_url: streamUrl,
            capture_url: ""
        });
        console.log(`[${new Date().toLocaleTimeString()}] 🎉 Ping URL Cloudflare thành công!`);
    } catch (error) {
        console.log("❌ Lỗi ping lên Spring Boot...");
    }
}

autoUpdateCameraUrl();
setInterval(autoUpdateCameraUrl, 30000);