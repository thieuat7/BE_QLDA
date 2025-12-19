import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize and connect to database
 */
export const connectDB = async () => {
    try {
        const env = process.env.NODE_ENV || 'development';
        const configPath = join(__dirname, '../config/config.json');
        const configData = JSON.parse(readFileSync(configPath, 'utf8'));
        const config = configData[env];

        const sequelize = new Sequelize(config.database, config.username, config.password, config);

        // Test connection
        await sequelize.authenticate();
        console.log('✓ Database connection established successfully');

        return true;
    } catch (error) {
        console.error('✗ Unable to connect to database:', error.message);
        return false;
    }
};
