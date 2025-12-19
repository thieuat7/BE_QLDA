import db from '../models/index.js';

/**
 * Script migrate Orders.status từ INTEGER sang ENUM
 * Chạy: node migrate-status.mjs
 */

async function migrateStatus() {
    try {
        console.log('🔄 Bắt đầu migration Orders.status...\n');

        // Bước 1: Thêm column mới
        console.log('📝 Bước 1: Thêm column status_new...');
        await db.sequelize.query(`
            ALTER TABLE Orders 
            ADD COLUMN status_new ENUM('pending', 'processing', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled') 
            DEFAULT 'pending' 
            AFTER status
        `);
        console.log('✅ Đã thêm column status_new\n');

        // Bước 2: Migrate data
        console.log('📝 Bước 2: Migrate data từ INTEGER sang ENUM...');
        const [results] = await db.sequelize.query(`
            UPDATE Orders 
            SET status_new = CASE 
                WHEN status = 0 THEN 'pending'
                WHEN status = 1 THEN 'confirmed'
                WHEN status = 2 THEN 'shipping'
                WHEN status = 3 THEN 'delivered'
                WHEN status = 4 THEN 'cancelled'
                ELSE 'pending'
            END
        `);
        console.log(`✅ Đã migrate ${results.affectedRows} rows\n`);

        // Bước 3: Xóa column cũ
        console.log('📝 Bước 3: Xóa column status cũ...');
        await db.sequelize.query('ALTER TABLE Orders DROP COLUMN status');
        console.log('✅ Đã xóa column status cũ\n');

        // Bước 4: Đổi tên column mới
        console.log('📝 Bước 4: Đổi tên status_new -> status...');
        await db.sequelize.query(`
            ALTER TABLE Orders 
            CHANGE COLUMN status_new status 
            ENUM('pending', 'processing', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled') 
            DEFAULT 'pending'
        `);
        console.log('✅ Đã đổi tên column\n');

        // Kiểm tra kết quả
        console.log('📊 Kiểm tra kết quả:');
        const [orders] = await db.sequelize.query(`
            SELECT id, code, customerName, status, paymentStatus, createdAt 
            FROM Orders 
            ORDER BY id DESC 
            LIMIT 5
        `);
        console.table(orders);

        console.log('\n🎉 MIGRATION HOÀN TẤT!');
        console.log('✅ Orders.status đã được chuyển từ INTEGER sang ENUM');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration thất bại:', error);
        process.exit(1);
    }
}

migrateStatus();
