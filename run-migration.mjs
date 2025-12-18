import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const runMigration = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        port: 3309,
        database: 'bookingcare',
        multipleStatements: true
    });

    try {
        console.log('✓ Connected to database');

        // Đọc file SQL
        const sql = readFileSync('./add_order_payment_fields.sql', 'utf8');

        // Chạy SQL
        await connection.query(sql);

        console.log('✓ Migration completed successfully!');

        // Kiểm tra kết quả
        const [orders] = await connection.query('DESCRIBE Orders');
        console.log('\n📋 Orders table structure:');
        console.table(orders.filter(col => ['note', 'paymentStatus', 'transactionId'].includes(col.Field)));

        const [orderDetails] = await connection.query('DESCRIBE OrderDetails');
        console.log('\n📋 OrderDetails table structure:');
        console.table(orderDetails.filter(col => ['size', 'color'].includes(col.Field)));

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
};

runMigration();
