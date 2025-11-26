import db from '../models/index.js';

/**
 * GET /api/users/me
 * Lấy thông tin profile của user đang đăng nhập
 */
export const getMyProfile = async (req, res) => {
    try {
        // req.user đã được set bởi verifyToken middleware
        const user = req.user;

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin profile thành công',
            data: {
                user: {
                    id: user.id,
                    userName: user.userName,
                    email: user.email,
                    fullName: user.fullName,
                    phone: user.phone,
                    role: user.role,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin profile',
            error: error.message
        });
    }
};

/**
 * PUT /api/users/me
 * Cập nhật thông tin profile của user đang đăng nhập
 */
export const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { userName, email, fullName, phone } = req.body;

        // Validate: ít nhất phải có 1 field để update
        if (!userName && !email && !fullName && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ít nhất một thông tin để cập nhật (userName, email, fullName, phone)'
            });
        }

        // Validate email format nếu có
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không đúng định dạng'
                });
            }

            // Kiểm tra email đã tồn tại chưa (trừ email của chính user này)
            const existingUser = await db.User.findOne({
                where: { email: email }
            });

            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    success: false,
                    message: 'Email đã được sử dụng bởi người dùng khác'
                });
            }
        }

        // Kiểm tra username đã tồn tại chưa (trừ username của chính user này)
        if (userName) {
            const existingUser = await db.User.findOne({
                where: { userName: userName }
            });

            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    success: false,
                    message: 'Username đã được sử dụng bởi người dùng khác'
                });
            }
        }

        // Tạo object chứa các field cần update
        const updateData = {};
        if (userName) updateData.userName = userName;
        if (email) updateData.email = email;
        if (fullName) updateData.fullName = fullName;
        if (phone) updateData.phone = phone;

        // Cập nhật vào database
        await db.User.update(updateData, {
            where: { id: userId }
        });

        // Lấy lại thông tin user sau khi update
        const updatedUser = await db.User.findByPk(userId, {
            attributes: ['id', 'userName', 'email', 'fullName', 'phone', 'role', 'createdAt', 'updatedAt']
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                user: updatedUser
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin',
            error: error.message
        });
    }
};

/**
 * GET /api/users
 * Admin lấy danh sách tất cả users (có phân trang)
 */
export const getAllUsers = async (req, res) => {
    try {
        // Lấy params phân trang từ query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Đếm tổng số users
        const totalUsers = await db.User.count();

        // Lấy danh sách users
        const users = await db.User.findAll({
            attributes: ['id', 'userName', 'email', 'fullName', 'phone', 'role', 'createdAt'],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách users thành công',
            data: {
                users: users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers: totalUsers,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách users',
            error: error.message
        });
    }
};

/**
 * DELETE /api/users/:id
 * Admin xóa user theo id
 */
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Kiểm tra user có tồn tại không
        const user = await db.User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy user với ID này'
            });
        }

        // Không cho phép admin tự xóa chính mình
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể xóa chính tài khoản của mình'
            });
        }

        // Xóa user
        await db.User.destroy({
            where: { id: userId }
        });

        return res.status(200).json({
            success: true,
            message: 'Xóa user thành công',
            data: {
                deletedUserId: userId
            }
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa user',
            error: error.message
        });
    }
};
