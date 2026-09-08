import "server-only";

function normalizeBasePath(value: string | undefined) {
  const trimmed = (value || "").trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

function normalizeOrigin(value: string | undefined) {
  return (value || "").trim().replace(/\/+$/, "");
}

export const PORTAL_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
export const PORTAL_PUBLIC_ORIGIN = normalizeOrigin(process.env.PORTAL_PUBLIC_ORIGIN);

export function portalPath(path = "") {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${PORTAL_BASE_PATH}${suffix}` || "/";
}

export function portalPublicUrl(path = "") {
  const pathname = portalPath(path);
  return PORTAL_PUBLIC_ORIGIN ? `${PORTAL_PUBLIC_ORIGIN}${pathname}` : pathname;
}
