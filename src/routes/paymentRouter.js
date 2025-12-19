import express from 'express';
import {
    createPaymentUrl,
    vnpayReturn,
    vnpayIPN,
    createMomoPaymentUrl,
    momoPayment,
    momoReturn,
    momoIPN,
    getBankInfo,
    confirmBankTransfer,
    getPaymentHistory,
    getAdminPaymentHistory
} from '../controllers/PaymentController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// ===== VNPAY Routes =====
router.post('/vnpay/create-url', createPaymentUrl);  // Public cho test
router.post('/create-url', createPaymentUrl);        // Backward compatibility
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIPN);

// ===== MOMO Routes =====
router.post('/momo/create-url', createMomoPaymentUrl);  // Tạo URL thanh toán Momo
router.post('/momo', momoPayment);                      // Short endpoint: POST /api/payment/momo
router.get('/momo-return', momoReturn);                 // Callback sau thanh toán thành công
router.post('/momo-ipn', momoIPN);                      // Webhook IPN từ Momo

// ===== Bank Transfer Routes =====
router.get('/bank-info', getBankInfo);               // Public cho test
router.post('/bank-confirm', verifyToken, checkAdmin, confirmBankTransfer);

// ===== Payment History =====
router.get('/history', verifyToken, getPaymentHistory);
router.get('/history/admin', verifyToken, checkAdmin, getAdminPaymentHistory);

export default router;
