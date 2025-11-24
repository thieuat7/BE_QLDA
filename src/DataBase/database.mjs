import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connectionDB = mysql.createPool({
    host: process.env.HOST_DATA,
    user: process.env.USER_DATA,
    password: process.env.PASSWORD_DATA,
    port: process.env.PORT_DATA,
    database: process.env.DATABASE_DATA,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test kết nối database
const connectDB = async () => {
    try {
        const connection = await connectionDB.getConnection();
        console.log('✓ Kết nối database thành công!');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ Không thể kết nối database:', error.message);
        return false;
    }
};

export { connectionDB, connectDB };
export default connectionDB;