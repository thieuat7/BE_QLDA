'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            Category.hasMany(models.News, { foreignKey: 'categoryId', as: 'news' });
            Category.hasMany(models.Post, { foreignKey: 'categoryId', as: 'posts' });
        }
    }
    Category.init({
        title: DataTypes.STRING,
        alias: DataTypes.STRING,
        link: DataTypes.STRING,
        description: DataTypes.TEXT,
        position: DataTypes.INTEGER,
        isActive: DataTypes.BOOLEAN,
        seoTitle: DataTypes.STRING,
        seoDescription: DataTypes.STRING,
        seoKeywords: DataTypes.STRING
    }, { sequelize, modelName: 'Category' });
    return Category;
};