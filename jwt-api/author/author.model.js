const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Author', {
  name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Nome do autor é obrigatório' } } },
  nationality: DataTypes.STRING,
  birthDate: DataTypes.DATEONLY,
});
