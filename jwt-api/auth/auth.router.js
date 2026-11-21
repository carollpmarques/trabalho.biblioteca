const router = require('express').Router();
const controller = require('./auth.controller');
const { auth } = require('./auth.middleware');

router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout); // so precisa do refresh token
router.get('/me', auth, controller.me);

module.exports = router;
