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

async function fixProductImage() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database');

        // Fix product ID 58 - có path lỗi
        console.log('\n🔄 Fixing product ID 58...');
        await sequelize.query(`
            UPDATE Products
            SET image = '/Uploads/products/thun be1.jpg'
            WHERE id = 58
        `);
        console.log('✓ Fixed product ID 58');

        // Verify
        const [results] = await sequelize.query(`
            SELECT id, title, image 
            FROM Products 
            WHERE id IN (36, 58, 59)
        `);

        console.log('\n📊 Updated products:');
        results.forEach(p => {
            console.log(`- [${p.id}] ${p.title}: ${p.image}`);
        });

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixProductImage();
