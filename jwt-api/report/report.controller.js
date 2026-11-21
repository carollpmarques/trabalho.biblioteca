const service = require('./report.service');

module.exports = {
  dashboard: async (req, res) => res.json(await service.dashboard()),
};
