import crypto from 'crypto';
import querystring from 'querystring';
import moment from 'moment';
import axios from 'axios';
import { Op } from 'sequelize';
import db from '../models/index.js'; // Import DB ngay đầu file

/**
 * VNPAY Configuration
 */
const VNPAY_CONFIG = {
    vnp_TmnCode: 'HCMRE7OM',
    vnp_HashSecret: '7B62KFHKN653HAESIV1Z6CPYJPCOZH9X',
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnp_ReturnUrl: 'https://be-qlda.onrender.com/api/payment/vnpay-return'
};

/**
 * MOMO Configuration
 */
const MOMO_CONFIG = {
    partnerCode: 'MOMO',
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: 'https://be-qlda.onrender.com/api/payment/momo-return',
    ipnUrl: 'https://be-qlda.onrender.com/api/payment/momo-ipn'
};

/**
 * Bank Transfer Configuration
 */
const BANK_CONFIG = {
    bankName: 'VCB',
    accountNumber: '1033238856',
    accountName: 'BABY Shark',
    branch: 'Chi nhanh Ho Chi Minh'
};

// ===== HELPER FUNCTIONS =====

function createSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha512', secretKey);
    return hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
}

function createMomoSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha256', secretKey);
    return hmac.update(data).digest('hex');
}

function sortObject(obj) {
    const source = obj && typeof obj === 'object' ? obj : {};
    const keys = Object.keys(source).map(k => k);
    keys.sort();
    const sorted = {};
    for (const k of keys) {
        const rawVal = source[k] == null ? '' : source[k];
        const encodedVal = encodeURIComponent(rawVal).replace(/%20/g, "+");
        sorted[k] = encodedVal;
    }
    return sorted;
}

// ===== VNPAY CONTROLLERS =====

export const createPaymentUrl = (req, res) => {
    try {
        const { orderId, amount, orderInfo, bankCode } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId hoặc amount' });
        }

        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        const tmnCode = VNPAY_CONFIG.vnp_TmnCode;
        const secretKey = VNPAY_CONFIG.vnp_HashSecret.trim();
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
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_ExpireDate'] = expireDate;

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

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

        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        const finalUrl = vnpUrl + '?' + signData + '&vnp_SecureHash=' + signed;

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

export const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

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
            return res.status(400).json({ success: false, message: 'Chữ ký không hợp lệ' });
        }

        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionId = vnp_Params['vnp_TransactionNo'];

        // KHÔNG dùng raw: true ở đây vì cần dùng instance methods (.save)
        const order = await db.Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        if (responseCode === '00') {
            const t = await db.sequelize.transaction();
            try {
                const orderForUpdate = await db.Order.findByPk(orderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t
                });

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
                return res.redirect(`https://fe-qlda1.onrender.com/order-success?orderId=${orderId}`);
            } catch (err) {
                await t.rollback();
                console.error('VNPAY return commit error:', err);
                return res.status(500).json({ success: false, message: 'Error updating order', error: err.message });
            }
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.redirect(`https://fe-qlda1.onrender.com/order-failed?orderId=${orderId}&code=${responseCode}`);
        }

    } catch (error) {
        console.error('VNPAY return error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi xử lý VNPAY', error: error.message });
    }
};

export const vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
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

        const order = await db.Order.findByPk(orderId);
        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (responseCode === '00') {
            const t = await db.sequelize.transaction();
            try {
                const orderForUpdate = await db.Order.findByPk(orderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t
                });

                if (orderForUpdate.reserveOnly) {
                    if (orderForUpdate.OrderDetails?.length > 0) {
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
                return res.status(200).json({ RspCode: '99', Message: 'Error' });
            }
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        }
    } catch (error) {
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

// ===== MOMO CONTROLLERS =====

export const momoPayment = async (req, res) => {
    try {
        const amount = (req.body.amount || '50000').toString();
        const orderInfo = req.body.orderInfo || 'pay with MoMo';
        const extraData = req.body.extraData || '';
        const requestType = 'payWithMethod';
        const { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl } = MOMO_CONFIG;
        const requestId = `${partnerCode}${Date.now()}`;
        const orderId = requestId;

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = createMomoSignature(rawSignature, secretKey);

        const requestBody = {
            partnerCode, accessKey, requestId, amount, orderId, orderInfo,
            redirectUrl, ipnUrl, extraData, requestType, signature, lang: 'en'
        };

        const momoRes = await axios.post(endpoint, requestBody, { headers: { 'Content-Type': 'application/json' } });
        return res.status(200).json({ success: true, payUrl: momoRes.data.payUrl, data: momoRes.data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'MoMo payment failed', error: error.message });
    }
};

export const createMomoPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, orderInfo } = req.body || {};

        if (!orderId || typeof amount === 'undefined' || amount === null || amount === '') {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp orderId và amount' });
        }

        const momoOrderId = `${orderId}_${Date.now()}`;
        const requestId = momoOrderId;
        const orderInfoText = orderInfo || `Thanh toan don hang ${orderId}`;
        const extraDataString = `originalOrderId=${orderId}`;
        const amountStr = amount.toString();

        const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amountStr}&extraData=${extraDataString}&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfoText}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.redirectUrl}&requestId=${requestId}&requestType=payWithMethod`;
        const signature = createMomoSignature(rawSignature, MOMO_CONFIG.secretKey);

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

        const response = await axios.post(MOMO_CONFIG.endpoint, requestBody);

        if (response.data.resultCode === 0) {
            return res.status(200).json({
                success: true,
                message: 'Tạo URL thanh toán Momo thành công',
                data: { paymentUrl: response.data.payUrl, qrCodeUrl: response.data.qrCodeUrl }
            });
        } else {
            return res.status(400).json({ success: false, message: 'Lỗi từ Momo: ' + response.data.message });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi khi tạo URL thanh toán Momo', error: error.message });
    }
};

export const momoReturn = async (req, res) => {
    try {
        const { orderId, resultCode, transId, message } = req.query;

        // Tách orderId thực từ momoOrderId (VD: 123_16789... -> 123)
        // Nếu bạn lưu nguyên chuỗi thì dùng findByPk trực tiếp. 
        // Tuy nhiên ở createMomoUrl ta đang gửi momoOrderId = `${orderId}_${timestamp}`
        // Nên ở đây cần tìm đúng orderId gốc.
        // Cách tốt nhất là parse từ extraData (originalOrderId), nhưng req.query của return url có thể ko có extraData đầy đủ.
        // Ở đây giả định orderId trả về là cái ta gửi đi (VD: 123_TIMESTAMP). Ta cần tách lấy ID gốc.
        
        let realOrderId = orderId;
        if (orderId && orderId.includes('_')) {
            realOrderId = orderId.split('_')[0];
        }

        const order = await db.Order.findByPk(realOrderId);

        if (!order) {
            return res.redirect(`https://fe-qlda1.onrender.com/order-failed?message=Order not found`);
        }

        if (resultCode === '0') {
            const t = await db.sequelize.transaction();
            try {
                const orderForUpdate = await db.Order.findByPk(realOrderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t
                });

                if (orderForUpdate.reserveOnly) {
                    if (orderForUpdate.OrderDetails?.length > 0) {
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
                return res.redirect(`https://fe-qlda1.onrender.com/order-success?orderId=${realOrderId}`);
            } catch (err) {
                await t.rollback();
                return res.redirect(`https://fe-qlda1.onrender.com/order-failed?message=System error`);
            }
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.redirect(`https://fe-qlda1.onrender.com/order-failed?orderId=${realOrderId}&message=${message}`);
        }
    } catch (error) {
        return res.redirect(`https://fe-qlda1.onrender.com/order-failed?message=System error`);
    }
};

export const momoIPN = async (req, res) => {
    try {
        const { orderId, resultCode, transId, extraData } = req.body;
        
        // Parse originalOrderId from extraData
        // extraData format: "originalOrderId=123"
        let realOrderId = orderId;
        if(extraData && extraData.includes('originalOrderId=')) {
             const params = new URLSearchParams(extraData);
             realOrderId = params.get('originalOrderId');
        } else if (orderId && orderId.includes('_')) {
            realOrderId = orderId.split('_')[0];
        }

        const order = await db.Order.findByPk(realOrderId);
        if (!order) return res.status(200).json({ resultCode: 1, message: 'Order not found' });
        if (order.paymentStatus === 'paid') return res.status(200).json({ resultCode: 0, message: 'Already confirmed' });

        if (resultCode === 0) {
            const t = await db.sequelize.transaction();
            try {
                const orderForUpdate = await db.Order.findByPk(realOrderId, {
                    include: [{ model: db.OrderDetail, as: 'OrderDetails' }],
                    transaction: t
                });

                if (orderForUpdate.reserveOnly) {
                    if (orderForUpdate.OrderDetails?.length > 0) {
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
                return res.status(200).json({ resultCode: 99, message: 'Error' });
            }
        } else {
            order.paymentStatus = 'failed';
            await order.save();
            return res.status(200).json({ resultCode: 0, message: 'Success' });
        }
    } catch (error) {
        return res.status(200).json({ resultCode: 99, message: 'Error' });
    }
};

// ===== BANK TRANSFER CONTROLLERS =====

export const getBankInfo = async (req, res) => {
    try {
        const { orderId } = req.query;
        if (!orderId) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp orderId' });

        // Sử dụng raw: true cho query đọc dữ liệu
        const order = await db.Order.findByPk(orderId, { raw: true, nest: true });

        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

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
        return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin ngân hàng', error: error.message });
    }
};

export const confirmBankTransfer = async (req, res) => {
    try {
        const { orderId, transactionId } = req.body;
        if (!orderId) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp orderId' });

        const order = await db.Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        await db.Order.update(
            {
                paymentStatus: 'paid',
                transactionId: transactionId || `BANK_${Date.now()}`
            },
            { where: { id: orderId } }
        );

        const updatedOrder = await db.Order.findByPk(orderId, { raw: true, nest: true });
        return res.status(200).json({ success: true, message: 'Xác nhận thanh toán thành công', data: { order: updatedOrder } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi xác nhận thanh toán', error: error.message });
    }
};

// ===== PAYMENT HISTORY (User & Admin) =====

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
        const paymentStatus = req.query.paymentStatus;

        const whereClause = { userId: userId };
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset,
            raw: true, // Quan trọng: tránh lỗi result.get
            nest: true // Quan trọng
        });

        return res.status(200).json({
            success: true,
            message: 'Lịch sử thanh toán',
            data: { total: count, page: page, pageSize: limit, orders: orders }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử', error: error.message });
    }
};

/**
 * GET /api/payment/history/admin
 * Lấy toàn bộ lịch sử giao dịch (Dành cho Admin)
 * Hàm này bị thiếu trước đó gây crash server
 */
export const getAdminPaymentHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const paymentStatus = req.query.paymentStatus;

        const whereClause = {};
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        const { count, rows } = await db.Order.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'code', 'totalAmount', 'paymentStatus', 'typePayment', 'createdAt', 'customerName', 'phone', 'transactionId'],
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email'],
                    required: false
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']],
            raw: true, // Quan trọng: tránh lỗi result.get
            nest: true // Quan trọng
        });

        return res.status(200).json({
            success: true,
            message: 'Lịch sử giao dịch toàn hệ thống',
            data: {
                payments: rows,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalTransactions: count,
                    limit: limit
                }
            }
        });
    } catch (error) {
        console.error('Get admin payment history error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử giao dịch admin', error: error.message });
    }
};