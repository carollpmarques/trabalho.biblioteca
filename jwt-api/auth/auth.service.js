const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../user/user.model');
const RefreshToken = require('./refreshToken.model');
const { HttpError } = require('../common/errors');

const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '15m';
const REFRESH_DAYS = 7;

async function issueTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
  const refreshToken = jwt.sign(
    { id: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_DAYS}d` }
  );
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400000),
  });
  return { accessToken, refreshToken, user };
}

async function login(email, password) {
  if (!email || !password) throw new HttpError(400, 'Informe e-mail e senha');
  const user = await User.findOne({ where: { email } });
  // verifica se o usuario existe ANTES de comparar a senha (bug original)
  if (!user) throw new HttpError(401, 'E-mail ou senha inválidos');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new HttpError(401, 'E-mail ou senha inválidos');
  if (!user.active) throw new HttpError(401, 'Usuário desativado');
  return issueTokens(user);
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new HttpError(400, 'Informe o refreshToken');
  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new HttpError(401, 'Refresh token inválido ou expirado');
  }
  const stored = await RefreshToken.findOne({ where: { token: refreshToken } });
  if (!stored) throw new HttpError(401, 'Refresh token inválido');

  // reutilizacao de token ja revogado = possivel roubo: revoga todos do usuario
  if (stored.revoked) {
    await RefreshToken.update({ revoked: true }, { where: { userId: stored.userId } });
    throw new HttpError(401, 'Refresh token reutilizado. Todas as sessões foram encerradas');
  }
  if (stored.expiresAt < new Date()) throw new HttpError(401, 'Refresh token expirado');

  const user = await User.findByPk(stored.userId);
  if (!user || !user.active) throw new HttpError(401, 'Usuário inválido ou desativado');

  // rotacao: revoga o antigo e devolve um par novo
  stored.revoked = true;
  await stored.save();
  return issueTokens(user);
}

async function logout(refreshToken) {
  if (!refreshToken) throw new HttpError(400, 'Informe o refreshToken');
  await RefreshToken.update({ revoked: true }, { where: { token: refreshToken } });
}

async function me(id) {
  const user = await User.findByPk(id);
  if (!user) throw new HttpError(404, 'Usuário não encontrado');
  return user;
}

module.exports = { login, refresh, logout, me };
