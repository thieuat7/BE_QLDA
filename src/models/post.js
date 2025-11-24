'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Post extends Model {
        static associate(models) {
            Post.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
        }
    }
    Post.init({
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
    }, { sequelize, modelName: 'Post' });
    return Post;
};