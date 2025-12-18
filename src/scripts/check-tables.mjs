import mysql from 'mysql2/promise';

const checkTables = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        port: 3309,
        database: 'bookingcare'
    });

    try {
        console.log('✓ Connected to database\n');

        // Kiểm tra Orders
        const [orders] = await connection.query('DESCRIBE Orders');
        console.log('📋 Orders table:');
        console.table(orders.map(col => ({ Field: col.Field, Type: col.Type, Null: col.Null, Default: col.Default })));

        // Kiểm tra OrderDetails  
        const [orderDetails] = await connection.query('DESCRIBE OrderDetails');
        console.log('\n📋 OrderDetails table:');
        console.table(orderDetails.map(col => ({ Field: col.Field, Type: col.Type, Null: col.Null, Default: col.Default })));

    } catch (error) {
        console.error('✗ Error:', error.message);
    } finally {
        await connection.end();
    }
};

checkTables();
