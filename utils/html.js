// Rich-text handling for berita, pengumuman, profil (SRS FR-P-05, NFR-S-06).
const sanitize = require('sanitize-html');

// What the editor may produce. Links are forced to safe schemes; images only
// from this site's uploads.
const SANITIZE_OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
  allowedAttributes: { a: ['href', 'title', 'target'], img: ['src', 'alt', 'width', 'height'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowedSchemesByTag: { img: [] },
  allowProtocolRelative: false,
  exclusiveFilter: frame => frame.tag === 'img' && !/^\/uploads\//.test(frame.attribs.src || ''),
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
    }),
  },
};
SANITIZE_OPTIONS.allowedAttributes.a.push('rel');

const sanitizeHtml = html => sanitize(String(html || ''), SANITIZE_OPTIONS);

const NAMED_ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", hellip: '…', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', copy: '©', reg: '®', bull: '•',
};

const decodeEntities = text =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });

// Plain-text summary for lists and meta descriptions: tags removed, entities
// decoded once, cut at a word boundary. Escaped by EJS when rendered.
const makeExcerpt = (html, max = 180) => {
  const text = decodeEntities(
    String(html || '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h\d|br|tr)>|<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : text.slice(0, max)).replace(/[\s,.;:–-]+$/, '')}…`;
};

module.exports = { sanitizeHtml, makeExcerpt, decodeEntities };
