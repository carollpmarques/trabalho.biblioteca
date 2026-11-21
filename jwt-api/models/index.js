// Carrega todos os models e define as associacoes
const db = require('../config/db');
const User = require('../user/user.model');
const RefreshToken = require('../auth/refreshToken.model');
const Category = require('../category/category.model');
const Author = require('../author/author.model');
const Book = require('../book/book.model');
const Reader = require('../reader/reader.model');
const Loan = require('../loan/loan.model');

const BookAuthor = require('../book/bookAuthor.model');

// 1:N
Category.hasMany(Book, { foreignKey: 'categoryId' });
Book.belongsTo(Category, { foreignKey: 'categoryId' });
Reader.hasMany(Loan, { foreignKey: 'readerId' });
Loan.belongsTo(Reader, { foreignKey: 'readerId' });
Book.hasMany(Loan, { foreignKey: 'bookId' });
Loan.belongsTo(Book, { foreignKey: 'bookId' });
User.hasMany(Loan, { foreignKey: 'userId' });
Loan.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// N:N
Book.belongsToMany(Author, { through: BookAuthor, foreignKey: 'bookId', otherKey: 'authorId' });
Author.belongsToMany(Book, { through: BookAuthor, foreignKey: 'authorId', otherKey: 'bookId' });

module.exports = { db, User, RefreshToken, Category, Author, Book, Reader, Loan, BookAuthor };
