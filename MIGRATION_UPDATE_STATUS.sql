-- ===================================================
-- MIGRATION: Update Orders.status từ INTEGER sang ENUM
-- Database: wedbanhangnew
-- Date: 2025-12-05
-- ===================================================

USE wedbanhangnew;

-- Bước 1: Tạo column mới với ENUM
ALTER TABLE Orders 
ADD COLUMN status_new ENUM('pending', 'processing', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled') 
DEFAULT 'pending' 
AFTER status;

-- Bước 2: Migrate data từ INTEGER sang ENUM
-- Mapping: 0->pending, 1->confirmed, 2->shipping, 3->delivered, 4->cancelled
UPDATE Orders 
SET status_new = CASE 
    WHEN status = 0 THEN 'pending'
    WHEN status = 1 THEN 'confirmed'
    WHEN status = 2 THEN 'shipping'
    WHEN status = 3 THEN 'delivered'
    WHEN status = 4 THEN 'cancelled'
    ELSE 'pending'
END;

-- Bước 3: Xóa column cũ
ALTER TABLE Orders DROP COLUMN status;

-- Bước 4: Đổi tên column mới thành 'status'
ALTER TABLE Orders CHANGE COLUMN status_new status 
ENUM('pending', 'processing', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled') 
DEFAULT 'pending';

-- Kiểm tra kết quả
SELECT id, code, customerName, status, paymentStatus, createdAt 
FROM Orders 
ORDER BY id DESC 
LIMIT 10;

-- ===================================================
-- HOÀN TẤT! Giờ status là ENUM thay vì INTEGER
-- ===================================================
