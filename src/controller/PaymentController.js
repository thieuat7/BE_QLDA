import crypto from 'crypto';
import querystring from 'querystring';
import moment from 'moment';
import axios from 'axios';

/**
 * VNPAY Configuration
 * Đăng ký tài khoản sandbox tại: https://sandbox.vnpayment.vn/
 */
const VNPAY_CONFIG = {
    vnp_TmnCode: 'YOUR_TMN_CODE', // Mã website tại VNPAY (lấy từ sandbox)
    vnp_HashSecret: 'YOUR_HASH_SECRET', // Chuỗi bí mật (lấy từ sandbox)
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // URL thanh toán sandbox
    vnp_ReturnUrl: 'http://localhost:3000/api/payment/vnpay-return' // URL callback về backend
};

/**
 * MOMO Configuration
 * Đăng ký tài khoản test tại: https://developers.momo.vn/
 */
const MOMO_CONFIG = {
    partnerCode: 'MOMO_PARTNER_CODE',
    accessKey: 'MOMO_ACCESS_KEY',
    secretKey: 'MOMO_SECRET_KEY',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: 'http://localhost:3000/api/payment/momo-return',
    ipnUrl: 'http://localhost:3000/api/payment/momo-ipn'
};

/**
 * Bank Transfer Configuration (Chuyển khoản ngân hàng)
 */
const BANK_CONFIG = {
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'CONG TY TNHH ABC',
    branch: 'Chi nhanh Ha Noi'
};

/**
 * Sắp xếp object theo key (yêu cầu của VNPAY)
 */
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

/**
 * Tạo chữ ký HMAC SHA512 (yêu cầu của VNPAY)
 */
function createSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
    return signed;
}

/**
 * POST /api/payment/create-url
 * Tạo URL thanh toán VNPAY
 */
export const createPaymentUrl = (req, res) => {
    try {
        const { orderId, amount, orderInfo, bankCode } = req.body;

        // Validate
        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp orderId và amount'
            });
        }

        // Tạo ngày giờ
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss'); // Hết hạn sau 15 phút

        // Lấy IP của client
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        // Tạo các tham số VNPAY
        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId.toString(), // Mã đơn hàng (unique)
            vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: Math.round(amount * 100), // VNPAY yêu cầu nhân 100 (đơn vị: đồng)
            vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate
        };

        // Thêm bankCode nếu có (cho phép chọn ngân hàng cụ thể)
        if (bankCode) {
            vnp_Params.vnp_BankCode = bankCode;
        }

        // Sắp xếp params theo alphabet
        vnp_Params = sortObject(vnp_Params);

        // Tạo query string
        const signData = querystring.stringify(vnp_Params, { encode: false });

        // Tạo chữ ký
        const secureHash = createSignature(signData, VNPAY_CONFIG.vnp_HashSecret);
        vnp_Params['vnp_SecureHash'] = secureHash;

        // Tạo URL thanh toán
        const paymentUrl = VNPAY_CONFIG.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

        return res.status(200).json({
            success: true,
            message: 'Tạo URL thanh toán thành công',
            data: {
                paymentUrl: paymentUrl
            }
        });

    } catch (error) {
        console.error('Create payment URL error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo URL thanh toán',
            error: error.message
        });
    }
};

/**
 * GET /api/payment/vnpay-return
 * Callback từ VNPAY sau khi user thanh toán
 */
export const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;

        // Lấy secureHash từ VNPAY
        const secureHash = vnp_Params['vnp_SecureHash'];

        // Xóa các field không cần thiết để tạo lại signature
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sắp xếp params
        vnp_Params = sortObject(vnp_Params);

        // Tạo lại signature để verify
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const checkSum = createSignature(signData, VNPAY_CONFIG.vnp_HashSecret);

        // Kiểm tra chữ ký hợp lệ
        if (secureHash !== checkSum) {
            return res.status(400).json({
                success: false,
                message: 'Chữ ký không hợp lệ'
            });
        }

        // Lấy thông tin từ VNPAY
        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionId = vnp_Params['vnp_TransactionNo'];
        const amount = parseInt(vnp_Params['vnp_Amount']) / 100; // Chia 100 để về đơn vị VNĐ

        // Import db để cập nhật order
        const db = (await import('../models/index.js')).default;

        // Tìm order
        const order = await db.Order.findByPk(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Cập nhật trạng thái thanh toán
        if (responseCode === '00') {
            // Thanh toán thành công
            order.paymentStatus = 'paid';
            order.transactionId = transactionId;
            await order.save();

            // Redirect về frontend với trạng thái thành công
            return res.redirect(`http://localhost:3001/order-success?orderId=${orderId}`);
        } else {
            // Thanh toán thất bại
            order.paymentStatus = 'failed';
            await order.save();

            // Redirect về frontend với trạng thái thất bại
            return res.redirect(`http://localhost:3001/order-failed?orderId=${orderId}&code=${responseCode}`);
        }

    } catch (error) {
        console.error('VNPAY return error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý callback từ VNPAY',
            error: error.message
        });
    }
};

/**
 * GET /api/payment/vnpay-ipn (IPN - Instant Payment Notification)
 * Webhook từ VNPAY để cập nhật trạng thái thanh toán (server-to-server)
 * Khác với vnpay-return (redirect user), IPN là VNPAY gọi trực tiếp đến server
 */
export const vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const checkSum = createSignature(signData, VNPAY_CONFIG.vnp_HashSecret);

        if (secureHash !== checkSum) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }

        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionId = vnp_Params['vnp_TransactionNo'];

        const db = (await import('../models/index.js')).default;
        const order = await db.Order.findByPk(orderId);

        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // Kiểm tra order đã được cập nhật chưa
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        // Cập nhật trạng thái
        if (responseCode === '00') {
            order.paymentStatus = 'paid';
            order.transactionId = transactionId;
            await order.save();
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        }

    } catch (error) {
        console.error('VNPAY IPN error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

// ==================== MOMO PAYMENT ====================

/**
 * Tạo chữ ký HMAC SHA256 cho Momo
 */
function createMomoSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha256', secretKey);
    return hmac.update(data).digest('hex');
}

/**
 * POST /api/payment/momo/create-url
 * Tạo URL thanh toán Momo
 */
export const createMomoPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, orderInfo } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp orderId và amount'
            });
        }

        const requestId = `${orderId}_${Date.now()}`;
        const orderInfoText = orderInfo || `Thanh toan don hang ${orderId}`;

        // Tạo raw signature theo format của Momo
        const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfoText}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

        const signature = createMomoSignature(rawSignature, MOMO_CONFIG.secretKey);

        // Request body gửi đến Momo
        const requestBody = {
            partnerCode: MOMO_CONFIG.partnerCode,
            accessKey: MOMO_CONFIG.accessKey,
            requestId: requestId,
            amount: amount.toString(),
            orderId: orderId.toString(),
            orderInfo: orderInfoText,
            redirectUrl: MOMO_CONFIG.redirectUrl,
            ipnUrl: MOMO_CONFIG.ipnUrl,
            extraData: '',
            requestType: 'captureWallet',
            signature: signature,
            lang: 'vi'
        };

        // Gọi API Momo
        const response = await axios.post(MOMO_CONFIG.endpoint, requestBody);

        if (response.data.resultCode === 0) {
            return res.status(200).json({
                success: true,
                message: 'Tạo URL thanh toán Momo thành công',
                data: {
                    paymentUrl: response.data.payUrl,
                    qrCodeUrl: response.data.qrCodeUrl
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Lỗi từ Momo: ' + response.data.message
            });
        }

    } catch (error) {
        console.error('Create Momo payment URL error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo URL thanh toán Momo',
            error: error.message
        });
    }
};

/**
 * GET /api/payment/momo-return
 * Callback từ Momo sau khi thanh toán
 */
export const momoReturn = async (req, res) => {
    try {
        const { orderId, resultCode, transId, message } = req.query;

        const db = (await import('../models/index.js')).default;
        const order = await db.Order.findByPk(orderId);

        if (!order) {
            return res.redirect(`http://localhost:3001/order-failed?message=Order not found`);
        }

        // resultCode = 0 là thành công
        if (resultCode === '0') {
            order.paymentStatus = 'paid';
            order.transactionId = transId;
            await order.save();
            return res.redirect(`http://localhost:3001/order-success?orderId=${orderId}`);
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.redirect(`http://localhost:3001/order-failed?orderId=${orderId}&message=${message}`);
        }

    } catch (error) {
        console.error('Momo return error:', error);
        return res.redirect(`http://localhost:3001/order-failed?message=System error`);
    }
};

/**
 * POST /api/payment/momo-ipn
 * Webhook từ Momo
 */
export const momoIPN = async (req, res) => {
    try {
        const { orderId, resultCode, transId, signature } = req.body;

        // Verify signature (cần implement verify theo docs Momo)
        // ...

        const db = (await import('../models/index.js')).default;
        const order = await db.Order.findByPk(orderId);

        if (!order) {
            return res.status(200).json({ resultCode: 1, message: 'Order not found' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ resultCode: 0, message: 'Already confirmed' });
        }

        if (resultCode === 0) {
            order.paymentStatus = 'paid';
            order.transactionId = transId;
            await order.save();
        } else {
            order.paymentStatus = 'failed';
            await order.save();
        }

        return res.status(200).json({ resultCode: 0, message: 'Success' });

    } catch (error) {
        console.error('Momo IPN error:', error);
        return res.status(200).json({ resultCode: 99, message: 'Error' });
    }
};

// ==================== BANK TRANSFER ====================

/**
 * GET /api/payment/bank-info
 * Lấy thông tin chuyển khoản ngân hàng
 */
export const getBankInfo = async (req, res) => {
    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp orderId'
            });
        }

        const db = (await import('../models/index.js')).default;
        const order = await db.Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Tạo nội dung chuyển khoản với mã đơn hàng
        const transferContent = `DH${orderId} ${order.customerName}`;

        return res.status(200).json({
            success: true,
            message: 'Thông tin chuyển khoản ngân hàng',
            data: {
                bankName: BANK_CONFIG.bankName,
                accountNumber: BANK_CONFIG.accountNumber,
                accountName: BANK_CONFIG.accountName,
                branch: BANK_CONFIG.branch,
                amount: order.totalAmount,
                transferContent: transferContent,
                qrCode: `https://img.vietqr.io/image/${BANK_CONFIG.bankName}-${BANK_CONFIG.accountNumber}-compact2.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(transferContent)}`,
                note: 'Vui lòng chuyển khoản đúng nội dung để được xác nhận tự động'
            }
        });

    } catch (error) {
        console.error('Get bank info error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin ngân hàng',
            error: error.message
        });
    }
};

/**
 * POST /api/payment/bank-confirm (Admin only)
 * Admin xác nhận đã nhận được tiền chuyển khoản
 */
export const confirmBankTransfer = async (req, res) => {
    try {
        const { orderId, transactionId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp orderId'
            });
        }

        const db = (await import('../models/index.js')).default;
        const order = await db.Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        order.paymentStatus = 'paid';
        order.transactionId = transactionId || `BANK_${Date.now()}`;
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Xác nhận thanh toán thành công',
            data: { order }
        });

    } catch (error) {
        console.error('Confirm bank transfer error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xác nhận thanh toán',
            error: error.message
        });
    }
};

// ==================== PAYMENT HISTORY ====================

/**
 * GET /api/payment/history
 * Lấy lịch sử thanh toán của user
 */
export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const paymentStatus = req.query.paymentStatus; // Filter theo trạng thái

        const db = (await import('../models/index.js')).default;

        const whereClause = { userId: userId };
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image']
                        }
                    ]
                },
                {
                    model: db.Discount,
                    as: 'discount',
                    attributes: ['code', 'description']
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        // Tính toán thống kê
        const stats = {
            totalOrders: count,
            totalPaid: orders.filter(o => o.paymentStatus === 'paid').length,
            totalPending: orders.filter(o => o.paymentStatus === 'pending').length,
            totalFailed: orders.filter(o => o.paymentStatus === 'failed').length,
            totalAmount: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0)
        };

        return res.status(200).json({
            success: true,
            message: 'Lấy lịch sử thanh toán thành công',
            data: {
                orders: orders,
                stats: stats,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalOrders: count,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thanh toán',
            error: error.message
        });
    }
};

/**
 * GET /api/payment/history/admin (Admin only)
 * Admin xem toàn bộ lịch sử thanh toán
 */
export const getAdminPaymentHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const paymentStatus = req.query.paymentStatus;
        const typePayment = req.query.typePayment;

        const db = (await import('../models/index.js')).default;

        const whereClause = {};
        if (paymentStatus) whereClause.paymentStatus = paymentStatus;
        if (typePayment) whereClause.typePayment = parseInt(typePayment);

        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'userName', 'email', 'phone']
                },
                {
                    model: db.OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title']
                        }
                    ]
                },
                {
                    model: db.Discount,
                    as: 'discount',
                    attributes: ['code']
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        // Thống kê tổng quan
        const allOrders = await db.Order.findAll({
            attributes: [
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalOrders'],
                [db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'totalRevenue']
            ],
            where: { paymentStatus: 'paid' },
            raw: true
        });

        const stats = {
            totalOrders: count,
            totalPaidOrders: allOrders[0]?.totalOrders || 0,
            totalRevenue: parseFloat(allOrders[0]?.totalRevenue || 0),
            pendingOrders: orders.filter(o => o.paymentStatus === 'pending').length,
            failedOrders: orders.filter(o => o.paymentStatus === 'failed').length
        };

        return res.status(200).json({
            success: true,
            message: 'Lấy lịch sử thanh toán thành công',
            data: {
                orders: orders,
                stats: stats,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalOrders: count,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get admin payment history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thanh toán',
            error: error.message
        });
    }
};
