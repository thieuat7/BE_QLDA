-- Fix image paths from /Uploads/images/sanpham/ to /Uploads/products/
-- Run this in MySQL Workbench or phpMyAdmin

USE bookingcare;

-- Update Products table (main image)
UPDATE Products
SET image = REPLACE(image, '/Uploads/images/sanpham/', '/Uploads/products/')
WHERE image LIKE '/Uploads/images/sanpham/%';

-- Update ProductImages table (gallery images)
UPDATE ProductImages
SET image = REPLACE(image, '/Uploads/images/sanpham/', '/Uploads/products/')
WHERE image LIKE '/Uploads/images/sanpham/%';

-- Verify results
SELECT id, title, image FROM Products WHERE image LIKE '/Uploads/products/%' LIMIT 5;
SELECT id, productId, image FROM ProductImages WHERE image LIKE '/Uploads/products/%' LIMIT 5;
