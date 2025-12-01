import express from 'express';
import {
    createPaymentUrl,
    vnpayReturn,
    vnpayIPN,
    createMomoPaymentUrl,
    momoReturn,
    momoIPN,
    getBankInfo,
    confirmBankTransfer,
    getPaymentHistory,
    getAdminPaymentHistory
} from '../controller/PaymentController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// ===== VNPAY Routes =====
router.post('/vnpay/create-url', verifyToken, createPaymentUrl);
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIPN);

// ===== MOMO Routes =====
router.post('/momo/create-url', verifyToken, createMomoPaymentUrl);
router.get('/momo-return', momoReturn);
router.post('/momo-ipn', momoIPN);

// ===== Bank Transfer Routes =====
router.get('/bank-info', verifyToken, getBankInfo);
router.post('/bank-confirm', verifyToken, checkAdmin, confirmBankTransfer);

// ===== Payment History =====
router.get('/history', verifyToken, getPaymentHistory);
router.get('/history/admin', verifyToken, checkAdmin, getAdminPaymentHistory);

// Backward compatibility (deprecated)
router.post('/create-url', verifyToken, createPaymentUrl);

export default router;
