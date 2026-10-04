export default function getWebsiteLink(website) {
  if (typeof website !== 'string' || !website.trim()) return null;

  const value = website.trim();
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return { href: url.href, label: url.hostname.replace(/^www\./i, '') };
  } catch {
    return null;
  }
}