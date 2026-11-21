const Author = require('./author.model');
const { BookAuthor } = require('../models');
const { HttpError } = require('../common/errors');

const pick = ({ name, nationality, birthDate }) =>
  Object.fromEntries(Object.entries({ name, nationality, birthDate }).filter(([, v]) => v !== undefined));

async function get(id) {
  const author = await Author.findByPk(id);
  if (!author) throw new HttpError(404, 'Autor não encontrado');
  return author;
}

module.exports = {
  list: () => Author.findAll({ order: [['id', 'ASC']] }),
  get,
  create: (body) => Author.create(pick(body)),
  async update(id, body) {
    const author = await get(id);
    return author.update(pick(body));
  },
  async remove(id) {
    const author = await get(id);
    if (await BookAuthor.count({ where: { authorId: id } })) {
      throw new HttpError(409, 'Autor possui livros vinculados e não pode ser excluído');
    }
    await author.destroy();
  },
};
