'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Advertisement extends Model { }
    Advertisement.init({
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        image: DataTypes.STRING,
        link: DataTypes.STRING,
        type: DataTypes.INTEGER
    }, { sequelize, modelName: 'Advertisement' });
    return Advertisement;
};