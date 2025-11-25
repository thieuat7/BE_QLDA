import bcrypt from 'bcrypt';
import db from '../models/index.js';

// POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { username, email, password, confirmPassword, fullName, phone } = req.body;

        // 1. Validate request body
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc (username, email, password, confirmPassword)'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không đúng định dạng'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Validate password match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu xác nhận không khớp'
            });
        }

        // 2. Kiểm tra email đã tồn tại chưa
        const existingUserByEmail = await db.User.findOne({
            where: { email }
        });

        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được đăng ký'
            });
        }

        // Kiểm tra username đã tồn tại chưa
        const existingUserByUsername = await db.User.findOne({
            where: { userName: username }
        });

        if (existingUserByUsername) {
            return res.status(409).json({
                success: false,
                message: 'Username đã tồn tại'
            });
        }

        // 3. Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Tạo user mới
        const newUser = await db.User.create({
            userName: username,
            email,
            passwordHash: hashedPassword,
            fullName: fullName || null,
            phone: phone || null
        });

        // 5. Trả về thông tin user (không trả password)
        const userResponse = {
            id: newUser.id,
            username: newUser.userName,
            email: newUser.email,
            fullName: newUser.fullName,
            phone: newUser.phone,
            createdAt: newUser.createdAt
        };

        return res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            data: userResponse
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký tài khoản',
            error: error.message
        });
    }
};

// POST /api/auth/login (Optional - để sau)
export const login = async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Login API chưa được triển khai'
    });
};
