// In-memory cache for the SiteSetting singleton (NFR-P-05). Read on every
// request before this (global middleware + up to 3 controllers each ran
// their own `SiteSetting.findOne()`); now cached in process memory and
// invalidated explicitly whenever the document is saved.
const SiteSetting = require('../models/SiteSetting');

let cached = null;
let loaded = false;

const get = async () => {
  if (!loaded) {
    cached = await SiteSetting.findOne().lean();
    loaded = true;
  }
  return cached;
};

// Called by siteSettingController after every create/update so the next
// request (and res.locals.siteSetting for the one currently in flight,
// where callers pass the fresh document directly) sees the new values.
const invalidate = (fresh = null) => {
  cached = fresh;
  loaded = fresh !== null;
};

module.exports = { get, invalidate };
