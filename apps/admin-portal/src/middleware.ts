import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  if (!req.cookies.has('wa_auth')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
