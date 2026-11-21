const service = require('./reader.service');
const loanService = require('../loan/loan.service');

module.exports = {
  list: async (req, res) => res.json(await service.list()),
  get: async (req, res) => res.json(await service.get(req.params.id)),
  create: async (req, res) => res.status(201).json(await service.create(req.body)),
  update: async (req, res) => res.json(await service.update(req.params.id, req.body)),
  loans: async (req, res) => {
    await service.get(req.params.id); // 404 se o leitor nao existe
    res.json(await loanService.byReader(req.params.id));
  },
};
