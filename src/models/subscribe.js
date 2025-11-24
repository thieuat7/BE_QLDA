'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Subscribe extends Model { }
    Subscribe.init({
        email: DataTypes.STRING
    }, { sequelize, modelName: 'Subscribe' });
    return Subscribe;
};