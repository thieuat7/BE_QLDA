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

async function fixXanhPaths() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Tìm products có path sai
        const [products] = await sequelize.query(`
            SELECT id, title, image
            FROM Products
            WHERE image LIKE '%thun xanh la%' OR image LIKE '%thun xanh duong%'
        `);

        console.log('📊 Sản phẩm có path sai:');
        products.forEach(p => {
            console.log(`[${p.id}] ${p.title}`);
            console.log(`    Current: ${p.image}`);
        });

        // Fix thun xanh la → xanh lá
        const [result1] = await sequelize.query(`
            UPDATE Products
            SET image = REPLACE(image, 'thun xanh la.jpg', 'xanh lá.jpg')
            WHERE image LIKE '%thun xanh la.jpg%'
        `);
        console.log(`\n✓ Fixed "thun xanh la" → "xanh lá": ${result1.affectedRows} rows`);

        // Fix thun xanh duong → xanh dương
        const [result2] = await sequelize.query(`
            UPDATE Products
            SET image = REPLACE(image, 'thun xanh duong.jpg', 'xanh dương.jpg')
            WHERE image LIKE '%thun xanh duong.jpg%'
        `);
        console.log(`✓ Fixed "thun xanh duong" → "xanh dương": ${result2.affectedRows} rows`);

        // Verify
        const [verify] = await sequelize.query(`
            SELECT id, title, image
            FROM Products
            WHERE image LIKE '%xanh lá.jpg%' OR image LIKE '%xanh dương.jpg%'
        `);

        console.log('\n📊 Verified products:');
        verify.forEach(p => {
            console.log(`[${p.id}] ${p.title}`);
            console.log(`    ${p.image}`);
        });

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixXanhPaths();
