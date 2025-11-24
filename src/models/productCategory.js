'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductCategory extends Model {
        static associate(models) {
            ProductCategory.hasMany(models.Product, { foreignKey: 'productCategoryId', as: 'products' });
        }
    }
    ProductCategory.init({
        title: DataTypes.STRING,
        alias: DataTypes.STRING,
        description: DataTypes.TEXT,
        icon: DataTypes.STRING,
        seoTitle: DataTypes.STRING,
        seoDescription: DataTypes.STRING,
        seoKeywords: DataTypes.STRING
    }, { sequelize, modelName: 'ProductCategory' });
    return ProductCategory;
};