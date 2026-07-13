import { NextRequest, NextResponse } from 'next/server';

const protectedPrefixes = ['/dashboard', '/tracks', '/lesson', '/profile', '/settings', '/onboarding', '/admin'];
const loggedOutOnlyPaths = ['/login', '/signup'];

/**
 * Protects page routes by checking for the presence of a session cookie.
 * The full session validation happens later in page/API route handlers.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has('session_id');

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isLoggedOutOnlyRoute = loggedOutOnlyPaths.includes(pathname);

  if (isProtectedRoute && !hasSessionCookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedOutOnlyRoute && hasSessionCookie) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
