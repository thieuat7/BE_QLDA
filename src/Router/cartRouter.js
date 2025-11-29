import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../controller/CartController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes yêu cầu đăng nhập
router.get('/', verifyToken, getCart);                          // Lấy giỏ hàng
router.post('/add', verifyToken, addToCart);                    // Thêm sản phẩm vào giỏ
router.put('/update', verifyToken, updateCartItem);             // Cập nhật số lượng
router.delete('/remove/:cartItemId', verifyToken, removeFromCart); // Xóa sản phẩm

export default router;
