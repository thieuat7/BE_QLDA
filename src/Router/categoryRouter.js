import express from 'express';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controller/CategoryController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.get('/', getAllCategories);  // Lấy tất cả danh mục (không cần đăng nhập)

// Admin routes - yêu cầu đăng nhập + role admin
router.post('/', verifyToken, checkAdmin, createCategory);       // Tạo danh mục mới
router.put('/:id', verifyToken, checkAdmin, updateCategory);     // Cập nhật danh mục
router.delete('/:id', verifyToken, checkAdmin, deleteCategory);  // Xóa danh mục

export default router;
