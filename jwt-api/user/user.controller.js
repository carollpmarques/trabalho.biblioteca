const service = require('./user.service');

module.exports = {
  list: async (req, res) => res.json(await service.list()),
  create: async (req, res) => res.status(201).json(await service.create(req.body)),
  update: async (req, res) => res.json(await service.update(req.params.id, req.body)),
  setActive: async (req, res) => res.json(await service.setActive(req.params.id, req.body.active, req.user.id)),
};
