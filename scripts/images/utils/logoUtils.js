export function slugify(name) {
  if (!name) return 'untitled';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

export function looksNumericBase(basename) {
  if (!basename) return false;
  return /^\d+[_-]/.test(basename) || /^\d{8,}$/.test(basename);
}

export function filenameFromUrl(url) {
  if (!url) return '';
  try {
    const parts = String(url).split('/');
    return parts.pop() || '';
  } catch (e) {
    return '';
  }
}
