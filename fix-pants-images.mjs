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

// Map tên sản phẩm với tên file
const imageMap = {
    // Quần kaki
    'Quần kaki_Màu be': '/Uploads/products/quần kaki be.jpg',
    'Quần kaki_Màu trắng': '/Uploads/products/quần kaki trắng.jpg',
    'Quần kaki_Xám đậm': '/Uploads/products/quần kaki xám đậm.jpg',
    'Quần kaki_Màu xám': '/Uploads/products/quần kaki xám.jpg',

    // Quần short jean
    'Quần short jean_Màu xanh': '/Uploads/products/quần short  xanh jean.jpg',

    // Quần short thun
    'Quần short thun_Xanh lá': '/Uploads/products/quần short thun xanh rêu.jpg',
    'Quần short thun_Xanh đen': '/Uploads/products/quần short thun xanh đen.jpg',
    'Quần short thun_Màu xám': '/Uploads/products/quần short thun xám.jpg',
    'Quần short thun_Màu đen': '/Uploads/products/quần short thun đen.jpg',

    // Quần short kaki
    'Quần short kaki_Màu trắng': '/Uploads/products/quần short trắng kaki.jpg',
    'Quần short kaki_Xanh đen': '/Uploads/products/quần short xanh đen kaki.jpg',
    'Quần short kaki_Màu xám': '/Uploads/products/quần short xám kaki.jpg',
    'Quần short kaki_Màu đen': '/Uploads/products/quần short đen jean.jpg',

    // Quần thun
    'Quần thun_Màu nâu': '/Uploads/products/quần thun nâu.jpg',
    'Quần thun_Xanh rêu': '/Uploads/products/quần thun xanh rêu.jpg',
    'Quần thun_Màu đen': '/Uploads/products/quần thun đen.jpg',

    // Quần tây
    'Quần tây_Màu be': '/Uploads/products/quần tây be.jpg',
    'Quần tây_Màu nâu': '/Uploads/products/quần tây nâu.jpg',
    'Quần tây_Màu xám': '/Uploads/products/quần tây xám.jpg',
    'Quần tây_Màu đen': '/Uploads/products/quần tây đen.jpg',
};

async function fixPantsImages() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        let updated = 0;
        let failed = [];

        for (const [title, imagePath] of Object.entries(imageMap)) {
            try {
                const [result] = await sequelize.query(`
                    UPDATE Products
                    SET image = ?
                    WHERE title = ? AND (image IS NULL OR image = '')
                `, {
                    replacements: [imagePath, title]
                });

                if (result.affectedRows > 0) {
                    console.log(`✓ Updated: ${title}`);
                    updated++;
                } else {
                    console.log(`⚠️  Not found or already has image: ${title}`);
                }
            } catch (error) {
                console.log(`❌ Failed: ${title} - ${error.message}`);
                failed.push(title);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log(`✅ Updated: ${updated} products`);
        if (failed.length > 0) {
            console.log(`❌ Failed: ${failed.length} products`);
        }

        // Verify
        console.log('\n📊 Verification:');
        const [results] = await sequelize.query(`
            SELECT id, title, image 
            FROM Products 
            WHERE title LIKE '%quần%'
            ORDER BY id
            LIMIT 10
        `);

        results.forEach(p => {
            const status = p.image ? '✓' : '❌';
            console.log(`${status} [${p.id}] ${p.title}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixPantsImages();
