'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SystemSetting extends Model { }
    SystemSetting.init({
        settingKey: { type: DataTypes.STRING, primaryKey: true },
        settingValue: DataTypes.TEXT,
        settingDescription: DataTypes.TEXT
    }, { sequelize, modelName: 'SystemSetting' });
    return SystemSetting;
};