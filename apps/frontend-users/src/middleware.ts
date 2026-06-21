import { NextResponse, type NextRequest } from 'next/server';

/** Instant gate for /dashboard. Real auth is enforced by the backend; this just
 * avoids flashing the dashboard to a clearly-unauthenticated visitor. */
export function middleware(req: NextRequest) {
  const hasHint = req.cookies.has('wa_auth');
  if (!hasHint) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
