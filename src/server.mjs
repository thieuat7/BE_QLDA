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

// CORS middleware (enable for frontend on different domain)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// Serve static files (images for products) với CORS headers
app.use('/Uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
}, express.static(path.join(__dirname, '../public/Uploads')))

// Initialize routes
InitRouter(app)

const PORT = 3000

// Khởi động server và kết nối database
const startServer = async () => {
    try {
        // Kết nối database
        const isConnected = await connectDB()

        if (isConnected) {
            app.listen(PORT, () => {
                console.log(`✓ Server đang chạy tại http://localhost:${PORT}`)
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
