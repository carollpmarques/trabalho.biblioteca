const { DataTypes } = require('sequelize');
const db = require('../config/db');

const User = db.define('User', {
  name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Nome é obrigatório' } } },
  username: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: { msg: 'Username é obrigatório' } } },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: { msg: 'E-mail inválido' } } },
  password: { type: DataTypes.STRING, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// nunca devolver a senha nas respostas
User.prototype.toJSON = function () {
  const v = { ...this.get() };
  delete v.password;
  return v;
};

module.exports = User;
