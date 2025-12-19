import { Sequelize } from 'sequelize';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'src/config/config.js');
const configData = JSON.parse(readFileSync(configPath, 'utf8'));
const config = configData['development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function checkPantsImages() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Lấy tất cả sản phẩm có từ "quần" trong title
        const [products] = await sequelize.query(`
            SELECT id, title, image 
            FROM Products 
            WHERE title LIKE '%quần%'
            ORDER BY id
        `);

        console.log('📊 SẢN PHẨM QUẦN TRONG DATABASE:');
        console.log('='.repeat(80));
        products.forEach(p => {
            console.log(`[${p.id}] ${p.title}`);
            console.log(`    Image: ${p.image || '❌ NULL/EMPTY'}`);
        });

        // Kiểm tra file thực tế trong folder
        console.log('\n\n📁 FILE ẢNH QUẦN TRONG FOLDER:');
        console.log('='.repeat(80));
        const productsDir = join(__dirname, 'public/Uploads/products');
        const files = readdirSync(productsDir);
        const pantsFiles = files.filter(f =>
            f.toLowerCase().includes('quần') ||
            f.toLowerCase().includes('quan') ||
            f.toLowerCase().includes('short') ||
            f.toLowerCase().includes('jean')
        );

        pantsFiles.forEach(file => {
            console.log(`✓ ${file}`);
        });

        // So sánh
        console.log('\n\n⚠️ PHÂN TÍCH:');
        console.log('='.repeat(80));
        console.log(`Số sản phẩm quần trong DB: ${products.length}`);
        console.log(`Số file ảnh quần trong folder: ${pantsFiles.length}`);

        const productsWithoutImage = products.filter(p => !p.image || p.image === 'null');
        if (productsWithoutImage.length > 0) {
            console.log(`\n❌ ${productsWithoutImage.length} sản phẩm KHÔNG CÓ ẢNH:`);
            productsWithoutImage.forEach(p => {
                console.log(`   - [${p.id}] ${p.title}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkPantsImages();
