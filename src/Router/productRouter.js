import express from 'express';
import { getAllProducts, searchProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controller/ProductController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/search', searchProducts);          // Tìm kiếm sản phẩm
router.get('/:id', getProductById);             // Lấy chi tiết 1 sản phẩm
router.get('/', getAllProducts);                // Lấy danh sách sản phẩm (có phân trang, filter, sort)

// Admin routes - yêu cầu đăng nhập + role admin
router.post('/', verifyToken, checkAdmin, upload.single('image'), createProduct);      // Tạo sản phẩm mới (có upload ảnh)
router.put('/:id', verifyToken, checkAdmin, upload.single('image'), updateProduct);    // Cập nhật sản phẩm (có upload ảnh)
router.delete('/:id', verifyToken, checkAdmin, deleteProduct);                          // Xóa sản phẩm

export default router;
