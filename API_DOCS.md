# API Documentation - Hệ thống quản lý bán hàng

## Base URL
```
http://localhost:3000/api
```

---

## 1. Register API (Đăng ký tài khoản)

### Endpoint
```
POST /api/auth/register
```

### Request Body (JSON)
```json
{
  "email": "testuser@gmail.com",
  "username": "testuser",
  "password": "123456",
  "confirmPassword": "123456",
  "fullName": "Nguyen Van Test",
  "phone": "0123456789",
  "address": "123 Nguyen Trai, Q1, TPHCM"
}
```

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "testuser",
      "email": "testuser@gmail.com",
      "fullName": "Nguyen Van Test",
      "phone": "0123456789",
      "address": "123 Nguyen Trai, Q1, TPHCM",
      "createdAt": "2025-11-25T..."
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Missing fields
```json
{
  "success": false,
  "message": "Vui lòng điền đầy đủ thông tin (email, username, password, confirmPassword, fullName)"
}
```

#### 400 Bad Request - Invalid email
```json
{
  "success": false,
  "message": "Email không đúng định dạng"
}
```

#### 400 Bad Request - Short password
```json
{
  "success": false,
  "message": "Mật khẩu phải có ít nhất 6 ký tự"
}
```

#### 400 Bad Request - Password mismatch
```json
{
  "success": false,
  "message": "Mật khẩu và xác nhận mật khẩu không khớp"
}
```

#### 409 Conflict - Duplicate email/username
```json
{
  "success": false,
  "message": "Email hoặc username đã tồn tại"
}
```

### Test với PowerShell
```powershell
$body = @{
    email = "testuser@gmail.com"
    username = "testuser"
    password = "123456"
    confirmPassword = "123456"
    fullName = "Nguyen Van Test"
    phone = "0123456789"
    address = "123 Nguyen Trai, Q1, TPHCM"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

---

## 2. Login API (Đăng nhập)

### Endpoint
```
POST /api/auth/login
```

### Request Body (JSON)
```json
{
  "email": "testuser@gmail.com",
  "password": "123456"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "testuser",
      "email": "testuser@gmail.com",
      "fullName": "Nguyen Van Test",
      "phone": "0123456789",
      "createdAt": "2025-11-25T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing fields
```json
{
  "success": false,
  "message": "Vui lòng nhập email và password"
}
```

#### 400 Bad Request - Invalid email format
```json
{
  "success": false,
  "message": "Email không đúng định dạng"
}
```

#### 401 Unauthorized - Wrong credentials
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không chính xác"
}
```

### Test với PowerShell
```powershell
$body = @{
    email = "testuser@gmail.com"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### Sử dụng JWT Token

Sau khi đăng nhập thành công, sử dụng token trong header cho các API yêu cầu xác thực:

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/protected-endpoint" -Headers $headers
```

---

## Security Features
✅ Password hashing với bcrypt (salt rounds: 10)
✅ Email validation
✅ Password strength validation (min 6 chars)
✅ Password confirmation check
✅ Duplicate email/username prevention
✅ JWT token authentication
✅ Token expiration (default: 24h)
✅ Không trả về password trong response

---

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `username` (VARCHAR, UNIQUE)
- `email` (VARCHAR, UNIQUE)
- `passwordHash` (VARCHAR) - Hashed bằng bcrypt
- `fullName` (VARCHAR)
- `phone` (VARCHAR)
- `address` (TEXT)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

---

## Notes
- Tất cả endpoint trả về JSON
- Server chạy trên port 3000
- Database: MySQL port 3309
- Character set: utf8mb4_unicode_ci (hỗ trợ tiếng Việt)
