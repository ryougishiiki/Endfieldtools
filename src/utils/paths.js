export function withBasePath(path) {
  if (!path) return "";
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(`${cleanBase}${cleanPath}`, window.location.origin).toString();
}
