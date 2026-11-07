import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getPortalPassword, passwordMatches, PORTAL_COOKIE } from "../../lib/auth";

export async function POST(request: NextRequest) {
  const expected = getPortalPassword();
  if (!expected) return NextResponse.redirect(new URL("/?access=unavailable", request.url), 303);
  const submitted = String((await request.formData()).get("password") ?? "");
  if (!(await passwordMatches(submitted, expected))) return NextResponse.redirect(new URL("/?access=denied", request.url), 303);

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(PORTAL_COOKIE, await createSessionToken(expected), {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
