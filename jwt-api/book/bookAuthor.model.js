const db = require('../config/db');

// tabela de ligacao N:N entre Book e Author
module.exports = db.define('BookAuthor', {}, { timestamps: false });
