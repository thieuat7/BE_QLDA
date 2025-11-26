import jwt from 'jsonwebtoken';
import db from '../models/index.js';

/**
 * Middleware: verifyToken
 * Đọc và xác thực JWT từ Authorization header
 * Thêm thông tin user vào req.user nếu token hợp lệ
 */
export const verifyToken = async (req, res, next) => {
    try {
        // 1. Lấy token từ header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.'
            });
        }

        // Lấy token (bỏ "Bearer " prefix)
        const token = authHeader.substring(7);

        // 2. Verify token
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Tìm user trong database
        const user = await db.User.findByPk(decoded.id, {
            attributes: ['id', 'userName', 'email', 'fullName', 'phone', 'role', 'createdAt'],
            raw: true
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User không tồn tại hoặc đã bị xóa'
            });
        }

        // 4. Gắn thông tin user vào request
        req.user = user;
        next();

    } catch (error) {
        console.error('Token verification error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực token',
            error: error.message
        });
    }
};

/**
 * Middleware: checkAdmin
 * Kiểm tra user có role 'admin' hay không
 * Phải dùng sau verifyToken middleware
 */
export const checkAdmin = (req, res, next) => {
    try {
        // Kiểm tra req.user đã được set bởi verifyToken chưa
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập trước'
            });
        }

        // Kiểm tra role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này. Chỉ Admin mới được phép.'
            });
        }

        next();

    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền truy cập',
            error: error.message
        });
    }
};
