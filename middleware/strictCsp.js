// Content Security Policy for pages built on the new layouts (NFR-S-05).
// No inline scripts or styles: Alpine runs from its CSP build and components
// live in /js/app.js. Old template pages still rely on inline code and CDNs,
// so this is applied per route, not globally, until they are rebuilt.
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
