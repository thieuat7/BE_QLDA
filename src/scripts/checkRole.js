import mysql from 'mysql2/promise';

const checkUserRole = async () => {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3309,
            user: 'root',
            password: '123456',
            database: 'bookingcare'
        });

        console.log('=== Cấu trúc bảng Users ===');
        const [columns] = await connection.query('DESCRIBE Users');
        console.table(columns.map(col => ({
            Field: col.Field,
            Type: col.Type,
            Default: col.Default || 'NULL'
        })));

        console.log('\n=== Dữ liệu Users (role column) ===');
        const [users] = await connection.query('SELECT id, userName, email, role FROM Users LIMIT 10');
        console.table(users);

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkUserRole();
