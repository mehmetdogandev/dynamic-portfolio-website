import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PREFIX = "/admin-panel";
const PUBLIC_PATHS = [
  `${ADMIN_PREFIX}/login`,
  `${ADMIN_PREFIX}/forgot-password`,
  `${ADMIN_PREFIX}/reset-password`,
];

function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + "/");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }
  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");
  if (!sessionCookie?.value) {
    const loginUrl = new URL(`${ADMIN_PREFIX}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-panel", "/admin-panel/:path*"],
};
