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

async function fixCategoryIcons() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to database\n');

        // Dùng emoji hoặc text thay vì ảnh sản phẩm
        const iconUpdates = [
            { id: 1, title: 'Áo', icon: '👕' },
            { id: 2, title: 'Quần', icon: '👖' },
            { id: 3, title: 'Áo khoác', icon: '🧥' },
            { id: 5, title: 'Váy', icon: '👗' }
        ];

        console.log('🔄 Updating category icons to emoji...\n');

        for (const cat of iconUpdates) {
            const [result] = await sequelize.query(`
                UPDATE ProductCategories
                SET icon = ?
                WHERE id = ?
            `, {
                replacements: [cat.icon, cat.id]
            });

            if (result.affectedRows > 0) {
                console.log(`✓ [${cat.id}] ${cat.title} → ${cat.icon}`);
            }
        }

        // Verify
        const [categories] = await sequelize.query(`
            SELECT id, title, alias, icon
            FROM ProductCategories
            ORDER BY id
        `);

        console.log('\n📊 Categories after update:');
        console.log('='.repeat(60));
        categories.forEach(cat => {
            console.log(`[${cat.id}] ${cat.icon} ${cat.title} (${cat.alias})`);
        });

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixCategoryIcons();
