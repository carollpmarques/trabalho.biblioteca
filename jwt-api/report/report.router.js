const router = require('express').Router();
const controller = require('./report.controller');
const { auth, isAdmin } = require('../auth/auth.middleware');

router.get('/dashboard', auth, isAdmin, controller.dashboard);

module.exports = router;
