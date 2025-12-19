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

async function fixRemainingPaths() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Fix quần short thun rêu → quần short thun xanh rêu
        const [result1] = await sequelize.query(`
            UPDATE Products
            SET image = '/Uploads/products/quần short thun xanh rêu.jpg'
            WHERE id = 14
        `);
        console.log(`✓ Fixed product [14]: ${result1.affectedRows} rows`);

        // Fix quần thun rêu → quần thun xanh rêu
        const [result2] = await sequelize.query(`
            UPDATE Products
            SET image = '/Uploads/products/quần thun xanh rêu.jpg'
            WHERE id = 23
        `);
        console.log(`✓ Fixed product [23]: ${result2.affectedRows} rows`);

        // Verify
        const [verify] = await sequelize.query(`
            SELECT id, title, image
            FROM Products
            WHERE id IN (14, 23, 37)
        `);

        console.log('\n📊 Verified:');
        verify.forEach(p => {
            console.log(`[${p.id}] ${p.title}`);
            console.log(`     ${p.image}`);
        });

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixRemainingPaths();
