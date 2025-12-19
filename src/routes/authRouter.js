import express from 'express';
import { register, login, getCurrentUser, updateProfile, uploadAvatar as uploadAvatarController, changePassword } from '../controllers/AuthController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần token)
router.get('/me', verifyToken, getCurrentUser);

// PUT /api/auth/update-profile - Cập nhật thông tin user (cần token)
router.put('/update-profile', verifyToken, updateProfile);

// POST /api/auth/change-password - Đổi mật khẩu (cần token)
router.post('/change-password', verifyToken, changePassword);

// POST /api/auth/upload-avatar - Upload ảnh đại diện (cần token)
router.post('/upload-avatar', verifyToken, uploadAvatar.single('avatar'), uploadAvatarController);

export default router;
