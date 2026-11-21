const bcrypt = require('bcryptjs');
const User = require('../user/user.model');

// Cria o primeiro administrador se ainda nao existir nenhum
module.exports = async function seedAdmin() {
  if (await User.count({ where: { isAdmin: true } })) return;
  const email = process.env.ADMIN_EMAIL || 'admin@biblioteca.com';
  const password = process.env.ADMIN_PASSWORD || '123456';
  await User.create({
    name: 'Administrador',
    username: 'admin',
    email,
    password: await bcrypt.hash(password, 10),
    isAdmin: true,
  });
  console.log(`Admin criado pelo seed: ${email} / ${password}`);
};
