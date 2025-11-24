'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class News extends Model {
        static associate(models) {
            News.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
        }
    }
    News.init({
        title: DataTypes.STRING,
        alias: DataTypes.STRING,
        description: DataTypes.TEXT,
        detail: DataTypes.TEXT,
        image: DataTypes.STRING,
        categoryId: DataTypes.INTEGER,
        isActive: DataTypes.BOOLEAN,
        seoTitle: DataTypes.STRING,
        seoDescription: DataTypes.STRING,
        seoKeywords: DataTypes.STRING
    }, { sequelize, modelName: 'News' });
    return News;
};