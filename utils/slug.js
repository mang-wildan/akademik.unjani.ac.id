// Slug generation shared by Pengumuman and News (SRS FR-M-01/02).
const slugifyText = text =>
  String(text || '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'untitled';

// Appends -2, -3, ... until the slug is free. `excludeId` lets an edit keep its own slug.
const uniqueSlug = async (Model, title, excludeId) => {
  const base = slugifyText(title);
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
};

module.exports = { slugifyText, uniqueSlug };
