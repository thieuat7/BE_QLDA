import jwt from 'jsonwebtoken';

/**
 * Middleware xác thực JWT token
 * Kiểm tra Authorization header có Bearer token hợp lệ không
 */
export const verifyToken = (req, res, next) => {
    try {
        // Lấy token từ header Authorization: "Bearer <token>"
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục'
            });
        }

        // Tách "Bearer" và lấy token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        // Verify token với JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-2024');

        // Gắn thông tin user vào req để các controller sau sử dụng
        req.user = decoded; // { id: 5, userName: 'user123', email: '...', ... }

        next();
    } catch (error) {
        console.error('Verify token error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn, vui lòng đăng nhập lại'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

/**
 * Middleware kiểm tra role Admin
 * Phải chạy sau verifyToken
 */
export const isAdmin = (req, res, next) => {
    try {
        // req.user đã được gắn từ verifyToken
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        // Kiểm tra role
        if (req.user.role !== 1 && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập chức năng này'
            });
        }

        next();
    } catch (error) {
        console.error('Check admin role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền truy cập'
        });
    }
};

/**
 * Middleware xác thực token (optional)
 * Nếu có token hợp lệ thì gắn vào req.user, không có thì bỏ qua
 * Dùng cho các route có thể login hoặc không login
 */
export const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Nếu không có token, bỏ qua và tiếp tục
        if (!authHeader) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-2024');
        req.user = decoded;

        next();
    } catch (error) {
        // Nếu token không hợp lệ, vẫn cho phép tiếp tục nhưng req.user = null
        console.warn('Optional auth - Invalid token:', error.message);
        req.user = null;
        next();
    }
};
