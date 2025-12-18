import { Sequelize } from 'sequelize';
import { readFileSync, readdirSync } from 'fs';
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
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Lấy danh sách file thực tế
        const productsDir = join(__dirname, 'public/Uploads/products');
        const actualFiles = readdirSync(productsDir);

        console.log('📁 File thực tế trong folder (áo thun):');
        const shirtFiles = actualFiles.filter(f =>
            f.includes('thun') && !f.includes('quần')
        );
        shirtFiles.forEach(f => console.log(`   ${f}`));

        // Lấy products từ database có path lỗi
        const [products] = await sequelize.query(`
            SELECT id, title, image
            FROM Products
            WHERE image LIKE '%thun%xanh%rêu%' OR image LIKE '%thun%xanh%reu%'
        `);

        console.log('\n\n📊 Sản phẩm trong database có path "thun xanh rêu":');
        products.forEach(p => {
            console.log(`   [${p.id}] ${p.title}`);
            console.log(`       Current: ${p.image}`);

            // Tìm file phù hợp
            const possibleFile = actualFiles.find(f =>
                f.toLowerCase().includes('thun') &&
                f.toLowerCase().includes('rêu') &&
                !f.toLowerCase().includes('quần')
            );

            if (possibleFile) {
                console.log(`       Should be: /Uploads/products/${possibleFile}`);
            } else {
                console.log(`       ❌ No matching file found!`);
            }
        });

        // Fix specific paths
        console.log('\n\n🔄 Fixing image paths...\n');

        const fixes = [
            { old: 'thun xanh rêu.jpg', new: 'thun rêu.jpg' },
            { old: 'thun xanh lá.jpg', new: 'thun xanh la.jpg' },
            { old: 'thun xanh dương.jpg', new: 'thun xanh duong.jpg' },
        ];

        let updated = 0;

        for (const fix of fixes) {
            const [result] = await sequelize.query(`
                UPDATE Products
                SET image = REPLACE(image, ?, ?)
                WHERE image LIKE ?
            `, {
                replacements: [fix.old, fix.new, `%${fix.old}%`]
            });

            if (result.affectedRows > 0) {
                console.log(`✓ Fixed: ${fix.old} → ${fix.new} (${result.affectedRows} products)`);
                updated += result.affectedRows;
            }
        }

        console.log(`\n✅ Total updated: ${updated} products`);

        // Verify - check for 404 paths
        const [check404] = await sequelize.query(`
            SELECT id, title, image
            FROM Products
            WHERE image LIKE '%/Uploads/products/%'
            ORDER BY id
            LIMIT 20
        `);

        console.log('\n\n📊 Sample products:');
        check404.forEach(p => {
            const fileName = p.image.split('/').pop();
            const exists = actualFiles.includes(fileName);
            const status = exists ? '✓' : '❌';
            console.log(`${status} [${p.id}] ${p.title}`);
            console.log(`     ${p.image}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixImagePaths();
