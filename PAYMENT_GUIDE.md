# Hệ thống thanh toán đa kênh

## 📌 Tổng quan

Backend hỗ trợ **4 phương thức thanh toán**:
1. **COD** (Cash on Delivery) - Thanh toán khi nhận hàng
2. **VNPAY** - Cổng thanh toán trực tuyến
3. **MOMO** - Ví điện tử Momo
4. **Bank Transfer** - Chuyển khoản ngân hàng

---

## 🔧 Cấu hình

### 1. VNPAY Sandbox
- Website: https://sandbox.vnpayment.vn/
- Thay đổi trong `PaymentController.js`:
```javascript
const VNPAY_CONFIG = {
    vnp_TmnCode: 'YOUR_TMN_CODE',
    vnp_HashSecret: 'YOUR_HASH_SECRET'
};
```

### 2. MOMO Test
- Website: https://developers.momo.vn/
- Đăng ký để lấy:
```javascript
const MOMO_CONFIG = {
    partnerCode: 'MOMO_PARTNER_CODE',
    accessKey: 'MOMO_ACCESS_KEY',
    secretKey: 'MOMO_SECRET_KEY'
};
```

### 3. Bank Transfer (Chuyển khoản)
- Cập nhật thông tin tài khoản:
```javascript
const BANK_CONFIG = {
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'CONG TY TNHH ABC',
    branch: 'Chi nhanh Ha Noi'
};
```

---

## 📋 APIs

### **I. VNPAY Payment**

#### 1. Tạo URL thanh toán VNPAY
```http
POST /api/payment/vnpay/create-url
Authorization: Bearer <token>

Body:
{
  "orderId": 123,
  "amount": 500000,
  "orderInfo": "Thanh toan don hang #123",
  "bankCode": "NCB"  // Optional
}

Response:
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}
```

#### 2. Callback VNPAY
```http
GET /api/payment/vnpay-return?vnp_TxnRef=123&vnp_ResponseCode=00&...
```
→ Redirect user về: `http://localhost:3001/order-success?orderId=123`

---

### **II. MOMO Payment**

#### 1. Tạo URL thanh toán Momo
```http
POST /api/payment/momo/create-url
Authorization: Bearer <token>

Body:
{
  "orderId": 123,
  "amount": 500000,
  "orderInfo": "Thanh toan don hang #123"
}

Response:
{
  "success": true,
  "data": {
    "paymentUrl": "https://test-payment.momo.vn/...",
    "qrCodeUrl": "https://..."
  }
}
```

#### 2. Callback Momo
```http
GET /api/payment/momo-return?orderId=123&resultCode=0&transId=...
```
→ Redirect user về frontend

---

### **III. Bank Transfer (Chuyển khoản)**

#### 1. Lấy thông tin chuyển khoản
```http
GET /api/payment/bank-info?orderId=123
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "bankName": "Vietcombank",
    "accountNumber": "1234567890",
    "accountName": "CONG TY TNHH ABC",
    "branch": "Chi nhanh Ha Noi",
    "amount": 500000,
    "transferContent": "DH123 Nguyen Van A",
    "qrCode": "https://img.vietqr.io/image/...",
    "note": "Vui lòng chuyển khoản đúng nội dung"
  }
}
```

#### 2. Admin xác nhận đã nhận tiền
```http
POST /api/payment/bank-confirm
Authorization: Bearer <admin-token>

Body:
{
  "orderId": 123,
  "transactionId": "FT12345678"  // Optional
}

Response:
{
  "success": true,
  "message": "Xác nhận thanh toán thành công"
}
```

---

### **IV. Lịch sử thanh toán**

#### 1. User xem lịch sử của mình
```http
GET /api/payment/history?page=1&limit=10&paymentStatus=paid
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "orders": [...],
    "stats": {
      "totalOrders": 10,
      "totalPaid": 8,
      "totalPending": 1,
      "totalFailed": 1,
      "totalAmount": 5000000
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalOrders": 10,
      "limit": 10
    }
  }
}
```

#### 2. Admin xem toàn bộ lịch sử
```http
GET /api/payment/history/admin?page=1&limit=20&paymentStatus=paid&typePayment=2
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "orders": [...],
    "stats": {
      "totalOrders": 100,
      "totalPaidOrders": 85,
      "totalRevenue": 50000000,
      "pendingOrders": 10,
      "failedOrders": 5
    },
    "pagination": {...}
  }
}
```

**Query Parameters:**
- `page`: Trang hiện tại (default: 1)
- `limit`: Số records/trang (default: 10 cho user, 20 cho admin)
- `paymentStatus`: Filter theo trạng thái (`pending`, `paid`, `failed`, `refunded`)
- `typePayment`: Filter theo phương thức (1: COD, 2: VNPAY, 3: Momo, 4: Bank)

---

## 🔄 Luồng thanh toán

### **Luồng 1: COD (typePayment = 1)**
1. User checkout → `paymentStatus = 'paid'` ngay lập tức
2. Admin xác nhận đơn và giao hàng

### **Luồng 2: VNPAY/Momo (typePayment = 2/3)**
1. User checkout → `paymentStatus = 'pending'`
2. User gọi API `/vnpay/create-url` hoặc `/momo/create-url`
3. Frontend redirect user đến `paymentUrl`
4. User thanh toán trên trang VNPAY/Momo
5. Cổng thanh toán callback về backend
6. Backend cập nhật `paymentStatus = 'paid'` và redirect về frontend
7. Frontend hiển thị thành công/thất bại

### **Luồng 3: Bank Transfer (typePayment = 4)**
1. User checkout → `paymentStatus = 'pending'`
2. User gọi API `/bank-info` để lấy thông tin TK
3. User chuyển khoản theo thông tin (có QR code)
4. Admin check banking và gọi API `/bank-confirm`
5. `paymentStatus = 'paid'`

---

## 📊 Payment Status

- `pending`: Chờ thanh toán
- `paid`: Đã thanh toán
- `failed`: Thanh toán thất bại
- `refunded`: Đã hoàn tiền

---

## 🧪 Test

### Test VNPAY Sandbox
- Thẻ ATM: `9704198526191432198` / OTP: `123456`
- Thẻ Visa: `4111111111111111` / CVV: `123`

### Test Momo
- Sử dụng app Momo test với tài khoản test từ developers.momo.vn

### Test Bank Transfer
- Dùng VietQR để tạo mã QR tự động
- Admin xác nhận thủ công qua API `/bank-confirm`

---

## 🔐 Bảo mật

- Tất cả requests có chữ ký HMAC (SHA512 cho VNPAY, SHA256 cho Momo)
- Verify signature từ cổng thanh toán trước khi cập nhật order
- IPN (Instant Payment Notification) để đảm bảo backend nhận được kết quả
- Admin authentication cho `/bank-confirm` và `/history/admin`

---

## 📈 Thống kê trong lịch sử thanh toán

### User stats:
- Tổng số đơn hàng
- Số đơn đã thanh toán/chờ/thất bại
- Tổng số tiền đã chi

### Admin stats:
- Tổng doanh thu (chỉ đơn đã thanh toán)
- Số đơn theo từng trạng thái
- Filter theo phương thức thanh toán
