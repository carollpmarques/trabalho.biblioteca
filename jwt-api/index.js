require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./models');
const seedAdmin = require('./config/seed');
const errorHandler = require('./common/errorHandler');

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('Defina JWT_SECRET e JWT_REFRESH_SECRET no .env (copie o .envex)');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.FRONT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/v1/auth', require('./auth/auth.router'));
app.use('/v1/user', require('./user/user.router'));
app.use('/v1/categories', require('./category/category.router'));
app.use('/v1/authors', require('./author/author.router'));
app.use('/v1/books', require('./book/book.router'));
app.use('/v1/readers', require('./reader/reader.router'));
app.use('/v1/loans', require('./loan/loan.router'));
app.use('/v1/reports', require('./report/report.router'));

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
db.sync()
  .then(seedAdmin)
  .then(() => app.listen(PORT, () => console.log(`SERVIDOR RODANDO http://localhost:${PORT}`)))
  .catch((e) => { console.error(e); process.exit(1); });
