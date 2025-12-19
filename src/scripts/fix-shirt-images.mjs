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

// Map tên sản phẩm áo với tên file
const imageMap = {
    // Áo khoác jean
    'Áo khoác jean_Màu xanh': '/Uploads/products/ao khoac xanh jean.jpg',

    // Cardigan
    'Cardigan_Màu be': '/Uploads/products/cardigan be.jpg',
    'Cardigan_Xanh dương': '/Uploads/products/cardigan xanh dương.jpg',
    'Cardigan_Màu xám': '/Uploads/products/cardigan xám.jpg',

    // Áo sơ mi
    'Áo sơ mi_Màu be': '/Uploads/products/sơ mi be.jpg',
    'Áo sơ mi_Màu hồng': '/Uploads/products/sơ mi hồng.jpg',
    'Áo sơ mi_Màu trắng': '/Uploads/products/sơ mi trắng.jpg',
    'Áo sơ mi_Xanh dương': '/Uploads/products/sơ mi xanh dương.jpg',
    'Áo sơ mi_Màu đen': '/Uploads/products/sơ mi đen.jpg',

    // Áo thun
    'Áo thun_Xanh rêu': '/Uploads/products/thun xanh rêu.jpg',
    'Áo thun_Trắng - xám': '/Uploads/products/áo thun trắng.jpg',
    'Áo thun_Màu xám': '/Uploads/products/thun xám.jpg',
    'Áo thun_Màu đen': '/Uploads/products/thun đen.jpg',
    'Áo thun_Xanh dương': '/Uploads/products/thun xanh dương.jpg',
    'Áo thun_Xanh lá': '/Uploads/products/thun xanh lá.jpg',

    // Áo khoác
    'Áo khoác_Xanh trắng': '/Uploads/products/áo khoác xanh trắng.jpg',
    'Áo khoác_Xanh rêu': '/Uploads/products/áo khoác xanh rêu.jpg',
    'Áo khoác_Xanh dương': '/Uploads/products/áo khoác xanh dương.jpg',
    'Áo khoác_Màu be': '/Uploads/products/áo khoác be.jpg',
};

async function fixShirtImages() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        let updated = 0;
        let notFound = [];

        for (const [title, imagePath] of Object.entries(imageMap)) {
            try {
                const [result] = await sequelize.query(`
                    UPDATE Products
                    SET image = ?
                    WHERE title = ? AND (image IS NULL OR image = '' OR image = 'null')
                `, {
                    replacements: [imagePath, title]
                });

                if (result.affectedRows > 0) {
                    console.log(`✓ Updated: ${title}`);
                    updated++;
                } else {
                    console.log(`⚠️  Not found: ${title}`);
                    notFound.push(title);
                }
            } catch (error) {
                console.log(`❌ Failed: ${title} - ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log(`✅ Updated: ${updated} products`);
        if (notFound.length > 0) {
            console.log(`⚠️  Not found: ${notFound.length} products`);
        }

        // Check remaining products without images
        const [remaining] = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM Products
            WHERE image IS NULL OR image = '' OR image = 'null'
        `);

        console.log(`\n📊 Remaining products without images: ${remaining[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixShirtImages();
