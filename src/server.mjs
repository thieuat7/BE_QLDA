import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import InitRouter from './routes/router.js'
import { connectDB } from './database/database.mjs' 
import passport from './config/passport.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Initialize Passport
app.use(passport.initialize())

// CORS middleware
// (Mình giữ nguyên logic của bạn, nó sẽ cho phép Frontend gọi API)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Sau này nên thay '*' bằng link frontend render của bạn
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// Serve static files
app.use('/Uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
}, express.static(path.join(__dirname, '../public/Uploads')))

// Initialize routes
InitRouter(app)

// --- PHẦN QUAN TRỌNG ĐÃ SỬA ---
// Lấy cổng từ Render cấp, nếu chạy local thì mới lấy 3000
const PORT = process.env.PORT || 3000; 

const startServer = async () => {
    try {
        // Kết nối database
        const dbInstance = await connectDB()

        // Kiểm tra dbInstance (vì code connectDB mình đưa trả về object sequelize hoặc null)
        if (dbInstance) {
            
            // Sync database (Tùy chọn: Bỏ comment dòng dưới nếu muốn code tự tạo bảng trên Render)
            // await dbInstance.sync({ alter: true }); 
            // console.log('✓ Database synced successfully');

            app.listen(PORT, '0.0.0.0', () => { // Thêm '0.0.0.0' để chắc chắn lắng nghe mọi IP
                console.log(`✓ Server đang chạy trên cổng: ${PORT}`)
                console.log(`✓ Môi trường: ${process.env.NODE_ENV || 'development'}`)
            })
        } else {
            console.error('✗ Không thể khởi động server do lỗi kết nối database')
            process.exit(1)
        }
    } catch (error) {
        console.error('✗ Lỗi khởi động server:', error.message)
        process.exit(1)
    }
}

startServer()