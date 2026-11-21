const bcrypt = require('bcryptjs');
const User = require('./user.model');
const { HttpError } = require('../common/errors');

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

module.exports = {
  list: () => User.findAll({ order: [['id', 'ASC']] }),

  async create({ name, username, email, password, isAdmin }) {
    if (!password) throw new HttpError(400, 'Senha é obrigatória');
    return User.create({ name, username, email, isAdmin: !!isAdmin, password: await bcrypt.hash(password, 10) });
  },

  async update(id, { name, username, email, isAdmin, password }) {
    const user = await User.findByPk(id);
    if (!user) throw new HttpError(404, 'Atendente não encontrado');
    const data = clean({ name, username, email, isAdmin });
    if (password) data.password = await bcrypt.hash(password, 10);
    return user.update(data);
  },

  async setActive(id, active, currentUserId) {
    const user = await User.findByPk(id);
    if (!user) throw new HttpError(404, 'Atendente não encontrado');
    if (Number(id) === currentUserId && !active) throw new HttpError(409, 'Você não pode desativar a si mesmo');
    return user.update({ active: !!active });
  },
};
