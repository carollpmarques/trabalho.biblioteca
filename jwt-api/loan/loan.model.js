const { DataTypes } = require('sequelize');
const db = require('../config/db');

module.exports = db.define('Loan', {
  loanDate: { type: DataTypes.DATE, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  returnDate: DataTypes.DATE,
  // guardado: ATIVO ou DEVOLVIDO. ATRASADO e calculado na leitura.
  status: { type: DataTypes.STRING, defaultValue: 'ATIVO' },
  fine: { type: DataTypes.FLOAT, defaultValue: 0 },
});
