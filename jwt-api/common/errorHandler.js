const { HttpError } = require('./errors');

module.exports = (err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: `Já existe um registro com esse valor (${err.errors.map((e) => e.path).join(', ')})` });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.errors.map((e) => e.message).join('; ') });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: 'Referência inválida (categoria, autor, livro ou leitor não existe)' });
  }
  if (err.status && err.status < 500) return res.status(err.status).json({ message: 'Requisição inválida' });
  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor' });
};
