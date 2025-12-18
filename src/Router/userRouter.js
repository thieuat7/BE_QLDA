import express from 'express';
import { getMyProfile, updateMyProfile, getAllUsers, createUser, getUserById, updateUserByAdmin, deleteUser } from '../controller/UserController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// User routes - yêu cầu đăng nhập
router.get('/me', verifyToken, getMyProfile);           // Lấy profile của chính mình
router.put('/me', verifyToken, updateMyProfile);        // Cập nhật profile của chính mình

// Admin routes - yêu cầu đăng nhập + role admin
router.post('/', verifyToken, checkAdmin, createUser);   // Tạo user mới
router.get('/', verifyToken, checkAdmin, getAllUsers);  // Lấy danh sách tất cả users (phân trang)
router.get('/:id', verifyToken, checkAdmin, getUserById); // Lấy thông tin user theo id
router.put('/:id', verifyToken, checkAdmin, updateUserByAdmin); // Cập nhật user theo id
router.delete('/:id', verifyToken, checkAdmin, deleteUser); // Xóa user theo id

export default router;
