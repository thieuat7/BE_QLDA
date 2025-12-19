'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // User có thể có nhiều đơn hàng
            User.hasMany(models.Order, { foreignKey: 'customerEmail', sourceKey: 'email', as: 'orders' });
        }
    }
    User.init({
        id: { type: DataTypes.STRING(128), primaryKey: true }, // Giữ ID dạng chuỗi của .NET cũ
        fullName: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        userName: DataTypes.STRING,
        passwordHash: DataTypes.STRING,
        role: { type: DataTypes.STRING, defaultValue: 'user' },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users'
    });
    return User;
};