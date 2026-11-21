const { Op } = require('sequelize');
const { db, Book, Author, Category, Loan, BookAuthor } = require('../models');
const { HttpError } = require('../common/errors');

const include = [Category, { model: Author, through: { attributes: [] } }];
const pick = ({ title, isbn, year, totalCopies, categoryId }) =>
  Object.fromEntries(Object.entries({ title, isbn, year, totalCopies, categoryId }).filter(([, v]) => v !== undefined));

async function get(id) {
  const book = await Book.findByPk(id, { include });
  if (!book) throw new HttpError(404, 'Livro não encontrado');
  return book;
}

async function list(q) {
  const where = {};
  if (q.title) where.title = { [Op.like]: `%${q.title}%` };
  if (q.categoryId) where.categoryId = q.categoryId;
  if (q.available === 'true') where.availableCopies = { [Op.gt]: 0 };
  if (q.authorId) {
    const links = await BookAuthor.findAll({ where: { authorId: q.authorId } });
    where.id = links.map((l) => l.bookId);
  }
  return Book.findAll({ where, include, order: [['title', 'ASC']] });
}

async function create(body) {
  const data = pick(body);
  const total = Number(data.totalCopies || 1);
  const id = await db.transaction(async (t) => {
    const book = await Book.create({ ...data, totalCopies: total, availableCopies: total }, { transaction: t });
    if (Array.isArray(body.authorIds)) await book.setAuthors(body.authorIds, { transaction: t });
    return book.id;
  });
  return get(id);
}

async function update(id, body) {
  const book = await get(id);
  const data = pick(body);
  if (data.totalCopies !== undefined) {
    const emprestados = book.totalCopies - book.availableCopies;
    if (Number(data.totalCopies) < emprestados) {
      throw new HttpError(409, `Total não pode ser menor que os ${emprestados} exemplares emprestados`);
    }
    data.availableCopies = Number(data.totalCopies) - emprestados;
  }
  await db.transaction(async (t) => {
    await book.update(data, { transaction: t });
    if (Array.isArray(body.authorIds)) await book.setAuthors(body.authorIds, { transaction: t });
  });
  return get(id);
}

async function remove(id) {
  const book = await get(id);
  const ativos = await Loan.count({ where: { bookId: id, returnDate: null } });
  if (ativos) throw new HttpError(409, 'Livro possui empréstimos ativos e não pode ser excluído');
  await book.setAuthors([]);
  await book.destroy();
}

module.exports = { list, get, create, update, remove };
