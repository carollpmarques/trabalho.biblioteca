const router = require('express').Router();
const controller = require('./loan.controller');
const { auth } = require('../auth/auth.middleware');

router.use(auth);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/return', controller.giveBack);

module.exports = router;
