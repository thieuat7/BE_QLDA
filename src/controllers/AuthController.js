import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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
            where: { email },
            raw: true,
            nest: true
        });

        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được đăng ký'
            });
        }

        // Kiểm tra username đã tồn tại chưa
        const existingUserByUsername = await db.User.findOne({
            where: { userName: username },
            raw: true,
            nest: true
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

        // 4. Tạo user mới với avatar mặc định
        const newUser = await db.User.create({
            userName: username,
            email,
            passwordHash: hashedPassword,
            fullName: fullName || null,
            phone: phone || null,
            avatar: '/Uploads/default-avatar.png' // Avatar mặc định
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

// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate request body
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và password'
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

        // 2. Tìm user trong database bằng email
        const user = await db.User.findOne({
            where: { email },
            attributes: ['id', 'userName', 'email', 'passwordHash', 'fullName', 'phone', 'role', 'createdAt', 'updatedAt'],
            raw: true,
            nest: true
        });

        // Debug: Log để kiểm tra
        console.log('🔍 User data from DB:', {
            id: user?.id,
            email: user?.email,
            role: user?.role
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // 3. So sánh mật khẩu đã hash với bcrypt.compare
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // 4. Tạo JWT Token
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
        const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                userName: user.userName,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 5. Trả về token và thông tin user
        const userResponse = {
            id: user.id,
            username: user.userName,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role || 'user',
            createdAt: user.createdAt
        };

        // Debug log
        console.log('📦 User response:', userResponse);

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: userResponse,
                token,
                expiresIn: JWT_EXPIRES_IN
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: error.message
        });
    }
};

// GET /api/auth/me
export const getCurrentUser = async (req, res) => {
    try {
        // req.user được set từ verifyToken middleware
        const userId = req.user.id;

        // Lấy user và đảm bảo luôn có trường role
        const user = await db.User.findByPk(userId, {
            attributes: ['id', 'userName', 'email', 'fullName', 'phone', 'role', 'googleId', 'facebookId', 'avatar', 'createdAt', 'updatedAt'],
            raw: true,
            nest: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.userName,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
                googleId: user.googleId,
                facebookId: user.facebookId,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin user',
            error: error.message
        });
    }
};

// PUT /api/auth/update-profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Từ verifyToken middleware
        const { userName, phone, email, fullName } = req.body;

        // Validate input
        if (!userName || !phone) {
            return res.status(400).json({
                success: false,
                message: 'userName và phone là bắt buộc'
            });
        }

        // Kiểm tra phone format
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không hợp lệ (10-11 số)'
            });
        }

        // Validate email nếu có
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không đúng định dạng'
                });
            }
        }

        // Kiểm tra userName đã tồn tại chưa (trừ user hiện tại)
        const existingUser = await db.User.findOne({
            where: {
                userName: userName,
                id: { [db.Sequelize.Op.ne]: userId }
            },
            raw: true,
            nest: true
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Prepare update data
        const updateData = {
            userName,
            phone
        };

        // Thêm email và fullName nếu có
        if (email) {
            updateData.email = email;
        }
        if (fullName) {
            updateData.fullName = fullName;
        }

        // Update user
        await db.User.update(updateData, {
            where: { id: userId }
        });

        // Lấy user info mới
        const updatedUser = await db.User.findByPk(userId, {
            attributes: { exclude: ['passwordHash'] },
            raw: true,
            nest: true
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: {
                id: updatedUser.id,
                username: updatedUser.userName,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                phone: updatedUser.phone,
                role: updatedUser.role,
                avatar: updatedUser.avatar
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin',
            error: error.message
        });
    }
};

// POST /api/auth/upload-avatar
export const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        // Kiểm tra có file không
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file ảnh'
            });
        }

        // URL của ảnh (từ multer)
        const avatarUrl = `/Uploads/${req.file.filename}`;

        // Update avatar trong database
        await db.User.update(
            { avatar: avatarUrl },
            { where: { id: userId } }
        );

        // Lấy user info mới
        const updatedUser = await db.User.findByPk(userId, {
            attributes: { exclude: ['passwordHash'] },
            raw: true,
            nest: true
        });

        return res.status(200).json({
            success: true,
            message: 'Upload avatar thành công',
            avatar: avatarUrl,
            user: {
                id: updatedUser.id,
                username: updatedUser.userName,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar
            }
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi upload avatar',
            error: error.message
        });
    }
};

// POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id; // Từ verifyToken middleware
        const { currentPassword, newPassword } = req.body;

        // Validate newPassword
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        // Lấy thông tin user hiện tại
        const user = await db.User.findByPk(userId, {
            raw: true,
            nest: true
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra nếu user đã có password (không phải OAuth user lần đầu)
        if (user.passwordHash) {
            // User đã có password → phải xác thực currentPassword
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập mật khẩu hiện tại'
                });
            }

            // Verify currentPassword
            const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng'
                });
            }
        }
        // Nếu user chưa có password (OAuth user) → cho phép đặt password mới mà không cần currentPassword

        // Hash password mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.User.update(
            { passwordHash: hashedPassword },
            { where: { id: userId } }
        );

        return res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi đổi mật khẩu',
            error: error.message
        });
    }
};
