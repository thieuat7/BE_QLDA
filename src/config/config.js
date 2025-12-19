import dotenv from 'dotenv';
dotenv.config(); // Nạp biến môi trường từ file .env

export default {
  development: {
    username: process.env.USER_DATA || 'root',
    // SỬA QUAN TRỌNG: Nếu không có biến môi trường thì mặc định là null (không mật khẩu)
    // Thay vì mặc định là '123456' gây lỗi nếu máy bạn không cài pass
    password: process.env.PASSWORD_DATA || null, 
    database: process.env.DATABASE_DATA || 'bookingcare',
    host: process.env.HOST_DATA || 'localhost',
    port: process.env.PORT_DATA || 3309, 
    dialect: 'mysql', 
    logging: false, // Tắt log SQL để terminal đỡ rối
    dialectOptions: {
      charset: 'utf8mb4'
    }
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    // Trên Render, code sẽ đọc các biến này từ tab Environment
    username: process.env.USER_DATA,
    password: process.env.PASSWORD_DATA,
    database: process.env.DATABASE_DATA,
    host: process.env.HOST_DATA,
    port: process.env.PORT_DATA || 5432, // Port mặc định của Postgres
    dialect: 'postgres', // Bắt buộc là postgres trên Render
    logging: false,
    dialectOptions: {
      ssl: {
        require: true, // Render bắt buộc dùng SSL
        rejectUnauthorized: false // Chấp nhận chứng chỉ tự ký của Render
      }
    },
    query: {
      raw: true
    },
    timezone: "+07:00"
  }
};