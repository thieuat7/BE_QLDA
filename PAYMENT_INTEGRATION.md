# Tích hợp cổng thanh toán VNPAY

## 📌 Cách hoạt động:

### 1. **POST /api/payment/create-url** - Tạo URL thanh toán
- User chọn thanh toán online (typePayment = 2) khi checkout
- Frontend gọi API này với `orderId`, `amount`, `orderInfo`
- Backend tạo URL thanh toán VNPAY và trả về
- Frontend redirect user đến URL đó
- User nhập thông tin thẻ/QR code trên trang VNPAY

### 2. **GET /api/payment/vnpay-return** - Callback sau thanh toán
- VNPAY redirect user về backend sau khi thanh toán xong
- Backend verify chữ ký, cập nhật `paymentStatus` cho Order
- Redirect user về frontend với trạng thái thành công/thất bại

### 3. **GET /api/payment/vnpay-ipn** - Webhook (server-to-server)
- VNPAY gọi trực tiếp đến backend để confirm thanh toán
- Đảm bảo backend nhận được kết quả ngay cả khi user đóng trình duyệt

---

## 🔧 Cấu hình VNPAY Sandbox (Test):

1. **Đăng ký tài khoản test**: https://sandbox.vnpayment.vn/
2. **Lấy thông tin**:
   - `vnp_TmnCode`: Mã website (Terminal ID)
   - `vnp_HashSecret`: Chuỗi bí mật
3. **Cập nhật trong `PaymentController.js`**:
```javascript
const VNPAY_CONFIG = {
    vnp_TmnCode: 'YOUR_TMN_CODE',
    vnp_HashSecret: 'YOUR_HASH_SECRET',
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnp_ReturnUrl: 'http://localhost:3000/api/payment/vnpay-return'
};
```

---

## 🧪 Test với thẻ test VNPAY:

**Thẻ nội địa (ATM)**:
- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- Mật khẩu OTP: `123456`

**Thẻ quốc tế (Visa/Master)**:
- Số thẻ: `4111111111111111`
- CVV: `123`
- Expiry: `12/25`

---

## 📝 Luồng sử dụng:

### **Bước 1: User đặt hàng với thanh toán online**
```bash
POST http://localhost:3000/api/orders/checkout
{
  "customerName": "Nguyen Van A",
  "phone": "0912345678",
  "address": "Ha Noi",
  "email": "test@example.com",
  "paymentMethod": 2,  # 2 = Online, 1 = COD
  "discountCode": "SUMMER2024"  # optional
}

Response: Order created với paymentStatus = "pending"
```

### **Bước 2: Tạo URL thanh toán**
```bash
POST http://localhost:3000/api/payment/create-url
Authorization: Bearer <token>
{
  "orderId": 123,
  "amount": 500000,
  "orderInfo": "Thanh toan don hang #123",
  "bankCode": "NCB"  # optional, chọn ngân hàng cụ thể
}

Response:
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..."
  }
}
```

### **Bước 3: Frontend redirect user đến paymentUrl**
```javascript
window.location.href = response.data.paymentUrl;
```

### **Bước 4: User thanh toán trên VNPAY**
- Nhập thông tin thẻ test
- VNPAY xử lý thanh toán

### **Bước 5: VNPAY redirect về backend**
```
GET http://localhost:3000/api/payment/vnpay-return?vnp_TxnRef=123&vnp_ResponseCode=00&...
```
- Backend cập nhật `paymentStatus = 'paid'` nếu thành công
- Backend redirect user về frontend: `http://localhost:3001/order-success?orderId=123`

---

## 🔐 Bảo mật:

- **HMAC SHA512**: Mọi request đều có chữ ký để verify
- **Expire time**: URL thanh toán hết hạn sau 15 phút
- **IPN**: Đảm bảo backend nhận kết quả từ VNPAY server (không phụ thuộc user)

---

## 🌐 Tích hợp Momo/ZaloPay:

Tương tự VNPAY, chỉ khác:
- API endpoint khác
- Thuật toán mã hóa khác (Momo dùng HMAC SHA256)
- Tham số request/response khác

---

## 📊 Database:

**Bảng Orders đã thêm:**
- `paymentStatus`: `pending` | `paid` | `failed` | `refunded`
- `transactionId`: Mã giao dịch từ VNPAY

**Logic:**
- COD: `paymentStatus = 'paid'` ngay khi tạo order
- Online: `paymentStatus = 'pending'` → VNPAY callback → cập nhật `'paid'` hoặc `'failed'`
