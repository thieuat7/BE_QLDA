import express from 'express'
import InitRouter from './Router/router.js'
import ViewEngine from './ViewEngire/ViewEnginre.js'
import { connectDB } from './DataBase/database.mjs'

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

ViewEngine(app)
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
