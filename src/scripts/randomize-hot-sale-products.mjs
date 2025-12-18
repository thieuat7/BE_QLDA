import db from '../models/index.js';

async function randomizeHotAndSale() {
    try {
        // Lấy tất cả id sản phẩm
        const products = await db.Product.findAll({ attributes: ['id'] });
        const ids = products.map(p => p.id);
        if (ids.length < 40) {
            console.log('Không đủ 40 sản phẩm để random!');
            return;
        }
        // Shuffle mảng id
        const shuffled = ids.sort(() => 0.5 - Math.random());
        const saleIds = shuffled.slice(0, 20);
        const hotIds = shuffled.slice(20, 40);

        // Reset tất cả về false trước
        await db.Product.update({ isSale: false, isHot: false }, { where: {} });
        // Cập nhật 20 sản phẩm isSale
        await db.Product.update({ isSale: true }, { where: { id: saleIds } });
        // Cập nhật 20 sản phẩm isHot
        await db.Product.update({ isHot: true }, { where: { id: hotIds } });

        console.log('Đã random 20 sản phẩm isSale và 20 sản phẩm isHot!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

randomizeHotAndSale();
