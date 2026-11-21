const service = require('./auth.service');

module.exports = {
  login: async (req, res) => res.json(await service.login(req.body.email, req.body.password)),
  refresh: async (req, res) => res.json(await service.refresh(req.body.refreshToken)),
  logout: async (req, res) => { await service.logout(req.body.refreshToken); res.status(204).end(); },
  me: async (req, res) => res.json(await service.me(req.user.id)),
};
