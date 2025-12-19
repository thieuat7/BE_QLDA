import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'src/config/config.js');
const configData = JSON.parse(readFileSync(configPath, 'utf8'));
const config = configData['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function checkAllProductsWithoutImages() {
    try {
        await sequelize.authenticate();

        // Lấy tất cả sản phẩm không có ảnh
        const [products] = await sequelize.query(`
            SELECT id, title, image, productCode
            FROM Products 
            WHERE image IS NULL OR image = '' OR image = 'null'
            ORDER BY id
        `);

        console.log(`\n❌ CÓ ${products.length} SẢN PHẨM KHÔNG CÓ ẢNH:\n`);
        console.log('='.repeat(80));

        products.forEach(p => {
            console.log(`[${p.id}] ${p.title} (${p.productCode || 'No code'})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAllProductsWithoutImages();
