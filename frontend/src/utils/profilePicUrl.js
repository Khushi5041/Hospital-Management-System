/** Resolve profile image URL (proxied /uploads in dev, or full API origin in prod). */
export function profilePicUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}${path}`;
}
