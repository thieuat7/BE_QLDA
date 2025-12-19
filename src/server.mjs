import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Khuyên dùng thư viện cors thay vì set header thủ công
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// --- IMPORT QUAN TRỌNG ---
// Import db từ models/index.js (Nơi chúng ta đã cấu hình chính xác)
import db from './models/index.js'; 
import InitRouter from './routes/router.js';
// import passport from './config/passport.mjs'; // Bỏ comment nếu bạn đã setup passport

dotenv.config();

// Cấu hình __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render sẽ cấp PORT tự động, nếu không có thì dùng 8080 (hoặc 3000)
const port = process.env.PORT || 8080;

// --- Middlewares ---

// 1. CORS: Cho phép Frontend gọi API
// Dùng thư viện 'cors' gọn và chuẩn hơn cách set header thủ công
app.use(cors({
    origin: true, // Chấp nhận mọi nguồn (Dev), hoặc điền domain frontend cụ thể
    credentials: true, // Cho phép gửi cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2. Body Parser: Đọc dữ liệu JSON và Form gửi lên
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// 3. Passport (Nếu dùng)
// app.use(passport.initialize());

// 4. Serve Static Files (Ảnh uploads)
app.use('/Uploads', express.static(path.join(__dirname, '../public/Uploads')));

// --- Routes ---
InitRouter(app);

// --- Khởi động Server ---
const startServer = async () => {
    try {
        // BƯỚC QUAN TRỌNG: Kiểm tra kết nối DB thông qua Sequelize
        await db.sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Nếu DB ok thì mới bật Server lắng nghe
        app.listen(port, () => {
            console.log(`🚀 Server is running on port ${port}`);
            console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        // Log lỗi chi tiết để debug
        console.error(error); 
        
        // Không exit(1) ngay để Render có thể restart hoặc giữ log
    }
};

startServer();