import express from 'express';
import { createDiscount, getAllDiscounts, getPublicDiscounts, validateDiscountCode, updateDiscount, deleteDiscount } from '../controllers/DiscountController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes - không cần authentication (phải đặt trước các route có params)
router.get('/public', getPublicDiscounts);                          // Lấy danh sách mã giảm giá công khai
router.post('/validate', validateDiscountCode);                     // Validate mã giảm giá theo code

// Admin routes - tất cả đều yêu cầu admin role
router.post('/', verifyToken, checkAdmin, createDiscount);           // Tạo mã giảm giá
router.get('/', verifyToken, checkAdmin, getAllDiscounts);           // Lấy danh sách mã giảm giá (admin)
router.put('/:id', verifyToken, checkAdmin, updateDiscount);         // Cập nhật mã giảm giá
router.delete('/:id', verifyToken, checkAdmin, deleteDiscount);      // Xóa mã giảm giá

export default router;
