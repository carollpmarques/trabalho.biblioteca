const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Reader', {
  name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Nome do leitor é obrigatório' } } },
  cpf: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: { msg: 'CPF é obrigatório' } } },
  email: { type: DataTypes.STRING, validate: { isEmail: { msg: 'E-mail inválido' } } },
  phone: DataTypes.STRING,
});
