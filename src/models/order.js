'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Order extends Model {
        static associate(models) {
            Order.hasMany(models.OrderDetail, { foreignKey: 'orderId', as: 'orderDetails' });
        }
    }
    Order.init({
        code: DataTypes.STRING,
        customerName: DataTypes.STRING,
        phone: DataTypes.STRING,
        address: DataTypes.STRING,
        email: DataTypes.STRING,
        totalAmount: DataTypes.DECIMAL(18, 2),
        quantity: DataTypes.INTEGER,
        typePayment: DataTypes.INTEGER,
        status: DataTypes.INTEGER
    }, { sequelize, modelName: 'Order' });
    return Order;

};