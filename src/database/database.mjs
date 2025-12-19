import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const connectDB = async () => {
    try {
        let sequelize;
        const env = process.env.NODE_ENV || 'development';

        // TRƯỜNG HỢP 1: Chạy trên RENDER (Production)
        // Kiểm tra xem có biến môi trường DATABASE_URL không
        if (process.env.DATABASE_URL) {
            console.log('🔄 Detected Render environment, connecting via URL...');
            
            sequelize = new Sequelize(process.env.DATABASE_URL, {
                dialect: 'postgres', // Render mặc định dùng Postgres
                protocol: 'postgres',
                logging: false, // Tắt log query cho đỡ rối
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false // BẮT BUỘC ĐỐI VỚI RENDER
                    }
                }
            });
        } 
        // TRƯỜNG HỢP 2: Chạy ở máy Local (Development)
        // Giữ nguyên logic cũ của bạn
        else {
            console.log('💻 Detected Local environment, reading config.js...');
            const configPath = join(__dirname, '../config/config.js');
            
            // Kiểm tra file có tồn tại không để tránh crash
            try {
                const configData = JSON.parse(readFileSync(configPath, 'utf8'));
                const config = configData[env];
                sequelize = new Sequelize(config.database, config.username, config.password, config);
            } catch (err) {
                console.error('❌ Could not read config.js. Make sure it exists locally.');
                throw err;
            }
        }

        // Kiểm tra kết nối
        await sequelize.authenticate();
        console.log('✓ Database connection established successfully');

        // Gán sequelize instance vào global hoặc export ra nếu cần dùng ở model
        // global.sequelize = sequelize; 
        
        return sequelize; // Nên return về instance để sử dụng sau này
    } catch (error) {
        console.error('✗ Unable to connect to database:', error.message);
        // Trả về null hoặc throw error để app biết là DB tạch
        return null;
    }
};