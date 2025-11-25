import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import InitRouter from './Router/router.js'
import { connectDB } from './DataBase/database.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS middleware (optional - enable if frontend on different domain)
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
// });

// Serve static files (images for products)
app.use('/Uploads', express.static(path.join(__dirname, '../public/Uploads')))

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
