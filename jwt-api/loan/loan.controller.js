const service = require('./loan.service');

module.exports = {
  list: async (req, res) => res.json(await service.list(req.query.status)),
  create: async (req, res) => res.status(201).json(await service.create(req.body, req.user.id)),
  giveBack: async (req, res) => res.json(await service.giveBack(req.params.id)),
};
