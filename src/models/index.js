import { Sequelize, DataTypes } from 'sequelize';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const configPath = join(__dirname, '../config/config.js');
const configData = JSON.parse(readFileSync(configPath, 'utf8'));
const config = configData[env];

// Initialize Sequelize
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Define models inline (simplified approach)
const db = {};

// Test connection
try {
  await sequelize.authenticate();
  console.log('✓ Database connection established successfully');
} catch (error) {
  console.error('✗ Unable to connect to database:', error.message);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Models
db.Product = sequelize.define('Product', {
  title: DataTypes.STRING,
  alias: DataTypes.STRING,
  productCode: DataTypes.STRING,
  description: DataTypes.TEXT,
  detail: DataTypes.TEXT,
  image: DataTypes.STRING,
  originalPrice: DataTypes.DECIMAL(18, 2),
  price: DataTypes.DECIMAL(18, 2),
  priceSale: DataTypes.DECIMAL(18, 2),
  quantity: DataTypes.INTEGER,
  productCategoryId: DataTypes.INTEGER,
  isActive: DataTypes.BOOLEAN,
  isHome: DataTypes.BOOLEAN,
  isHot: DataTypes.BOOLEAN,
  isSale: DataTypes.BOOLEAN
});

db.ProductCategory = sequelize.define('ProductCategory', {
  title: DataTypes.STRING,
  alias: DataTypes.STRING,
  icon: DataTypes.STRING
});

db.ProductImage = sequelize.define('ProductImage', {
  productId: DataTypes.INTEGER,
  image: DataTypes.STRING,
  isDefault: DataTypes.BOOLEAN
});

db.Category = sequelize.define('Category', {
  title: DataTypes.STRING,
  alias: DataTypes.STRING,
  position: DataTypes.INTEGER,
  isActive: DataTypes.BOOLEAN
});

db.User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  fullName: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  userName: DataTypes.STRING,
  passwordHash: DataTypes.STRING,
  googleId: DataTypes.STRING,
  facebookId: DataTypes.STRING,
  avatar: DataTypes.STRING
});

db.Order = sequelize.define('Order', {
  code: DataTypes.STRING,
  userId: DataTypes.STRING(128),
  customerName: DataTypes.STRING,
  phone: DataTypes.STRING,
  address: DataTypes.STRING,
  email: DataTypes.STRING,
  totalAmount: DataTypes.DECIMAL(18, 2),
  quantity: DataTypes.INTEGER,
  typePayment: DataTypes.INTEGER,
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  discountId: DataTypes.INTEGER,
  discountValue: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
  transactionId: DataTypes.STRING(100)
});

db.OrderDetail = sequelize.define('OrderDetail', {
  orderId: DataTypes.INTEGER,
  productId: DataTypes.INTEGER,
  price: DataTypes.DECIMAL(18, 2),
  quantity: DataTypes.INTEGER
});

db.Cart = sequelize.define('Cart', {
  userId: DataTypes.STRING(128)
});

db.CartItem = sequelize.define('CartItem', {
  cartId: DataTypes.INTEGER,
  productId: DataTypes.INTEGER,
  quantity: DataTypes.INTEGER,
  price: DataTypes.DECIMAL(18, 2)
});

db.Discount = sequelize.define('Discount', {
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  description: DataTypes.TEXT,
  type: { type: DataTypes.ENUM('percent', 'amount'), defaultValue: 'percent', allowNull: false },
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  minOrderAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  maxDiscount: DataTypes.DECIMAL(10, 2),
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  usageLimit: DataTypes.INTEGER,
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Associations
db.Product.belongsTo(db.ProductCategory, { foreignKey: 'productCategoryId', as: 'category' });
db.Product.hasMany(db.ProductImage, { foreignKey: 'productId', as: 'images' });
db.ProductImage.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });

// Cart associations
db.Cart.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.Cart.hasMany(db.CartItem, { foreignKey: 'cartId', as: 'items' });
db.CartItem.belongsTo(db.Cart, { foreignKey: 'cartId', as: 'cart' });
db.CartItem.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });

// Order associations
db.Order.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.Order.belongsTo(db.Discount, { foreignKey: 'discountId', as: 'discount' });
db.Order.hasMany(db.OrderDetail, { foreignKey: 'orderId', as: 'OrderDetails' });
db.OrderDetail.belongsTo(db.Order, { foreignKey: 'orderId', as: 'order' });
db.OrderDetail.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });

export default db;
