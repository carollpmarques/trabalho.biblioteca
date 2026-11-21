const Category = require('./category.model');
const Book = require('../book/book.model');
const { HttpError } = require('../common/errors');

const pick = ({ name, description }) =>
  Object.fromEntries(Object.entries({ name, description }).filter(([, v]) => v !== undefined));

async function get(id) {
  const category = await Category.findByPk(id);
  if (!category) throw new HttpError(404, 'Categoria não encontrada');
  return category;
}

module.exports = {
  list: () => Category.findAll({ order: [['id', 'ASC']] }),
  get,
  create: (body) => Category.create(pick(body)),
  async update(id, body) {
    const category = await get(id);
    return category.update(pick(body));
  },
  async remove(id) {
    const category = await get(id);
    if (await Book.count({ where: { categoryId: id } })) {
      throw new HttpError(409, 'Categoria possui livros vinculados e não pode ser excluída');
    }
    await category.destroy();
  },
};
