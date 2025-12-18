import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục uploads cho products
const uploadDir = path.join(__dirname, '../../public/Uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Tạo thư mục uploads cho avatars
const avatarUploadDir = path.join(__dirname, '../../public/Uploads');
if (!fs.existsSync(avatarUploadDir)) {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
}

// Helper function để sanitize tên file (xóa dấu tiếng Việt và ký tự đặc biệt)
const sanitizeFilename = (filename) => {
    // Xóa dấu tiếng Việt
    let sanitized = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Thay thế khoảng trắng và ký tự đặc biệt bằng dấu gạch ngang
    sanitized = sanitized.replace(/[^a-zA-Z0-9.-]/g, '-');

    // Xóa nhiều dấu gạch ngang liên tiếp
    sanitized = sanitized.replace(/-+/g, '-');

    // Xóa dấu gạch ngang ở đầu và cuối
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    // Chuyển thành chữ thường
    return sanitized.toLowerCase();
};

// Cấu hình storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Lấy extension
        const ext = path.extname(file.originalname);

        // Sanitize tên file gốc (xóa dấu và ký tự đặc biệt)
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = sanitizeFilename(nameWithoutExt);

        // Tạo tên file unique: sanitized-name-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const finalFilename = `${sanitizedName}-${uniqueSuffix}${ext}`;

        cb(null, finalFilename);
    }
});

// File filter - chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'), false);
    }
};

// Cấu hình multer cho products
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
});

// Cấu hình storage cho avatar (lưu trực tiếp vào /Uploads)
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarUploadDir); // Lưu vào public/Uploads/
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = sanitizeFilename(nameWithoutExt);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const finalFilename = `${sanitizedName}-${uniqueSuffix}${ext}`;
        cb(null, finalFilename);
    }
});

// Cấu hình multer cho avatar
export const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
});

export default upload;
