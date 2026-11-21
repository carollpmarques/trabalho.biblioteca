const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: { msg: 'Nome da categoria é obrigatório' } } },
  description: DataTypes.STRING,
});
