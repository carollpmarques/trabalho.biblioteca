const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Book', {
  title: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Título é obrigatório' } } },
  isbn: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: { msg: 'ISBN é obrigatório' } } },
  year: DataTypes.INTEGER,
  totalCopies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: { args: [1], msg: 'Total de exemplares deve ser ao menos 1' } } },
  availableCopies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
});
