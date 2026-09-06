import { cookies } from "next/headers";

export const PORTAL_COOKIE = "now_now_portal_access";
const SESSION_PREFIX = "now-now-resource-hub:";

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  return bytesToHex(await crypto.subtle.digest("SHA-256", bytes));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function getPortalPassword() {
  return process.env.PORTAL_PASSWORD?.trim() ?? "";
}

export async function createSessionToken(password: string) {
  return digest(`${SESSION_PREFIX}${password}`);
}

export async function passwordMatches(submitted: string, expected: string) {
  const [submittedHash, expectedHash] = await Promise.all([digest(submitted), digest(expected)]);
  return safeEqual(submittedHash, expectedHash);
}

export async function isPortalAuthorized() {
  const password = getPortalPassword();
  if (!password) return false;
  const stored = (await cookies()).get(PORTAL_COOKIE)?.value ?? "";
  return safeEqual(stored, await createSessionToken(password));
}
