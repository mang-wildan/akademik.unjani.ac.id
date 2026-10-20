// Strict policy for admin/account pages and the development catalog (NFR-S-05).
// Alpine uses its CSP build with external scripts; public pages keep their policy.
const helmet = require('helmet');

module.exports = helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ['https://www.youtube-nocookie.com', 'https://www.google.com'],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
  },
});
