import fetch from 'node-fetch';

const testLogin = async () => {
    try {
        console.log('🔄 Testing Login API...\n');

        // Test với tài khoản admin
        const response = await fetch('https://be-qlda.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'Admin@123'  // Thử password này
            })
        });

        const result = await response.json();

        console.log('📊 Response Status:', response.status);
        console.log('📦 Response Body:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success && result.data) {
            console.log('\n✅ Login thành công!');
            console.log('👤 Username:', result.data.user?.username);
            console.log('📧 Email:', result.data.user?.email);
            console.log('🎭 Role:', result.data.user?.role);
            console.log('🔑 Token:', result.data.token?.substring(0, 50) + '...');
        } else {
            console.log('\n❌ Login thất bại:', result.message);
            console.log('\n💡 Hướng dẫn:');
            console.log('   1. Đảm bảo server đang chạy: http://localhost:3000');
            console.log('   2. Kiểm tra password của admin@gmail.com trong database');
            console.log('   3. Reset password admin nếu cần');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Lỗi kết nối - Hãy chắc chắn:');
        console.log('   - Server đang chạy: npm start');
        console.log('   - Port 3000 không bị chiếm');
    }
};

testLogin();
