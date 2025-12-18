import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'src/config/config.json');
const configData = JSON.parse(readFileSync(configPath, 'utf8'));
const config = configData['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function deleteProductsWithoutImages() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Lấy danh sách sản phẩm không có ảnh trước khi xóa
        const [products] = await sequelize.query(`
            SELECT id, title, productCode
            FROM Products
            WHERE image IS NULL OR image = '' OR image = 'null'
        `);

        console.log(`🔍 Tìm thấy ${products.length} sản phẩm không có ảnh:\n`);
        products.forEach(p => {
            console.log(`   [${p.id}] ${p.title} (${p.productCode || 'No code'})`);
        });

        if (products.length === 0) {
            console.log('\n✅ Không có sản phẩm nào cần xóa!');
            process.exit(0);
        }

        console.log('\n⚠️  Chuẩn bị xóa...\n');

        // Xóa ProductImages liên quan trước (nếu có)
        const [deletedImages] = await sequelize.query(`
            DELETE FROM ProductImages
            WHERE productId IN (
                SELECT id FROM Products
                WHERE image IS NULL OR image = '' OR image = 'null'
            )
        `);
        console.log(`✓ Đã xóa ${deletedImages.affectedRows || 0} ảnh liên quan`);

        // Xóa sản phẩm
        const [result] = await sequelize.query(`
            DELETE FROM Products
            WHERE image IS NULL OR image = '' OR image = 'null'
        `);

        console.log(`✓ Đã xóa ${result.affectedRows} sản phẩm\n`);

        // Verify
        const [remaining] = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM Products
        `);

        console.log(`📊 Số sản phẩm còn lại: ${remaining[0].count}`);
        console.log('\n✅ Hoàn thành!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteProductsWithoutImages();
