const ORIGIN_HOST = 'https://wognsben97.mycafe24.com';
const CDN_HOST = 'https://20260408.b-cdn.net';

export const toCdnUrl = (url?: string | null): string => {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith(CDN_HOST)) return trimmed;

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`.replace(ORIGIN_HOST, CDN_HOST);
  }

  if (trimmed.startsWith('/')) {
    return `${CDN_HOST}${trimmed}`;
  }

  return trimmed.replace(ORIGIN_HOST, CDN_HOST);
};