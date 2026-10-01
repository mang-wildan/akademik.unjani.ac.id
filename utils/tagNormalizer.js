function normalizeSingleTag(value) {
  if (value == null) return '';

  const cleaned = String(value)
    .replace(/^#+/, '')
    .replace(/^[\[\]\{\}"']+/, '')
    .replace(/[\[\]\{\}"']+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

function safeParseJson(raw) {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

function normalizeTags(raw) {
  const out = [];
  const seen = new Set();

  const push = value => {
    const tag = normalizeSingleTag(value);
    if (!tag) return;

    const key = tag.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    out.push(tag);
  };

  const extractFromString = input => {
    const text = String(input || '').trim();
    if (!text) return;

    const parsed = safeParseJson(text);
    if (parsed !== null) {
      extract(parsed);
      return;
    }

    const valueMatches = [...text.matchAll(/["']?value["']?\s*:\s*["']([^"']+)["']/gi)];
    if (valueMatches.length) {
      valueMatches.forEach(match => push(match[1]));
      return;
    }

    if (text.includes(',')) {
      text.split(',').forEach(part => extractFromString(part));
      return;
    }

    push(text);
  };

  const extract = value => {
    if (value == null) return;

    if (Array.isArray(value)) {
      value.forEach(extract);
      return;
    }

    if (typeof value === 'object') {
      if (Object.prototype.hasOwnProperty.call(value, 'value')) {
        extract(value.value);
        return;
      }

      if (Object.keys(value).length) {
        extractFromString(JSON.stringify(value));
      }
      return;
    }

    extractFromString(value);
  };

  extract(raw);
  return out;
}

module.exports = {
  normalizeTags,
};
