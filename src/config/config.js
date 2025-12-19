import dotenv from 'dotenv';
dotenv.config(); // Nạp biến môi trường từ file .env

export default {
  development: {
    username: process.env.USER_DATA || 'root',
    password: process.env.PASSWORD_DATA || '123456',
    database: process.env.DATABASE_DATA || 'bookingcare',
    host: process.env.HOST_DATA || 'localhost',
    port: process.env.PORT_DATA || 3309, // Cổng MySQL local cũ của bạn
    dialect: 'mysql', // Local bạn vẫn dùng MySQL
    logging: false,
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
    // Trên Render, code sẽ đọc các biến này
    username: process.env.USER_DATA,
    password: process.env.PASSWORD_DATA,
    database: process.env.DATABASE_DATA,
    host: process.env.HOST_DATA,
    port: process.env.PORT_DATA || 5432,
    dialect: 'postgres', // <--- QUAN TRỌNG: Đổi sang postgres
    logging: false,
    dialectOptions: {
      ssl: {
        require: true, // Render bắt buộc dùng SSL cho Postgres
        rejectUnauthorized: false
      }
    },
    query: {
      raw: true
    },
    timezone: "+07:00"
  }
};