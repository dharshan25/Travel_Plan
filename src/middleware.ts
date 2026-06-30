import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Check for crew_session cookie
  const session = request.cookies.get('crew_session');
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Attach role to request headers so pages can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-crew-role', session.value);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};