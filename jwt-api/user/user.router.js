const router = require('express').Router();
const controller = require('./user.controller');
const { auth, isAdmin } = require('../auth/auth.middleware');

// tudo aqui e so para administrador (POST /v1/user nao e mais publico)
router.use(auth, isAdmin);
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.patch('/:id/active', controller.setActive);

module.exports = router;
