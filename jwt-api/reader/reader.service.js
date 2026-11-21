const Reader = require('./reader.model');
const { HttpError } = require('../common/errors');

const pick = ({ name, cpf, email, phone }) =>
  Object.fromEntries(Object.entries({ name, cpf, email, phone }).filter(([, v]) => v !== undefined));

async function get(id) {
  const reader = await Reader.findByPk(id);
  if (!reader) throw new HttpError(404, 'Leitor não encontrado');
  return reader;
}

module.exports = {
  list: () => Reader.findAll({ order: [['id', 'ASC']] }),
  get,
  create: (body) => Reader.create(pick(body)),
  async update(id, body) {
    const reader = await get(id);
    return reader.update(pick(body));
  },
};
