import express from 'express';
import { createDiscount, getAllDiscounts, updateDiscount, deleteDiscount } from '../controller/DiscountController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes - tất cả đều yêu cầu admin role
router.post('/', verifyToken, checkAdmin, createDiscount);           // Tạo mã giảm giá
router.get('/', verifyToken, checkAdmin, getAllDiscounts);           // Lấy danh sách mã giảm giá
router.put('/:id', verifyToken, checkAdmin, updateDiscount);         // Cập nhật mã giảm giá
router.delete('/:id', verifyToken, checkAdmin, deleteDiscount);      // Xóa mã giảm giá

export default router;
