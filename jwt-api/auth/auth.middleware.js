const jwt = require('jsonwebtoken');

// Valida o access token. Token ausente/invalido/expirado => 401 (o front usa isso para renovar)
function auth(req, res, next) {
  const [type, token] = (req.headers.authorization || '').split(' ');
  if (type !== 'Bearer' || !token) return res.status(401).json({ message: 'Token não informado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

// Somente administrador => 403 para atendente
function isAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = { auth, isAdmin };
