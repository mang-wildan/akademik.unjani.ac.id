module.exports = require('./masterDataController')({
  Model: require('../models/LembagaAkreditasi'),
  schema: 'lembagaAkreditasi',
  basePath: 'lembaga-akreditasi',
  listLabel: 'Lembaga Akreditasi',
  singularLabel: 'Lembaga',
  hasUrutan: true,
});
