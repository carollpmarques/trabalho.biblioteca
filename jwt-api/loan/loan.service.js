const { Op } = require('sequelize');
const { db, Loan, Book, Reader, User } = require('../models');
const { HttpError } = require('../common/errors');

const DAY = 86400000;
const LOAN_DAYS = 7;
const FINE_PER_DAY = 1.0;
const MAX_ACTIVE = 3;

const include = [
  { model: Book, attributes: ['id', 'title', 'isbn'] },
  { model: Reader, attributes: ['id', 'name', 'cpf'] },
  { model: User, attributes: ['id', 'name'] },
];

const lateDays = (due, ref = new Date()) => (ref > due ? Math.ceil((ref - due) / DAY) : 0);

// ATRASADO e calculado: dueDate < hoje e sem returnDate
function present(loan) {
  const j = loan.toJSON();
  if (!j.returnDate) {
    const days = lateDays(new Date(j.dueDate));
    if (days > 0) j.status = 'ATRASADO';
    j.fineDue = days * FINE_PER_DAY; // multa acumulada ate agora
  }
  return j;
}

async function list(status) {
  const now = new Date();
  const where = {};
  if (status === 'ATIVO') Object.assign(where, { returnDate: null, dueDate: { [Op.gte]: now } });
  else if (status === 'ATRASADO') Object.assign(where, { returnDate: null, dueDate: { [Op.lt]: now } });
  else if (status === 'DEVOLVIDO') where.returnDate = { [Op.ne]: null };
  else if (status) throw new HttpError(400, 'status deve ser ATIVO, ATRASADO ou DEVOLVIDO');
  const loans = await Loan.findAll({ where, include, order: [['id', 'DESC']] });
  return loans.map(present);
}

async function byReader(readerId) {
  const loans = await Loan.findAll({ where: { readerId }, include, order: [['id', 'DESC']] });
  return loans.map(present);
}

async function create({ bookId, readerId }, userId) {
  if (!bookId || !readerId) throw new HttpError(400, 'Informe bookId e readerId');
  const id = await db.transaction(async (t) => {
    const reader = await Reader.findByPk(readerId, { transaction: t });
    if (!reader) throw new HttpError(404, 'Leitor não encontrado');
    const book = await Book.findByPk(bookId, { transaction: t });
    if (!book) throw new HttpError(404, 'Livro não encontrado');

    const now = new Date();
    const atrasados = await Loan.count({ where: { readerId, returnDate: null, dueDate: { [Op.lt]: now } }, transaction: t });
    if (atrasados) throw new HttpError(409, 'Leitor possui empréstimo atrasado');
    const ativos = await Loan.count({ where: { readerId, returnDate: null }, transaction: t });
    if (ativos >= MAX_ACTIVE) throw new HttpError(409, `Leitor já possui ${MAX_ACTIVE} empréstimos ativos`);
    if (book.availableCopies <= 0) throw new HttpError(409, 'Livro sem exemplares disponíveis');

    const loan = await Loan.create(
      { bookId, readerId, userId, loanDate: now, dueDate: new Date(now.getTime() + LOAN_DAYS * DAY), status: 'ATIVO' },
      { transaction: t }
    );
    await book.decrement('availableCopies', { by: 1, transaction: t });
    return loan.id;
  });
  return present(await Loan.findByPk(id, { include }));
}

async function giveBack(id) {
  await db.transaction(async (t) => {
    const loan = await Loan.findByPk(id, { transaction: t });
    if (!loan) throw new HttpError(404, 'Empréstimo não encontrado');
    if (loan.returnDate) throw new HttpError(409, 'Empréstimo já foi devolvido');
    const now = new Date();
    await loan.update(
      { returnDate: now, status: 'DEVOLVIDO', fine: lateDays(new Date(loan.dueDate), now) * FINE_PER_DAY },
      { transaction: t }
    );
    await Book.increment('availableCopies', { by: 1, where: { id: loan.bookId }, transaction: t });
  });
  return present(await Loan.findByPk(id, { include }));
}

module.exports = { list, byReader, create, giveBack };
