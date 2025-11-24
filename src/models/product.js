'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Product extends Model {
        static associate(models) {
            Product.belongsTo(models.ProductCategory, { foreignKey: 'productCategoryId', as: 'category' });
            Product.hasMany(models.ProductImage, { foreignKey: 'productId', as: 'images' });
            Product.hasMany(models.OrderDetail, { foreignKey: 'productId', as: 'orderDetails' });
        }
    }
    Product.init({
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
        viewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        isHome: DataTypes.BOOLEAN,
        isSale: DataTypes.BOOLEAN,
        isFeature: DataTypes.BOOLEAN,
        isHot: DataTypes.BOOLEAN,
        isActive: DataTypes.BOOLEAN,
        productCategoryId: DataTypes.INTEGER,
        seoTitle: DataTypes.STRING,
        seoDescription: DataTypes.STRING,
        seoKeywords: DataTypes.STRING
    }, { sequelize, modelName: 'Product' });
    return Product;
};