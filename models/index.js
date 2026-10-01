// Registers every Mongoose model once, on first require. Without this,
// .populate('ref') throws MissingSchemaError whenever the referenced model's
// file happens not to have been required yet by the code path that runs
// first — it did, for LembagaAkreditasi, the first time /akreditasi ran.
// server.js requires this before any route is mounted.
const fs = require('fs');
const path = require('path');

for (const file of fs.readdirSync(__dirname)) {
  if (file !== 'index.js' && file.endsWith('.js')) require(path.join(__dirname, file));
}
