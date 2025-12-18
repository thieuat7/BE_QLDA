// Run this script to fix image paths in database
// Usage: node fix-image-paths.mjs

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

async function fixImagePaths() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✓ Connected to database');

        // Update Products table
        console.log('\n🔄 Updating Products table...');
        const [productsUpdated] = await sequelize.query(`
            UPDATE Products
            SET image = REPLACE(image, '/Uploads/images/sanpham/', '/Uploads/products/')
            WHERE image LIKE '/Uploads/images/sanpham/%'
        `);
        console.log(`✓ Updated ${productsUpdated.affectedRows || 0} products`);

        // Update ProductImages table
        console.log('\n🔄 Updating ProductImages table...');
        const [imagesUpdated] = await sequelize.query(`
            UPDATE ProductImages
            SET image = REPLACE(image, '/Uploads/images/sanpham/', '/Uploads/products/')
            WHERE image LIKE '/Uploads/images/sanpham/%'
        `);
        console.log(`✓ Updated ${imagesUpdated.affectedRows || 0} product images`);

        // Verify results
        console.log('\n📊 Verification:');
        const [products] = await sequelize.query(`
            SELECT id, title, image 
            FROM Products 
            WHERE image LIKE '/Uploads/products/%' 
            LIMIT 5
        `);
        console.log('Sample products:', products);

        console.log('\n✅ Image paths fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixImagePaths();
