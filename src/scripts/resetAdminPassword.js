import bcrypt from 'bcrypt';
import db from '../models/index.js';

/**
 * Script: Reset password cho admin
 * Chạy: node scripts/resetAdminPassword.js
 */

const resetAdminPassword = async () => {
    try {
        const newPassword = 'Admin@123';  // Password mới
        const adminEmail = 'admin@gmail.com';

        console.log('🔄 Đang reset password admin...');

        // Tìm admin
        const admin = await db.User.findOne({
            where: { email: adminEmail }
        });

        if (!admin) {
            console.log('❌ Không tìm thấy admin với email:', adminEmail);
            return;
        }

        // Hash password mới
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await admin.update({
            passwordHash: hashedPassword
        });

        console.log('✅ Reset password thành công!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password mới:', newPassword);
        console.log('🎭 Role:', admin.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 Bây giờ bạn có thể đăng nhập với:');
        console.log(`   POST https://be-qlda.onrender.com/api/auth/login`);
        console.log(`   Body: { "email": "${adminEmail}", "password": "${newPassword}" }`);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        process.exit();
    }
};

resetAdminPassword();
