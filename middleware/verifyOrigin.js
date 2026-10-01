// CSRF defence for every state-changing request: browsers always send Origin
// on POST, so a form submitted from another site (including another
// *.unjani.ac.id subdomain, which SameSite cookies treat as same-site) is
// rejected. Requests with neither Origin nor Referer come from non-browser
// clients that carry no ambient cookies, so they are let through.
//
// Behind a proxy that rewrites Host, set APP_ORIGIN (e.g. https://baa.unjani.ac.id).
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const hostnameOf = value => {
  try {
    return new URL(value).hostname;
  } catch (_err) {
    return null; // includes the literal "null" origin
  }
};

module.exports = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const source = req.get('origin') || req.get('referer');
  if (!source) return next();

  const allowed = new Set([req.hostname]);
  if (process.env.APP_ORIGIN) allowed.add(hostnameOf(process.env.APP_ORIGIN));

  if (allowed.has(hostnameOf(source))) return next();

  const err = new Error('Permintaan ditolak karena dikirim dari situs lain. Muat ulang halaman lalu coba lagi.');
  err.status = 403;
  err.expose = true;
  return next(err);
};
