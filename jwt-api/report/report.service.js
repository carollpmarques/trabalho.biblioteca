const { Op } = require('sequelize');
const { Book, Loan } = require('../models');

module.exports = {
  async dashboard() {
    const now = new Date();
    const [totalBooks, totalCopies, activeLoans, overdueLoans, fines] = await Promise.all([
      Book.count(),
      Book.sum('totalCopies'),
      Loan.count({ where: { returnDate: null } }),
      Loan.count({ where: { returnDate: null, dueDate: { [Op.lt]: now } } }),
      Loan.sum('fine'),
    ]);
    return { totalBooks, totalCopies: totalCopies || 0, activeLoans, overdueLoans, totalFines: fines || 0 };
  },
};
