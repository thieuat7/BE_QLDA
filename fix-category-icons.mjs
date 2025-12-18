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

async function fixCategoryIcons() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Update category icons
        console.log('🔄 Đang update icon danh mục...\n');

        const updates = [
            {
                id: 1,
                title: 'Áo',
                icon: '/Uploads/products/áo thun trắng.jpg'
            },
            {
                id: 2,
                title: 'Quần',
                icon: '/Uploads/products/quần kaki trắng.jpg'
            },
            {
                id: 3,
                title: 'Áo khoác',
                icon: '/Uploads/products/áo khoác trắng viền.jpg'
            },
            {
                id: 5,
                title: 'Váy',
                icon: null // Hoặc có thể set placeholder
            }
        ];

        let updated = 0;

        for (const category of updates) {
            const iconValue = category.icon || 'NULL';

            if (category.icon) {
                const [result] = await sequelize.query(`
                    UPDATE ProductCategories
                    SET icon = ?
                    WHERE id = ?
                `, {
                    replacements: [category.icon, category.id]
                });

                if (result.affectedRows > 0) {
                    console.log(`✓ Updated [${category.id}] ${category.title}: ${category.icon}`);
                    updated++;
                }
            } else {
                const [result] = await sequelize.query(`
                    UPDATE ProductCategories
                    SET icon = NULL
                    WHERE id = ?
                `, {
                    replacements: [category.id]
                }); if (result.affectedRows > 0) {
                    console.log(`✓ Updated [${category.id}] ${category.title}: NULL (no icon)`);
                    updated++;
                }
            }
        }

        console.log(`\n✅ Đã update ${updated} danh mục\n`);

        // Verify
        const [categories] = await sequelize.query(`
            SELECT id, title, alias, icon
            FROM ProductCategories
            ORDER BY id
        `);

        console.log('📊 Danh mục sau khi update:');
        console.log('='.repeat(80));
        categories.forEach(cat => {
            console.log(`[${cat.id}] ${cat.title} (${cat.alias})`);
            console.log(`    Icon: ${cat.icon || '❌ NULL'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixCategoryIcons();
