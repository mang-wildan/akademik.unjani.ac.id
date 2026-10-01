module.exports = require('./masterDataController')({
  Model: require('../models/Faculty'),
  schema: 'faculty',
  basePath: 'faculties',
  listLabel: 'Fakultas',
  singularLabel: 'Fakultas',
});
