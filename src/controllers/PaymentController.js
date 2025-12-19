import crypto from 'crypto';
import querystring from 'querystring';
import moment from 'moment';
import axios from 'axios';

/**
 * VNPAY Configuration
 * Đăng ký tài khoản sandbox tại: https://sandbox.vnpayment.vn/
 */
const VNPAY_CONFIG = {
    vnp_TmnCode: 'HCMRE7OM', // Mã website tại VNPAY (lấy từ sandbox)
    vnp_HashSecret: '7B62KFHKN653HAESIV1Z6CPYJPCOZH9X', // Chuỗi bí mật (lấy từ sandbox)
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // URL thanh toán sandbox
    vnp_ReturnUrl: 'https://be-qlda.onrender.com/api/payment/vnpay-return' // URL callback về backend
};

/**
 * Tạo chữ ký HMAC SHA512 cho VNPAY
 */
function createSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha512', secretKey);
    return hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
}

/**
 * MOMO Configuration
 * Đăng ký tài khoản test tại: https://developers.momo.vn/
 */
const MOMO_CONFIG = {
    // Test credentials (from MoMo docs / sample). Replace with your merchant keys in production or use env vars.
    partnerCode: 'MOMO',
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: 'https://be-qlda.onrender.com/api/payment/momo-return',
    ipnUrl: 'https://be-qlda.onrender.com/api/payment/momo-ipn'
};

/**
 * Bank Transfer Configuration (Chuyển khoản ngân hàng)
 * VietQR hỗ trợ: VCB, TCB, MB, VietinBank, BIDV, ACB, TPBank, Techcombank, Sacombank, v.v.
 */
const BANK_CONFIG = {
    bankName: 'VCB', // Mã ngân hàng (VCB = Vietcombank, TCB = Techcombank, MB = MBBank)
    accountNumber: '1033238856', // Số tài khoản thật của bạn
    accountName: 'BABY Shark', // Tên chủ tài khoản
    branch: 'Chi nhanh Ho Chi Minh' // Chi nhánh (không bắt buộc)
};

/**
 * Tạo chữ ký HMAC SHA256 cho Momo
 */
function createMomoSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha256', secretKey);
    return hmac.update(data).digest('hex');
}

/**
 * Sắp xếp object theo key (yêu cầu của VNPAY)
 */
function sortObject(obj) {
    // Make function resilient to non-plain objects (e.g., URLSearchParams)
    // VNPAY requires keys to be plain (not encoded) and values encoded.
    const source = obj && typeof obj === 'object' ? obj : {};
    const keys = Object.keys(source).map(k => k);
    keys.sort();
    const sorted = {};
    for (const k of keys) {
        const rawVal = source[k] == null ? '' : source[k];
        const encodedVal = encodeURIComponent(rawVal).replace(/%20/g, "+");
        // Keep key unencoded per VNPAY spec
        sorted[k] = encodedVal;
    }
    return sorted;
}

export const createPaymentUrl = (req, res) => {
    try {
        const { orderId, amount, orderInfo, bankCode } = req.body;

        // 1. Validation cơ bản
        if (!orderId || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId hoặc amount' });
        }

        // 2. Lấy IP
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        // 3. Config tham số VNPAY
        const tmnCode = VNPAY_CONFIG.vnp_TmnCode;
        const secretKey = VNPAY_CONFIG.vnp_HashSecret.trim(); // QUAN TRỌNG: trim() để xóa khoảng trắng thừa nếu có
        const vnpUrl = VNPAY_CONFIG.vnp_Url;
        const returnUrl = VNPAY_CONFIG.vnp_ReturnUrl;

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = orderInfo || `Thanh toan don hang ${orderId}`;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100; // Nhân 100
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_ExpireDate'] = expireDate;

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // --- PHẦN QUAN TRỌNG NHẤT: SẮP XẾP VÀ TẠO CHỮ KÝ ---

        // BƯỚC 1: Sắp xếp object params theo thứ tự từ điển (a-z)
        // Lưu ý: Dùng hàm sortObject chuẩn của VNPAY hoặc logic sort keys bên dưới
        vnp_Params = sortObject(vnp_Params);

        // BƯỚC 2: Tạo chuỗi signData (raw string)
        // Logic này đảm bảo giống hệt tool test: key=value&key=value...
        let signData = '';
        let i = 0;
        for (let key in vnp_Params) {
            if (i === 1) {
                signData += '&' + key + '=' + vnp_Params[key];
            } else {
                signData += key + '=' + vnp_Params[key];
                i = 1;
            }
        }

        // BƯỚC 3: Hash chuỗi signData
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        // BƯỚC 4: Thêm chữ ký vào params
        vnp_Params['vnp_SecureHash'] = signed;

        // BƯỚC 5: Tạo URL cuối cùng
        // Chú ý: signData ở đây đã được encode trong bước sortObject rồi
        const finalUrl = vnpUrl + '?' + signData + '&vnp_SecureHash=' + signed;

        // Log ra để check lần cuối nếu cần
        console.log("--- DEBUG VNPAY ---");
        console.log("SignData:", signData);
        console.log("SecureHash:", signed);
        console.log("Final URL:", finalUrl);

        return res.status(200).json({
            success: true,
            message: 'Success',
            data: { paymentUrl: finalUrl }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating payment url' });
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

        // Tạo hash data theo chuẩn VNPAY: keys must be plain, values already encoded by sortObject
        let hashdata = '';
        let i = 0;
        for (let key in vnp_Params) {
            if (i == 1) {
                hashdata += '&' + key + '=' + vnp_Params[key];
            } else {
                hashdata += key + '=' + vnp_Params[key];
                i = 1;
            }
        }
        const checkSum = createSignature(hashdata, VNPAY_CONFIG.vnp_HashSecret);

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
        const order = await db.Order.findByPk(orderId, {
            raw: true,
            nest: true
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Cập nhật trạng thái thanh toán
        if (responseCode === '00') {
            // Thanh toán thành công
            const db = (await import('../models/index.js')).default;
            const t = await db.sequelize.transaction();
            try {
                // Reload order with details inside transaction
                const orderForUpdate = await db.Order.findByPk(orderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t,
                    raw: true,
                    nest: true
                });

                if (!orderForUpdate) {
                    await t.rollback();
                    return res.status(404).json({ success: false, message: 'Order not found' });
                }

                if (orderForUpdate.reserveOnly) {
                    // Decrement stock for each detail
                    if (orderForUpdate.OrderDetails && orderForUpdate.OrderDetails.length > 0) {
                        for (const detail of orderForUpdate.OrderDetails) {
                            await db.Product.decrement('quantity', {
                                by: detail.quantity,
                                where: { id: detail.productId },
                                transaction: t
                            });
                        }
                    }
                    // mark reserveOnly false
                    orderForUpdate.reserveOnly = false;
                }

                orderForUpdate.paymentStatus = 'paid';
                orderForUpdate.transactionId = transactionId;
                await orderForUpdate.save({ transaction: t });

                await t.commit();

                // Redirect về frontend với trạng thái thành công
                return res.redirect(`https://fe-qlda1.onrender.com/order-success?orderId=${orderId}`);
            } catch (err) {
                await t.rollback();
                console.error('VNPAY return commit error:', err);
                return res.status(500).json({ success: false, message: 'Error updating order after payment', error: err.message });
            }
        } else {
            // Thanh toán thất bại
            order.paymentStatus = 'failed';
            await order.save();

            // Redirect về frontend với trạng thái thất bại
            return res.redirect(`https://fe-qlda1.onrender.com/order-failed?orderId=${orderId}&code=${responseCode}`);
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
        // Build hashdata: keys plain, values are encoded by sortObject
        let hashdata = '';
        let i = 0;
        for (let key in vnp_Params) {
            if (i == 1) {
                hashdata += '&' + key + '=' + vnp_Params[key];
            } else {
                hashdata += key + '=' + vnp_Params[key];
                i = 1;
            }
        }
        const checkSum = createSignature(hashdata, VNPAY_CONFIG.vnp_HashSecret);

        if (secureHash !== checkSum) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }

        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionId = vnp_Params['vnp_TransactionNo'];

        const db = (await import('../models/index.js')).default;
        const order = await db.Order.findByPk(orderId, {
            raw: true,
            nest: true
        });

        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // Kiểm tra order đã được cập nhật chưa
        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        // Cập nhật trạng thái (server-to-server)
        if (responseCode === '00') {
            const db = (await import('../models/index.js')).default;
            const t = await db.sequelize.transaction();
            try {
                const orderForUpdate = await db.Order.findByPk(orderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t,
                    raw: true,
                    nest: true
                });

                if (!orderForUpdate) {
                    await t.rollback();
                    return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
                }

                if (orderForUpdate.reserveOnly) {
                    if (orderForUpdate.OrderDetails && orderForUpdate.OrderDetails.length > 0) {
                        for (const detail of orderForUpdate.OrderDetails) {
                            await db.Product.decrement('quantity', {
                                by: detail.quantity,
                                where: { id: detail.productId },
                                transaction: t
                            });
                        }
                    }
                    orderForUpdate.reserveOnly = false;
                }

                orderForUpdate.paymentStatus = 'paid';
                orderForUpdate.transactionId = transactionId;
                await orderForUpdate.save({ transaction: t });

                await t.commit();
                return res.status(200).json({ RspCode: '00', Message: 'Success' });
            } catch (err) {
                await t.rollback();
                console.error('VNPAY IPN commit error:', err);
                return res.status(200).json({ RspCode: '99', Message: 'Error' });
            }
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
export const momoPayment = async (req, res) => {
    try {
        // Lấy thông tin từ body hoặc dùng mặc định
        const amount = (req.body.amount || '50000').toString();
        const orderInfo = req.body.orderInfo || 'pay with MoMo';
        const extraData = req.body.extraData || '';
        const requestType = 'payWithMethod';

        // Dùng cấu hình từ MOMO_CONFIG (cập nhật ở đầu file)
        const { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl } = MOMO_CONFIG;

        const requestId = `${partnerCode}${Date.now()}`;
        const orderId = requestId;

        // Tạo raw signature theo format của MoMo
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        // Tạo signature bằng helper
        const signature = createMomoSignature(rawSignature, secretKey);

        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: 'en'
        };

        const momoRes = await axios.post(endpoint, requestBody, { headers: { 'Content-Type': 'application/json' } });

        return res.status(200).json({ success: true, payUrl: momoRes.data.payUrl, data: momoRes.data });
    } catch (error) {
        console.error('MoMo payment error:', error.response?.data || error.message);
        return res.status(500).json({ success: false, message: 'MoMo payment failed', error: error.response?.data || error.message });
    }
};

/**
 * POST /api/payment/momo/create-url
 * Tạo URL thanh toán Momo
 */
export const createMomoPaymentUrl = async (req, res) => {
    try {
        // Debug: log incoming headers/body to help identify malformed requests
        console.debug('createMomoPaymentUrl headers:', req.headers);
        console.debug('createMomoPaymentUrl body:', req.body);

        const { orderId, amount, orderInfo } = req.body || {};

        if (!orderId || typeof amount === 'undefined' || amount === null || amount === '') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp orderId và amount',
                receivedBody: req.body
            });
        }
        // Create a unique order id for MoMo to avoid duplicate-order errors
        const momoOrderId = `${orderId}_${Date.now()}`;
        const requestId = momoOrderId;
        const orderInfoText = orderInfo || `Thanh toan don hang ${orderId}`;

        // Use a simple extraData string to avoid JSON quoting issues
        const extraDataString = `originalOrderId=${orderId}`;

        // Ensure amount is a string
        const amountStr = amount.toString();

        // Tạo raw signature theo format của Momo (must match exact order expected by MoMo)
        const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amountStr}&extraData=${extraDataString}&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfoText}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;

        const signature = createMomoSignature(rawSignature, MOMO_CONFIG.secretKey);

        // Request body gửi đến Momo (send unique momoOrderId)
        const requestBody = {
            partnerCode: MOMO_CONFIG.partnerCode,
            accessKey: MOMO_CONFIG.accessKey,
            requestId: requestId,
            amount: amountStr,
            orderId: momoOrderId.toString(),
            orderInfo: orderInfoText,
            redirectUrl: MOMO_CONFIG.redirectUrl,
            ipnUrl: MOMO_CONFIG.ipnUrl,
            extraData: extraDataString,
            requestType: 'payWithMethod',
            signature: signature,
            lang: 'vi'
        };

        // Debug: log rawSignature and requestBody to verify signature input
        console.debug('MoMo rawSignature:', rawSignature);
        console.debug('MoMo requestBody:', requestBody);

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
        const order = await db.Order.findByPk(orderId, {
            raw: true,
            nest: true
        });

        if (!order) {
            return res.redirect(`https://fe-qlda1.onrender.com/order-failed?message=Order not found`);
        }

        // resultCode = 0 là thành công
        if (resultCode === '0') {
            const db = (await import('../models/index.js')).default;
            const t = await db.sequelize.transaction();
            try {
                const orderForUpdate = await db.Order.findByPk(orderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t,
                    raw: true,
                    nest: true
                });

                if (!orderForUpdate) {
                    await t.rollback();
                    return res.redirect(`https://fe-qlda1.onrender.com/order-failed?message=Order not found`);
                }

                if (orderForUpdate.reserveOnly) {
                    if (orderForUpdate.OrderDetails && orderForUpdate.OrderDetails.length > 0) {
                        for (const detail of orderForUpdate.OrderDetails) {
                            await db.Product.decrement('quantity', {
                                by: detail.quantity,
                                where: { id: detail.productId },
                                transaction: t
                            });
                        }
                    }
                    orderForUpdate.reserveOnly = false;
                }

                orderForUpdate.paymentStatus = 'paid';
                orderForUpdate.transactionId = transId;
                await orderForUpdate.save({ transaction: t });

                await t.commit();
                return res.redirect(`https://fe-qlda1.onrender.com/order-success?orderId=${orderId}`);
            } catch (err) {
                await t.rollback();
                console.error('Momo return commit error:', err);
                return res.redirect(`https://fe-qlda1.onrender.com/order-failed?message=System error`);
            }
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.redirect(`https://fe-qlda1.onrender.com/order-failed?orderId=${orderId}&message=${message}`);
        }

    } catch (error) {
        console.error('Momo return error:', error);
        return res.redirect(`https://fe-qlda1.onrender.com/order-failed?message=System error`);
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
        const order = await db.Order.findByPk(orderId, {
            raw: true,
            nest: true
        });

        if (!order) {
            return res.status(200).json({ resultCode: 1, message: 'Order not found' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ resultCode: 0, message: 'Already confirmed' });
        }

        if (resultCode === 0) {
            const db = (await import('../models/index.js')).default;
            const t = await db.sequelize.transaction();
            try {
                const orderForUpdate = await db.Order.findByPk(orderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t,
                    raw: true,
                    nest: true
                });

                if (!orderForUpdate) {
                    await t.rollback();
                    return res.status(200).json({ resultCode: 1, message: 'Order not found' });
                }

                if (orderForUpdate.reserveOnly) {
                    if (orderForUpdate.OrderDetails && orderForUpdate.OrderDetails.length > 0) {
                        for (const detail of orderForUpdate.OrderDetails) {
                            await db.Product.decrement('quantity', {
                                by: detail.quantity,
                                where: { id: detail.productId },
                                transaction: t
                            });
                        }
                    }
                    orderForUpdate.reserveOnly = false;
                }

                orderForUpdate.paymentStatus = 'paid';
                orderForUpdate.transactionId = transId;
                await orderForUpdate.save({ transaction: t });

                await t.commit();
                return res.status(200).json({ resultCode: 0, message: 'Success' });
            } catch (err) {
                await t.rollback();
                console.error('Momo IPN commit error:', err);
                return res.status(200).json({ resultCode: 99, message: 'Error' });
            }
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.status(200).json({ resultCode: 0, message: 'Success' });
        }

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
        const order = await db.Order.findByPk(orderId, {
            raw: true,
            nest: true
        });

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
        const order = await db.Order.findByPk(orderId, {
            raw: true,
            nest: true
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        await db.Order.update(
            { 
                paymentStatus: 'paid',
                transactionId: transactionId || `BANK_${Date.now()}`
            },
            { where: { id: orderId } }
        );

        // Lấy lại order sau update
        const updatedOrder = await db.Order.findByPk(orderId, {
            raw: true,
            nest: true
        });

        return res.status(200).json({
            success: true,
            message: 'Xác nhận thanh toán thành công',
            data: { order: updatedOrder }
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
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset,
            raw: true,
            nest: true
        });

        // Trả về kết quả
        return res.status(200).json({
            success: true,
            message: 'Lịch sử thanh toán',
            data: {
                total: count,
                page: page,
                pageSize: limit,
                orders: orders
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
