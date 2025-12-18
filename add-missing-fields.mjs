import mysql from 'mysql2/promise';

const addMissingFields = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        port: 3309,
        database: 'bookingcare'
    });

    try {
        console.log('✓ Connected to database\n');

        // Thêm note vào Orders (nếu chưa có)
        try {
            await connection.query('ALTER TABLE Orders ADD COLUMN note TEXT NULL');
            console.log('✓ Added note to Orders');
        } catch (e) {
            if (e.message.includes('Duplicate column name')) {
                console.log('⚠ Orders.note already exists');
            } else {
                throw e;
            }
        }

        // Thêm size vào OrderDetails (nếu chưa có)
        try {
            await connection.query('ALTER TABLE OrderDetails ADD COLUMN size VARCHAR(20) NULL');
            console.log('✓ Added size to OrderDetails');
        } catch (e) {
            if (e.message.includes('Duplicate column name')) {
                console.log('⚠ OrderDetails.size already exists');
            } else {
                throw e;
            }
        }

        // Thêm color vào OrderDetails (nếu chưa có)
        try {
            await connection.query('ALTER TABLE OrderDetails ADD COLUMN color VARCHAR(50) NULL');
            console.log('✓ Added color to OrderDetails');
        } catch (e) {
            if (e.message.includes('Duplicate column name')) {
                console.log('⚠ OrderDetails.color already exists');
            } else {
                throw e;
            }
        }

        console.log('\n✅ All fields added successfully!');

        // Kiểm tra kết quả
        const [orders] = await connection.query("DESCRIBE Orders");
        const hasNote = orders.some(col => col.Field === 'note');

        const [orderDetails] = await connection.query("DESCRIBE OrderDetails");
        const hasSize = orderDetails.some(col => col.Field === 'size');
        const hasColor = orderDetails.some(col => col.Field === 'color');

        console.log('\n📋 Verification:');
        console.log(`  Orders.note: ${hasNote ? '✓' : '✗'}`);
        console.log(`  OrderDetails.size: ${hasSize ? '✓' : '✗'}`);
        console.log(`  OrderDetails.color: ${hasColor ? '✓' : '✗'}`);

    } catch (error) {
        console.error('✗ Error:', error.message);
    } finally {
        await connection.end();
    }
};

addMissingFields();
