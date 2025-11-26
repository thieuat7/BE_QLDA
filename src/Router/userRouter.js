import express from 'express';
import { getMyProfile, updateMyProfile, getAllUsers, deleteUser } from '../controller/UserController.js';
import { verifyToken, checkAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes - yêu cầu đăng nhập
router.get('/me', verifyToken, getMyProfile);           // Lấy profile của chính mình
router.put('/me', verifyToken, updateMyProfile);        // Cập nhật profile của chính mình

// Admin routes - yêu cầu đăng nhập + role admin
router.get('/', verifyToken, checkAdmin, getAllUsers);  // Lấy danh sách tất cả users (phân trang)
router.delete('/:id', verifyToken, checkAdmin, deleteUser); // Xóa user theo id

export default router;
