import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasExtension = pathname.includes('.');
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/_next') || hasExtension) {
    return NextResponse.next();
  }
  const session = request.cookies.get('crew_session');
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-crew-role', session.value);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};