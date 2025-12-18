-- Thêm các fields thiếu vào bảng Orders và OrderDetails
-- Chạy script này trong MySQL Workbench hoặc phpMyAdmin

USE bookingcare;

-- Thêm vào bảng Orders
ALTER TABLE Orders 
ADD COLUMN note TEXT NULL COMMENT 'Ghi chú đơn hàng',
ADD COLUMN paymentStatus VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, paid, failed',
ADD COLUMN transactionId VARCHAR(100) NULL COMMENT 'Mã giao dịch từ cổng thanh toán';

-- Thêm vào bảng OrderDetails
ALTER TABLE OrderDetails 
ADD COLUMN size VARCHAR(20) NULL COMMENT 'Size sản phẩm',
ADD COLUMN color VARCHAR(50) NULL COMMENT 'Màu sản phẩm';

-- Kiểm tra kết quả
DESCRIBE Orders;
DESCRIBE OrderDetails;

SELECT 'Migration completed successfully!' AS status;
