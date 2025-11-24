'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Contact extends Model { }
    Contact.init({
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        website: DataTypes.STRING,
        message: DataTypes.TEXT,
        isRead: DataTypes.BOOLEAN
    }, { sequelize, modelName: 'Contact' });
    return Contact;
};