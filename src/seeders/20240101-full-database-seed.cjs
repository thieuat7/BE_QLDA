'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // 1. USERS (5 Users)
        await queryInterface.bulkInsert('Users', [
            { id: '12549010-8040-4761-a63c-daf9de55e889', fullName: 'Võ Thị Trúc Linh', phone: '0963207521', email: 'vttl7521@gmail.com', userName: 'LINH', passwordHash: 'AG+x5ohliaj1ASU4R1iADb+eLMv6RE9geYBvxIr3k0I7o6UOF1LeNI0/IUUd+fIFGw==', createdAt: now, updatedAt: now },
            { id: '5dd36792-be3c-41b4-8f1e-7566c85abecb', fullName: null, phone: null, email: 'nguyenduchai9e@gmail.com', userName: 'nguyenduchai9e@gmail.com', passwordHash: 'AL3rTnt6fx0WLzGQlPSGV8Z4GPOP6RIP/XnyBrXEb6RpNTKQXOCw53zZBP256MVWOg==', createdAt: now, updatedAt: now },
            { id: '64c1ba3a-f19a-43a2-8467-6d20abb136b2', fullName: null, phone: null, email: 'vttt@gmail.com', userName: 'vttt@gmail.com', passwordHash: 'AMsMNZn4SC49f6ptH6Q44+P8VxjE90QnC5y6bWw0ymH1NSl8Q0c0N8hrYov3F1mLtQ==', createdAt: now, updatedAt: now },
            { id: '9d2e743e-5f05-4f85-98de-11cdebc509ff', fullName: null, phone: null, email: 'lamthanhngan@gmail.com', userName: 'lamthanhngan@gmail.com', passwordHash: 'AFu6KcyL753aXKgc8gbcm5i/uT2Iwn3XQ1NKC+sq/bK1WYiEc6nd5Z8nUe9V2pM++Q==', createdAt: now, updatedAt: now },
            { id: 'b69b7a28-0d9f-4f50-8a7e-148d962c51d6', fullName: null, phone: null, email: 'nttt@gmail.com', userName: 'nttt@gmail.com', passwordHash: 'AEP9uVOoat4gJJCbd/XlfNbBZbF8qgQ8YjaOBKeBLdP+oK8BaYjeqfySXXYXNRHR6Q==', createdAt: now, updatedAt: now }
        ], {});

        // 2. CATEGORIES (4 Categories)
        await queryInterface.bulkInsert('Categories', [
            { id: 1, title: 'Trang chủ', alias: 'trang-chu', position: 1, isActive: false, createdAt: now, updatedAt: now },
            { id: 2, title: 'Tin tức ', alias: 'tin-tuc', position: 2, isActive: false, createdAt: now, updatedAt: now },
            { id: 3, title: 'Sản phẩm ', alias: 'san-pham', position: 3, isActive: false, createdAt: now, updatedAt: now },
            { id: 4, title: 'Liên hệ ', alias: 'lien-he', position: 4, isActive: false, createdAt: now, updatedAt: now }
        ], {});

        // 3. NEWS (6 News items)
        await queryInterface.bulkInsert('News', [
            { id: 11, title: "Thứ trưởng Bộ Y tế: 'Chưa có đủ cơ sở để bắt buộc tiêm vắc xin...'", alias: 'thu-truong-bo-y-te', categoryId: 3, isActive: true, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo khoác xanh dương.jpg', description: 'Bộ Y tế đang làm việc...', detail: '<p>Nội dung chi tiết...</p>' },
            { id: 21, title: 'Here are the trends I see coming this fall', alias: 'here-are-the-trends', categoryId: 3, isActive: true, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/cardigan xanh dương.jpg', description: 'Here are the trends...', detail: 'Here are the trends...' },
            { id: 22, title: 'Here are the trends I see coming this fall', alias: 'here-are-the-trends-2', categoryId: 3, isActive: true, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/sơ mi xanh dương.jpg', description: 'Here are the trends...', detail: null },
            { id: 23, title: 'Sale đầu hè', alias: 'sale-dau-he', categoryId: 2, isActive: true, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/sơ mi xanh dương.jpg', description: null, detail: 'QUẦN ÁO MÙA HÈ GIẢM GIÁ ĐẾN 40%...' },
            { id: 24, title: 'Giảm giá giữa năm ', alias: 'giam-gia-giua-nam', categoryId: 2, isActive: true, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/cardigan xanh dương.jpg', description: null, detail: 'GIẢM GIÁ GIỮA NĂM SIÊU SỐC...' },
            { id: 25, title: 'Xả hàng cuối năm ', alias: 'xa-hang-cuoi-nam', categoryId: 2, isActive: true, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo khoác xanh dương.jpg', description: null, detail: 'MUA SẮM CUỐI NĂM - NHẬN NGAY QUÀ...' }
        ], {});

        // 4. POSTS (2 Posts)
        await queryInterface.bulkInsert('Posts', [
            { id: 1, title: 'Giới thiệu', alias: 'gioi-thieu', categoryId: 3, isActive: true, createdAt: now, updatedAt: now, detail: '<p>Giới thiệu...</p>' },
            { id: 3, title: 'Khuyến mãi', alias: 'khuyen-mai', categoryId: 3, isActive: true, createdAt: now, updatedAt: now, detail: '<p>BABYSHARK - Bùng nổ mùa hè...</p>', image: '/Uploads/images/sanpham/khuyenmai.jpg' }
        ], {});

        // 5. PRODUCT CATEGORIES (3 Categories)
        await queryInterface.bulkInsert('ProductCategories', [
            { id: 1, title: 'Áo', alias: 'ao', icon: '/Uploads/images/sanpham/áo thun trắng.jpg', createdAt: now, updatedAt: now },
            { id: 2, title: 'Quần', alias: 'quan', icon: '/Uploads/images/sanpham/quần kaki trắng.jpg', createdAt: now, updatedAt: now },
            { id: 3, title: 'Áo khoác', alias: 'ao-khoac', icon: '/Uploads/images/sanpham/áo khoác trắng viền.jpg', createdAt: now, updatedAt: now }
        ], {});

        // 6. PRODUCTS (Toàn bộ sản phẩm từ file SQL)
        await queryInterface.bulkInsert('Products', [
            { id: 3, title: 'Áo khoác jean_Màu xanh ', alias: 'ao-khoac-jean_mau-xanh', productCode: 'SP01', price: 350000, priceSale: 300000, originalPrice: 300000, quantity: 10, productCategoryId: 3, isActive: true, isHome: true, isHot: true, createdAt: now, updatedAt: now },
            { id: 5, title: 'Cardigan_Màu be', alias: 'cardigan_mau-be', productCode: 'SP02', price: 350000, priceSale: 300000, originalPrice: 300000, quantity: 14, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 6, title: 'Cardigan_Xanh dương ', alias: 'cardigan_xanh-duong', productCode: 'SP03', price: 350000, priceSale: 300000, originalPrice: 300000, quantity: 2, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 7, title: 'Cardigan_Màu xám ', alias: 'cardigan_mau-xam', productCode: 'SP04', price: 350000, priceSale: 300000, originalPrice: 3, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 8, title: 'Quần kaki_Màu be ', alias: 'quan-kaki_mau-be', productCode: 'SP05', price: 250000, priceSale: 200000, originalPrice: 2, quantity: 1, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 9, title: 'Quần kaki_Màu trắng', alias: 'quan-kaki_mau-trang', productCode: 'SP06', price: 250000, priceSale: 200000, originalPrice: 20, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 10, title: 'Quần kaki_Xám đậm', alias: 'quan-kaki_xam-dam', productCode: 'SP07', price: 250000, priceSale: 200000, originalPrice: 200000, quantity: 1, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 11, title: 'Quần kaki_Màu xám', alias: 'quan-kaki_mau-xam', productCode: 'SP08', price: 250000, priceSale: 200000, originalPrice: 2, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 12, title: 'Quần short jean_Màu xanh', alias: 'quan-short-jean_mau-xanh', productCode: 'SP09', price: 150000, priceSale: 100000, originalPrice: 100000, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 13, title: 'Quần kaki_Màu be', alias: 'quan-kaki_mau-be', productCode: 'SP10', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 14, title: 'Quần short thun_Xanh lá ', alias: 'quan-short-thun_xanh-la', productCode: 'SP11', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 1, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 15, title: 'Quần short thun_Xanh đen', alias: 'quan-short-thun_xanh-den', productCode: 'SP12', price: 150000, priceSale: 100000, originalPrice: 100000, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 16, title: 'Quần short thun_Màu xám ', alias: 'quan-short-thun_mau-xam', productCode: 'SP13', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 17, title: 'Quần short thun_Màu đen', alias: 'quan-short-thun_mau-den', productCode: 'SP14', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 18, title: 'Quần short kaki_Màu trắng ', alias: 'quan-short-kaki_mau-trang', productCode: 'SP15', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 19, title: 'Quần short kaki_Xanh đen ', alias: 'quan-short-kaki_xanh-den', productCode: 'SP16', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 20, title: 'Quần short kaki_Màu xám ', alias: 'quan-short-kaki_mau-xam', productCode: 'SP17', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 21, title: 'Quần short kaki_Màu đen ', alias: 'quan-short-kaki_mau-den', productCode: 'SP18', price: 150000, priceSale: 100000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 22, title: 'Quần thun_Màu nâu', alias: 'quan-thun_mau-nau', productCode: 'SP19', price: 200000, priceSale: 150000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 23, title: 'Quần thun_Xanh rêu', alias: 'quan-thun_xanh-reu', productCode: 'SP20', price: 200000, priceSale: 150000, originalPrice: 1, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 24, title: 'Quần thun_Màu đen ', alias: 'quan-thun_mau-den', productCode: 'SP21', price: 200000, priceSale: 150000, originalPrice: 150000, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 25, title: 'Quần tây_Màu be', alias: 'quan-tay_mau-be', productCode: 'SP22', price: 250000, priceSale: 200000, originalPrice: 200000, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 27, title: 'Quần tây_Màu nâu', alias: 'quan-tay_mau-nau', productCode: 'SP23', price: 250000, priceSale: 200000, originalPrice: 200000, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 28, title: 'Quần tây_Màu xám ', alias: 'quan-tay_mau-xam', productCode: 'SP24', price: 250000, priceSale: 200000, originalPrice: 200000, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 29, title: 'Quần tây_Màu đen', alias: 'quan-tay_mau-den', productCode: 'SP25', price: 250000, priceSale: 200000, originalPrice: 200000, quantity: 0, productCategoryId: 2, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 30, title: 'Áo sơ mi_Màu be', alias: 'ao-so-mi_mau-be', productCode: 'SP26', price: 200000, priceSale: 180000, originalPrice: 150000, quantity: 1, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 31, title: 'Áo sơ mi_Màu hồng', alias: 'ao-so-mi_mau-hong', productCode: 'SP27', price: 200000, priceSale: 180000, originalPrice: 150000, quantity: 9, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 32, title: 'Áo sơ mi_Màu trắng ', alias: 'ao-so-mi_mau-trang', productCode: 'SP28', price: 200000, priceSale: 180000, originalPrice: 150000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 33, title: 'Áo sơ mi_Xanh dương', alias: 'ao-so-mi_xanh-duong', productCode: 'SP29', price: 200000, priceSale: 180000, originalPrice: 150000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 34, title: 'Áo sơ mi_Màu đen ', alias: 'ao-so-mi_mau-den', productCode: 'SP30', price: 200000, priceSale: 180000, originalPrice: 150000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 35, title: 'Áo sơ mi_Màu đỏ', alias: 'ao so mi_mau do', productCode: 'SP31', price: 200000, priceSale: 180000, originalPrice: 150000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/sơ mi đỏ.jpg' },
            { id: 36, title: 'Áo thun_Màu be', alias: 'ao thun_mau be', productCode: 'SP32', price: 150000, priceSale: 120000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/thun be.jpg' },
            { id: 37, title: 'Áo thun_Xanh rêu', alias: 'ao-thun_xanh-reu', productCode: 'SP33', price: 150000, priceSale: 120000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 38, title: 'Áo thun_Trắng - xám', alias: 'ao-thun_trang--xam', productCode: 'SP34', price: 180000, priceSale: 150000, originalPrice: 150000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 39, title: 'Áo thun_Màu xám ', alias: 'ao-thun_mau-xam', productCode: 'SP35', price: 200000, priceSale: 180000, originalPrice: 150000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 40, title: 'Áo thun_Màu xám ', alias: 'ao thun_mau xam', productCode: 'SP36', price: 150000, priceSale: 120000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/thun xám.jpg' },
            { id: 41, title: 'Áo thun_Màu đen ', alias: 'ao-thun_mau-den', productCode: 'SP37', price: 150000, priceSale: 120000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 42, title: 'Áo thun_Màu đen ', alias: 'ao thun_mau den', productCode: 'SP38', price: 150000, priceSale: 120000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/thun đen.jpg' },
            { id: 43, title: 'Áo thun_Xanh dương', alias: 'ao-thun_xanh-duong', productCode: 'sP39', price: 150000, priceSale: 120000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 44, title: 'Áo thun_Xanh lá', alias: 'ao-thun_xanh-la', productCode: 'SP40', price: 150000, priceSale: 120000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 45, title: 'Áo thun_Màu đen ', alias: 'ao-thun_mau-den', productCode: 'SP41', price: 180000, priceSale: 150000, originalPrice: 120000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 46, title: 'Áo thun_Màu trắng ', alias: 'ao thun_mau trang', productCode: 'SP42', price: 180000, priceSale: 150000, originalPrice: 100000, quantity: 0, productCategoryId: 1, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo thun trắng.jpg' },
            { id: 47, title: 'Áo khoác_Màu đen', alias: 'ao khoac_mau den', productCode: 'SP43', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo khoác đen.jpg' },
            { id: 49, title: 'Áo khoác_Màu xám ', alias: 'ao khoac_mau xam', productCode: 'SP44', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo khoác xám.jpg' },
            { id: 50, title: 'Áo khoác_Xanh trắng ', alias: 'ao-khoac_xanh-trang', productCode: 'SP45', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 1, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 51, title: 'Áo khoác_Xanh rêu', alias: 'ao-khoac_xanh-reu', productCode: 'SP46', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 52, title: 'Áo khoác_Xanh dương ', alias: 'ao-khoac_xanh-duong', productCode: 'SP47', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now },
            { id: 53, title: 'Áo khoác_Màu trắng', alias: 'ao khoac_mau trang', productCode: 'SP48', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo khoác trắng viền.jpg' },
            { id: 54, title: 'Áo khoác jean_Màu nâu', alias: 'ao khoac jean_mau nau', productCode: 'SP49', price: 400000, priceSale: 380000, originalPrice: 350000, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo khoác nâu jean.jpg' },
            { id: 55, title: 'Áo khoác_Màu be ', alias: 'ao khoac_mau be', productCode: 'SP50', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 0, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now, image: '/Uploads/images/sanpham/áo khoác be.jpg' },
            { id: 56, title: 'Áo khoác_Màu be ', alias: 'ao-khoac_mau-be', productCode: 'SP51', price: 350000, priceSale: 320000, originalPrice: 300000, quantity: 1, productCategoryId: 3, isActive: true, isHome: true, isHot: false, createdAt: now, updatedAt: now }
        ], {});

        // 7. PRODUCT IMAGES (Toàn bộ ảnh)
        await queryInterface.bulkInsert('ProductImages', [
            { id: 3, productId: 3, image: '/Uploads/images/sanpham/ao khoac xanh jean.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 5, productId: 5, image: '/Uploads/images/sanpham/cardigan be.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 6, productId: 6, image: '/Uploads/images/sanpham/cardigan xanh dương.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 7, productId: 7, image: '/Uploads/images/sanpham/cardigan xám.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 8, productId: 8, image: '/Uploads/images/sanpham/quần kaki be.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 9, productId: 9, image: '/Uploads/images/sanpham/quần kaki trắng.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 10, productId: 10, image: '/Uploads/images/sanpham/quần kaki xám đậm.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 11, productId: 11, image: '/Uploads/images/sanpham/quần kaki xám.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 12, productId: 12, image: '/Uploads/images/sanpham/quần short  xanh jean.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 13, productId: 13, image: '/Uploads/images/sanpham/quần short be kaki.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 14, productId: 14, image: '/Uploads/images/sanpham/quần short thun xanh rêu.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 15, productId: 15, image: '/Uploads/images/sanpham/quần short thun xanh đen.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 16, productId: 16, image: '/Uploads/images/sanpham/quần short thun xám.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 17, productId: 17, image: '/Uploads/images/sanpham/quần short thun đen.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 18, productId: 18, image: '/Uploads/images/sanpham/quần short trắng kaki.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 19, productId: 19, image: '/Uploads/images/sanpham/quần short xanh đen kaki.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 20, productId: 20, image: '/Uploads/images/sanpham/quần short xám kaki.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 21, productId: 21, image: '/Uploads/images/sanpham/quần short đen jean.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 22, productId: 22, image: '/Uploads/images/sanpham/quần thun nâu.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 23, productId: 23, image: '/Uploads/images/sanpham/quần thun xanh rêu.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 24, productId: 24, image: '/Uploads/images/sanpham/quần thun đen.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 25, productId: 25, image: '/Uploads/images/sanpham/quần tây be.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 26, productId: 27, image: '/Uploads/images/sanpham/quần tây nâu.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 27, productId: 28, image: '/Uploads/images/sanpham/quần tây xám.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 28, productId: 29, image: '/Uploads/images/sanpham/quần tây đen.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 29, productId: 30, image: '/Uploads/images/sanpham/sơ mi be.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 30, productId: 31, image: '/Uploads/images/sanpham/sơ mi hồng.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 31, productId: 32, image: '/Uploads/images/sanpham/sơ mi trắng.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 32, productId: 33, image: '/Uploads/images/sanpham/sơ mi xanh dương.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 33, productId: 34, image: '/Uploads/images/sanpham/sơ mi đen.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 34, productId: 35, image: '/Uploads/images/sanpham/sơ mi đỏ.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 35, productId: 36, image: '/Uploads/images/sanpham/thun be.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 36, productId: 37, image: '/Uploads/images/sanpham/thun rêu.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 37, productId: 38, image: '/Uploads/images/sanpham/thun trắng xám.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 38, productId: 39, image: '/Uploads/images/sanpham/thun xám viền trắng.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 39, productId: 40, image: '/Uploads/images/sanpham/thun xám.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 40, productId: 41, image: '/Uploads/images/sanpham/thun đen viền trắng.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 41, productId: 42, image: '/Uploads/images/sanpham/thun đen.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 42, productId: 43, image: '/Uploads/images/sanpham/xanh dương.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 43, productId: 44, image: '/Uploads/images/sanpham/xanh lá.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 44, productId: 45, image: '/Uploads/images/sanpham/áo thun đen viền.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 45, productId: 46, image: '/Uploads/images/sanpham/áo thun trắng.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 46, productId: 47, image: '/Uploads/images/sanpham/áo khoác đen.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 47, productId: 49, image: '/Uploads/images/sanpham/áo khoác xám.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 48, productId: 50, image: '/Uploads/images/sanpham/áo khoác xanh trắng.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 49, productId: 51, image: '/Uploads/images/sanpham/áo khoác xanh rêu.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 50, productId: 52, image: '/Uploads/images/sanpham/áo khoác xanh dương.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 51, productId: 53, image: '/Uploads/images/sanpham/áo khoác trắng viền.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 52, productId: 54, image: '/Uploads/images/sanpham/áo khoác nâu jean.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 53, productId: 55, image: '/Uploads/images/sanpham/áo khoác be.jpg', isDefault: true, createdAt: now, updatedAt: now },
            { id: 54, productId: 56, image: '/Uploads/images/sanpham/áo khoác be viền đen.jpg', isDefault: true, createdAt: now, updatedAt: now }
        ], {});

        // 8. ORDERS (14 Orders)
        await queryInterface.bulkInsert('Orders', [
            { id: 1, code: 'DH7377', customerName: 'thngan', phone: '0123456789', address: 'Phú Nhuận', email: 'thngan@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 1, status: 1, createdAt: now, updatedAt: now },
            { id: 2, code: 'DH7854', customerName: 'Loan', phone: '0543216789', address: 'Quận 7', email: 'loan@gmail.com', totalAmount: 200000, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 3, code: 'DH7231', customerName: 'Lê Thị Trúc Linh', phone: '113', address: 'Tây Ninh', email: 'lttl@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 4, code: 'DH5837', customerName: 'Lee Thi Linh', phone: '0245738438', address: '280 An Duong Vuong', email: 'lethilinh@gmail.com', totalAmount: 100000, quantity: 0, typePayment: 1, status: 1, createdAt: now, updatedAt: now },
            { id: 5, code: 'DH0803', customerName: 'loan', phone: '0894324234', address: '3440 Nguyen An Ninh', email: 'ndsfguhsuyf@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 6, code: 'DH2214', customerName: 'loan', phone: '0912434812', address: 'nskdfhhioshf', email: 'shbdskfhajhla@gmail.com', totalAmount: 0, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 7, code: 'DH5402', customerName: 'loan', phone: '0868650408', address: '280 An Duong Vuong', email: 'nguyenngocloan04@gmail.com', totalAmount: 0, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 8, code: 'DH4732', customerName: 'linh khung', phone: '0912131231', address: 'xznckskj', email: 'fdnsjkfljas@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 9, code: 'DH5578', customerName: 'loan', phone: '0929834834', address: 'jsfzghfkjhfkja', email: 'naghhguahiua@gmail.com', totalAmount: 0, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 10, code: 'DH2760', customerName: 'loan', phone: '0182412488', address: 'jshjhjkafjafajsfh', email: 'sfsjkhfdjhsj@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 11, code: 'DH5720', customerName: 'Linh ', phone: '0908765546', address: 'quận 5', email: 'vttl7521@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 1, status: 1, createdAt: now, updatedAt: now },
            { id: 12, code: 'DH8602', customerName: 'loan', phone: '0123498765', address: 'Tân Bình ', email: 'vttl7521@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now },
            { id: 13, code: 'DH4730', customerName: 'nguyen duc hai', phone: '0192877332', address: 'dcsdcsdcs', email: 'nguyenduchai9e@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 1, status: 1, createdAt: now, updatedAt: now },
            { id: 14, code: 'DH6287', customerName: 'nguyenduchai', phone: '0102919371', address: 'dfrgrgrg', email: 'nguyenduchai9e@gmail.com', totalAmount: 300000, quantity: 0, typePayment: 2, status: 1, createdAt: now, updatedAt: now }
        ], {});

        // 9. ORDER DETAILS (11 Details)
        await queryInterface.bulkInsert('OrderDetails', [
            { id: 1, orderId: 1, productId: 5, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 2, orderId: 2, productId: 11, price: 200000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 3, orderId: 3, productId: 3, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 4, orderId: 4, productId: 13, price: 100000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 5, orderId: 5, productId: 3, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 6, orderId: 8, productId: 3, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 7, orderId: 10, productId: 3, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 8, orderId: 11, productId: 5, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 9, orderId: 12, productId: 7, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 10, orderId: 13, productId: 6, price: 300000, quantity: 1, createdAt: now, updatedAt: now },
            { id: 11, orderId: 14, productId: 6, price: 300000, quantity: 1, createdAt: now, updatedAt: now }
        ], {});

        // 10. SUBSCRIBES (3 Subscribes)
        await queryInterface.bulkInsert('Subscribes', [
            { id: 1, email: 'vttl7521@gmail.com', createdAt: now, updatedAt: now },
            { id: 2, email: 'vttl7521@gmail.com', createdAt: now, updatedAt: now },
            { id: 3, email: 'vttt@gmail.com', createdAt: now, updatedAt: now }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        // Xóa dữ liệu theo thứ tự ngược lại để tránh lỗi khóa ngoại
        await queryInterface.bulkDelete('Subscribes', null, {});
        await queryInterface.bulkDelete('OrderDetails', null, {});
        await queryInterface.bulkDelete('Orders', null, {});
        await queryInterface.bulkDelete('ProductImages', null, {});
        await queryInterface.bulkDelete('Products', null, {});
        await queryInterface.bulkDelete('ProductCategories', null, {});
        await queryInterface.bulkDelete('Posts', null, {});
        await queryInterface.bulkDelete('News', null, {});
        await queryInterface.bulkDelete('Categories', null, {});
        await queryInterface.bulkDelete('Users', null, {});
    }
};